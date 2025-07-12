import * as THREE from 'three';
import * as Blocks from './game_components/blocks.js';
import { saveLevelFile, sendLevelData } from './utilities/exportLevel.js';
import { triggerFileImport } from './utilities/importLevel.js';
import { ListOfGrids } from './game_components/listOfGrids.js';
import initCheckerFunction from './utilities/jsonChecker.js';

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width  = Math.floor( canvas.clientWidth  * pixelRatio );
    const height = Math.floor( canvas.clientHeight * pixelRatio );
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
    renderer.setSize(width, height, false);
    }
    return needResize;
}

function initApplication(){
    const gameContainer = document.getElementById("game-container");
    const canvas = document.getElementById("game-canvas");
    const scene = new THREE.Scene();
    //used to scale camera
    const aspect = window.innerWidth / window.innerHeight;
    //half of vertical view size
    const camera = new THREE.OrthographicCamera(
        - ORTHOGRAPHIC_CAMERA_HALF_HEIGHT * aspect, 
        ORTHOGRAPHIC_CAMERA_HALF_HEIGHT * aspect, 
        ORTHOGRAPHIC_CAMERA_HALF_HEIGHT, 
        - ORTHOGRAPHIC_CAMERA_HALF_HEIGHT, 
        1, 1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight, false);
    renderer.sortObjects = true;

    // window.addEventListener('resize', () => {
    //     console.log('container size:', gameContainer.clientWidth, gameContainer.clientHeight);
    //     console.log('canvas size:', canvas.clientWidth, canvas.clientHeight);
    // });
    return [gameContainer, canvas, scene, camera, renderer];
}

function createLight(colorParam){
    const color = colorParam;
    const intensity = 4;
    return new THREE.DirectionalLight(color, intensity);
}

function movePlayerInGrid(grid, player, direction){
    //stop if grid is null
    if(!grid) return;

    //preliminary check to restrict only players to be able to use this function
    if((player instanceof Blocks.Player) == false) return;

    const directionVectors = {
        [Blocks.PlayerAction.LEFT]: [0, -1, 0],
        [Blocks.PlayerAction.RIGHT]: [0, 1, 0],
        [Blocks.PlayerAction.UP]: [0, 0, 1],
        [Blocks.PlayerAction.DOWN]: [0, 0, -1],
    };

    //grabs new position difference based on the direction specified
    const positionDiffs = directionVectors[direction] ?? [NaN, NaN, NaN];
    const newPosition = player.getPosition().map((value, index) => value + positionDiffs[index]);
    //gets the predicted pushable block's new position (assumed to go in the same direction)
    const newPushableBlockPosition = player.getPosition().map((value, index) => value + 2*positionDiffs[index]);
    //gets the predicted pullable block's current position (assumed to go in the opposite direction)
    const newPullableBlockPosition = player.getPosition().map((value, index) => value - positionDiffs[index]);

    if(newPosition.some(element => isNaN(element)) || 
        positionDiffs.some(element => isNaN(element)) || 
        grid.checkCoordinateInBounds(...newPosition) == false){
        return;
    }

    //Future idea: When checking to change floors, two options: make a special case for checking in bounds
    //or make the grid size n+1 * m, n+1 denoting the position where the changing floor block resides

    //check if player's next tile is a walkable tile
    if(grid.isBlockBelowWalkable(...newPosition) == false){
        return;
    }
    //check if player attempts to use multiple actions at once
    if(player.getActionState(Blocks.PlayerAction.PULL) == true 
        && player.getActionState(Blocks.PlayerAction.INTERACT) == true){
        console.log("Player is not allowed to perform two actions at the same time");
        return;
    }
    //check if player is not pulling or interacting (default move = pushing)
    else if(player.getActionState(Blocks.PlayerAction.PULL) == false 
        && player.getActionState(Blocks.PlayerAction.INTERACT) == false){
        //check if a pushable block is in front of the player
        if(grid.isBlockPushable(...newPosition)){
            //check if pushable block will stay in bounds
            if(grid.checkCoordinateInBounds(...newPushableBlockPosition) == false){
                console.log("Pushable block can't go out of bounds");
                return;
            }
            //check if the new position is passable
            if(grid.isBlockPassable(...newPushableBlockPosition, direction) == false){
                console.log("Player can't push current pushable block");
                return;
            }
            //(ignore if the ground below is solid for now, check after pushing)

            //apply change if prerequisites are met
            grid.swapBlocks(...newPosition, ...newPushableBlockPosition);
            grid.swapBlocks(...player.getPosition(), ...newPosition);
            console.log("Current target spaces all filled from pushable block: " + grid.verifyTargetSpaces());
        }
        else{
            //non-pushable block, check if block is passable instead
            if(grid.isBlockPassable(...newPosition, direction) == false){
                console.log("Player attempting to move to impassable location");
                return;
            }
            grid.swapBlocks(...player.getPosition(), ...newPosition);
            console.log("Current target spaces all filled: " + grid.verifyTargetSpaces());
        }
    }
    //checks if the player is pulling and not interacting
    else if(player.getActionState(Blocks.PlayerAction.PULL) == true
        && player.getActionState(Blocks.PlayerAction.INTERACT) == false){
        //check if position to pull from is in bounds
        if(grid.checkCoordinateInBounds(...newPullableBlockPosition) == false){
            console.log("Pullable block can't be out of bounds");
            return;
        }
        //check if block behind player is pullable
        if(grid.isBlockPullable(...newPullableBlockPosition) == false){
            console.log("Block behind player is not pullable");
            return;
        }
        //check if block being pulled ends up in a passable position (specific to directional targets)
        if(grid.isBlockPassable(...player.getPosition(), direction) == false){
            console.log("Player attempting to pull block into invalid direction");
            return;
        }
        //check if new position of player is passable
        if(grid.isBlockPassable(...newPosition, direction) == false){
            console.log("Player attempting to move to impassable location (currently pulling)");
            return;
        }
        const oldPlayerPosition = player.getPosition();
        //apply change if prerequisites are met
        grid.swapBlocks(...player.getPosition(), ...newPosition);
        grid.swapBlocks(...newPullableBlockPosition, ...oldPlayerPosition);
        console.log("Current target spaces all filled from pullable block: " + grid.verifyTargetSpaces());
    }

    /*
    Possible future cases:
    - Pushing/pulling from elevated levels (if floors can be different heights).
    - Multiple input state conflicts (e.g. if Shift + Interact is a future mechanic).
    - Undo history support (you may want to store previous positions of both player and block).
    - Simultaneous move requests (from holding a key).
    */
}

const ORTHOGRAPHIC_CAMERA_HALF_HEIGHT = 5;

const [gameContainer, canvas, scene, camera, renderer] = initApplication();
scene.background = new THREE.Color("rgb(150, 150, 150)");
const light = createLight(0xffffff);
light.position.set(0, 2, 4);
scene.add(light);
let listOfGrids = new ListOfGrids(scene);

function updateCameraIfResized(){
    if (resizeRendererToDisplaySize(renderer)) {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left   = -ORTHOGRAPHIC_CAMERA_HALF_HEIGHT * aspect;
        camera.right  =  ORTHOGRAPHIC_CAMERA_HALF_HEIGHT * aspect;
        camera.top    =  ORTHOGRAPHIC_CAMERA_HALF_HEIGHT;
        camera.bottom = -ORTHOGRAPHIC_CAMERA_HALF_HEIGHT;
        camera.updateProjectionMatrix();
    }
}

const keyStates = {
    "w": false, "ArrowUp": false, 
    "a": false, "ArrowLeft": false, 
    "s": false, "ArrowDown": false, 
    "d": false, "ArrowRight": false,
    "Shift": false, 
    "e": false
};

const movementBindings = [
    { keys: ["w"], action: Blocks.PlayerAction.UP },
    { keys: ["a"], action: Blocks.PlayerAction.LEFT },
    { keys: ["s"], action: Blocks.PlayerAction.DOWN },
    { keys: ["d"], action: Blocks.PlayerAction.RIGHT }
];

const cameraBindings = [
    { keys: ["ArrowUp"], action: [0, 1, 0] },
    { keys: ["ArrowLeft"], action: [-1, 0, 0] },
    { keys: ["ArrowRight"], action: [1, 0, 0] },
    { keys: ["ArrowDown"], action: [0, -1, 0] }
];

function updateCameraPosition(camera){
    for(const { keys, action } of cameraBindings){
        const isKeyHeld = keys.some(keyValue => keyStates[keyValue]);
        //check if key is held down and action is not perfomed yet
        if(isKeyHeld){
            camera.position.x += action[0];
            camera.position.y += action[1];
            camera.position.z += action[2];
        }
    }
}

function updatePlayerActions(grid){
    if(!grid || grid.getPlayer() instanceof Blocks.Player == false){
        return;
    }
    //check player interaction for pulling
    grid.getPlayer().toggleActionState(keyStates["Shift"], Blocks.PlayerAction.PULL);

    for(const { keys, action } of movementBindings){
        const isKeyHeld = keys.some(keyValue => keyStates[keyValue]);
        //check if key is held down and action is not perfomed yet
        if(isKeyHeld && !grid.getPlayer().getActionState(action)){
            grid.getPlayer().toggleActionState(true, action);
            movePlayerInGrid(grid, grid.getPlayer(), action);
        }
        //check if key is no longer held down, unlocks movement for future keypresses
        if(!isKeyHeld){
            grid.getPlayer().toggleActionState(false, action);
        }
    }
}

function animate(){
    updateCameraIfResized();
    updatePlayerActions(listOfGrids.getCurrentGrid());
    updateCameraPosition(camera);
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('keydown', (event) => {
    let key = event.key;
    if(key.length === 1) key = key.toLowerCase();
    if(keyStates.hasOwnProperty(key)){
        keyStates[key] = true;
    }

    const isMac = navigator.userAgent.toUpperCase().includes("MAC");
    const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;
    if(isCtrlOrCmd){
        switch (key) {
            case "e":
                event.preventDefault();
                // Sent to backend server, not needed for now
                // sendLevelData(grid.convertToJSONString(legends));
                saveLevelFile(listOfGrids.getJSONfromLevel(legends));
                break;
            case "i":
                event.preventDefault();
                triggerFileImport().
                then((jsonData) => {
                    console.log("Imported JSON: ", jsonData);
                    listOfGrids.initLevelFromJSON(jsonData, legends);
                })
                .catch((err) => {
                    console.error("Import failed:", err);
                });
                break;
        }
    }
});

window.addEventListener('keyup', (event) => {
    let key = event.key;
    if(key.length === 1) key = key.toLowerCase();
    if(keyStates.hasOwnProperty(key)){
        keyStates[key] = false;
    }
});

window.addEventListener('exit', () => {
    listOfGrids.destroyLevels();
    listOfGrids = null;
});

let legends = null;
async function loadLegends() {
    if(legends) return legends;
    let legendData = null;
    try{
        const response = await fetch(`/api/legends.json`);
        if(!response.ok) throw new Error('Legend not found');
        legendData = await response.json();
    } catch (err) {
        console.error(err.message);
    }
    if(legendData){
        legends = legendData;
    }
}

const checkJSONFile = initCheckerFunction();
async function loadLevel(levelName) {
    await loadLegends();
    let levelData = null;
    try{
        const response = await fetch(`/api/levels/${levelName}`);
        if(!response.ok) throw new Error('Level not found');
        levelData = await response.json();
    } catch (err) {
        console.error(err.message);
    }
    if(levelData){
        if (!checkJSONFile(levelData)) {
            console.error(checkJSONFile.errors);
            alert("Level file has errors. See console.");
            throw new Error("Invalid file format");
        }
        //Level loading starts here
        listOfGrids.initLevelFromJSON(levelData, legends);
    }
}

const buttons = document.querySelectorAll(".loadLevel-btn");

buttons.forEach(button => {
    button.addEventListener("click", (value) => {
        const levelNum = value.currentTarget.dataset.value;
        listOfGrids.destroyLevels();
        loadLevel('level' + levelNum);
    });
})

loadLevel('level1');

const exportButton = document.getElementById("level-file-export");
exportButton.addEventListener("click", () => {
    saveLevelFile(listOfGrids.getJSONfromLevel(legends))
});

const importButton = document.getElementById("level-file-import");
importButton.addEventListener("click", () => {
    triggerFileImport().
    then((jsonData) => {
        console.log("Imported JSON: ", jsonData);
        listOfGrids.destroyLevels();
        listOfGrids.generateLevelFromJSON(jsonData);
    })
    .catch((err) => {
        console.error("Import failed:", err);
    });
});