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
    if(newPosition.some(element => isNaN(element)) == false && 
        positionDiffs.some(element => isNaN(element)) == false &&
        grid.checkCoordinateInBounds(...newPosition) && 
        grid.isBlockBelowWalkable(...newPosition) && 
        grid.isBlockPassable(...newPosition)){
            grid.swapBlocks(...item.getPosition(), ...newPosition);
    }
}

const [gameContainer, canvas, scene, camera, renderer] = initApplication();
scene.background = new THREE.Color("rgb(150, 150, 150)");
const light = createLight(0xffffff);
light.position.set(-1, 2, 4);
scene.add(light);

//Format: Height, Columns, Rows
const dimensions = [2, 3, 5];
let grid = new GridOfBlocks(...dimensions);

for(let i = 0; i < grid.getCols(); i++){
    for(let j = 0; j < grid.getRows(); j++){
        grid.addBlockToGrid(BlockType.FLOOR, 1, i+1, j+1);
    }
}
grid.addIsometricRotation();
grid.addOffset(-1.5, -0.5, 0);
grid.removeBlock(1, 2, 2);
grid.addBlockToGrid(BlockType.WALL, 2, 2, 4);
const playerObject = grid.addBlockToGrid(BlockType.PLAYER, 2, 1, 1);
const pushableObject = grid.addBlockToGrid(BlockType.PUSHABLE, 2, 2, 3);

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
