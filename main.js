import * as THREE from 'three';
import { GridOfBlocks } from './grid';
import { BlockType } from './blocks';

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
    const d = 5;
    const camera = new THREE.OrthographicCamera(
        - d * aspect, d * aspect, d, - d, 1, 1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);


    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight, false);

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

function moveItemInGrid(grid, item, direction){
    let positionDiffs = [NaN, NaN, NaN];
    if(direction == "L"){
        positionDiffs = [0, -1, 0];
    }
    if(direction == "R"){
        positionDiffs = [0, 1, 0];
    }
    if(direction == "U"){
        positionDiffs = [0, 0, -1];
    }
    if(direction == "D"){
        positionDiffs = [0, 0, 1];
    }
    const newPosition = item.getPosition().map((value, index) => value + positionDiffs[index]);

    if(newPosition.some(element => isNaN(element)) || 
        positionDiffs.some(element => isNaN(element)) || 
        grid.checkCoordinateInBounds(...newPosition) == false){
        return;
    }

    //Idea: When checking to change floors, two options: make a special case for checking in bounds
    //or make the grid size n+1 * m, n+1 denoting the position where the changing floor block resides

    //check if player's next tile is a walkable tile
    if(grid.isBlockBelowWalkable(...newPosition) == false){
        return;
    }
    //check if block in front is pushable
    if(grid.isBlockPushable(...newPosition)){
        //check if pushable block can be moved (assumed to go in the same direction)
        const newPushableBlockPosition = newPosition.map((value, index) => value + positionDiffs[index]);
        //check if pushable block will stay in bounds
        if(grid.checkCoordinateInBounds(...newPushableBlockPosition) == false){
            console.log("Pushable block can't go out of bounds");
            return;
        }
        //check if the new position is passable
        if(grid.isBlockPassable(...newPushableBlockPosition) == false){
            console.log("Player can't push current pushable block");
            return;
        }
        //(ignore if the ground below is solid for now, check after pushing)

        //apply change if prerequisites are met
        grid.swapBlocks(...newPosition, ...newPushableBlockPosition);
        grid.swapBlocks(...item.getPosition(), ...newPosition);
        console.log("Current target spaces all filled from pushable: " + grid.verifyTargetSpaces());
    }
    else{
        //non-pushable block, check if block is passable instead
        if(grid.isBlockPassable(...newPosition)){
            //optional check: check if new block is a goal state, in which case do sth else
            grid.swapBlocks(...item.getPosition(), ...newPosition);
        }
        console.log("Current target spaces all filled: " + grid.verifyTargetSpaces());
    }
}

const [gameContainer, canvas, scene, camera, renderer] = initApplication();
scene.background = new THREE.Color("rgb(150, 150, 150)");
const light = createLight(0xffffff);
light.position.set(0, 2, 4);
scene.add(light);

//Format: Height, Columns, Rows
const dimensions = [2, 6, 8];
let grid = new GridOfBlocks(...dimensions);

for(let i = 0; i < grid.getCols(); i++){
    for(let j = 0; j < grid.getRows(); j++){
        grid.addBlockToGrid(BlockType.FLOOR, 1, i+1, j+1);
    }
}
grid.addIsometricRotation();
grid.addOffset(-3, -2, 0);

grid.removeBlock(1, 2, 2);
grid.removeBlock(1, 5, 5);

grid.addBlockToGrid(BlockType.WALL, 2, 2, 4);
grid.addBlockToGrid(BlockType.WALL, 2, 2, 5);
grid.addBlockToGrid(BlockType.WALL, 2, 4, 5);

const playerObject = grid.addBlockToGrid(BlockType.PLAYER, 2, 1, 1);

grid.addBlockToGrid(BlockType.PUSHABLE, 2, 2, 3);
grid.addBlockToGrid(BlockType.PUSHABLE, 2, 3, 6);

grid.addBlockToGrid(BlockType.TARGET, 2, 3, 5);
grid.addBlockToGrid(BlockType.TARGET, 2, 5, 7);

grid.attachToItem(scene);

function animate(){
    if (resizeRendererToDisplaySize(renderer)) {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 5;
        camera.left   = -d * aspect;
        camera.right  =  d * aspect;
        camera.top    =  d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('keydown', (event) => {
    if(event.key == "w" || event.key == "ArrowUp"){
        moveItemInGrid(grid, playerObject, "U");
    }
    if(event.key == "a" || event.key == "ArrowLeft"){
        moveItemInGrid(grid, playerObject, "L");
    }
    if(event.key == "s" || event.key == "ArrowDown"){
        moveItemInGrid(grid, playerObject, "D");
    }
    if(event.key == "d" || event.key == "ArrowRight"){
        moveItemInGrid(grid, playerObject, "R");
    }
})
