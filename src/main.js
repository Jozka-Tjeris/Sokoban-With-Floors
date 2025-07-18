import * as THREE from 'three';
import { saveLevelFile, sendLevelData } from './utilities/exportLevel.js';
import { triggerFileImport } from './utilities/importLevel.js';
import { ListOfGrids } from './game_components/listOfGrids.js';
import initCheckerFunction from './utilities/jsonChecker.js';

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width  = Math.floor( canvas.clientWidth  * pixelRatio );
    const height = Math.floor( canvas.clientHeight * pixelRatio );

    if (!canvas.clientWidth || !canvas.clientHeight || isNaN(width) || isNaN(height)) {
        console.warn("resizeRendererToDisplaySize: invalid canvas dimensions", canvas.clientWidth, canvas.clientHeight);
        return false;
    }

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

const ORTHOGRAPHIC_CAMERA_HALF_HEIGHT = 5;
export const activeAnimationList = [];
export const animationDuration = 200;
export const teleportAnimationDuration = 500;

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
    "Shift": false
};

const cameraBindings = [
    { keys: ["ArrowUp"], action: [0, 0.05, 0] },
    { keys: ["ArrowLeft"], action: [-0.05, 0, 0] },
    { keys: ["ArrowRight"], action: [0.05, 0, 0] },
    { keys: ["ArrowDown"], action: [0, -0.05, 0] }
];

function updateAnimationList(currentTime){
    for(let i = activeAnimationList.length - 1; i >= 0; i--){
        const currentAnimation = activeAnimationList[i];
        const elapsedTime = currentTime - currentAnimation.startTime;
        //the phase of animation (0 to duration)
        const t = Math.min(elapsedTime / currentAnimation.duration, 1);

        currentAnimation.object.position.lerpVectors(currentAnimation.startPos, currentAnimation.endPos, t);
        currentAnimation.changeOpacity?.(t);

        if (t >= 1){
            currentAnimation.object.position.copy(currentAnimation.endPos);
            currentAnimation.finalizeOpacity?.();
            //remove finished animation
            activeAnimationList.splice(i, 1);
            currentAnimation.onComplete?.();
        }
    }
    if(listOfGrids.getCheckTeleporters() && activeAnimationList.length === 0){
        listOfGrids.checkAllTeleporters();
        listOfGrids.setCheckTeleporters(false);
    }
}

function updateCameraPosition(){
    for(const { keys, action } of cameraBindings){
        const isKeyHeld = keys.some(keyValue => keyStates[keyValue]);
        //check if key is held down and action is not perfomed yet
        if(isKeyHeld){
            listOfGrids.moveCameraInGrid(...action);
        }
    }
}

function animate(now){
    updateCameraIfResized();
    updateAnimationList(now);
    listOfGrids.updatePlayerActions(keyStates);
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
        console.log(THREE.Cache.files); // Any leftover files
        console.log(renderer.info.memory);
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

loadLevel('level3');

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
