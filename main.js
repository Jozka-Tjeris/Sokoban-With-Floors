import * as THREE from 'three';

class GridOfBlocks{
    gridGroup = new THREE.Object3D();
    //Outermost layer stores floors
    //The second inner layer stores the columns
    //The innermost layer stores the column length
    gridArray = [];
    isSolid = [];
    floors;
    rows;
    cols;
    
    initDimensions(col, row){
        this.floors = 0;
        this.cols = col;
        this.rows = row;
    }

    addFloor(){
        this.gridArray.push([]);
        this.isSolid.push([]);
        for(let i = 0; i < this.cols; i++){
            this.gridArray[this.floors].push([])
            this.isSolid[this.floors].push([])
            for(let j = 0; j < this.rows; j++){
                this.gridArray[this.floors][i].push(null);
                this.isSolid[this.floors][i].push(false);
            }
        }
        this.floors++;
        console.log(this.isSolid)
    }

    addBlockToGrid(floor, col, row){
        let cubeColor = 0x00ff00;
        if((row - 1 + floor - 1 + (col - 1) * -1) % 2 != 0) cubeColor = 0xff0000;
        const cube = createCube(cubeColor);
        addPositionToItem(cube, col - 1, floor - 1, (row - 1) * -1);
        this.gridArray[floor - 1][col - 1][row - 1] = cube;
        this.isSolid[floor - 1][col - 1][row - 1] = true;
        this.gridGroup.add(cube);
    }

    addOffset(x, y, z){
        addPositionToItem(this.gridGroup, x, y, z);
    }

    removeBlock(floor, col, row){
        this.gridGroup.remove(this.gridArray[floor - 1][col - 1][row - 1]);
        this.isSolid[floor - 1][col - 1][row - 1] = false;
    }

    addToScene(scene){
        scene.add(this.gridGroup);
    }

    addIsometricRotation(){
        applyIsometricRotation(this.gridGroup);
    }

    // checkCoordinateInBounds(floor, row, col){
    //     if(floor < 1 || floor > this.floors) return false;
    //     if(row < 1 || row > this.rows) return false;
    //     if(col < 1 || col > this.cols) return false;
    // }

    isBlockBelowWalkable(floor, col, row){
        console.log(this.isSolid[floor - 1][col][row*-1])
        return this.isSolid[floor - 1][col][row*-1];
    }

    isBlockPassable(floor, col, row){
        console.log(!this.isSolid[floor][col][row*-1])
        return !this.isSolid[floor][col][row*-1];
    }
}

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
    const camera = new THREE.PerspectiveCamera(75, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight, false);

    // window.addEventListener('resize', () => {
    //     console.log('container size:', gameContainer.clientWidth, gameContainer.clientHeight);
    //     console.log('canvas size:', canvas.clientWidth, canvas.clientHeight);
    // });
    return [gameContainer, canvas, scene, camera, renderer];
}

function createCube(colorParam){
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial( {color: colorParam} );
    const cube = new THREE.Mesh(geometry, material);
    
    return cube;
}

function addPositionToItem(item, x, y, z){
    item.position.x += x;
    item.position.y += y;
    item.position.z += z;
}

function createLight(colorParam){
    const color = colorParam;
    const intensity = 4;
    return new THREE.DirectionalLight(color, intensity);
}

function QRotateDegreesObject3DAxis(item, axis, angle){
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, THREE.MathUtils.degToRad(angle));
    item.applyQuaternion(quaternion);
}

function applyIsometricRotation(item){
    QRotateDegreesObject3DAxis(item, new THREE.Vector3(0, 1, 0), -45);
    QRotateDegreesObject3DAxis(item, new THREE.Vector3(1, 0, 0), 45);
}

function moveItemInGrid(grid, item, direction, floorBound, rowBound, colBound){
    console.log(item.position)
    if(direction == "L"){
        if(item.position.x > 0 && 
            grid.isBlockBelowWalkable(item.position.y, item.position.x - 1, item.position.z) && 
            grid.isBlockPassable(item.position.y, item.position.x - 1, item.position.z)){
                addPositionToItem(item, -1, 0, 0);
        }
    }
    if(direction == "R"){
        if(item.position.x < colBound - 1 && 
            grid.isBlockBelowWalkable(item.position.y, item.position.x + 1, item.position.z) && 
            grid.isBlockPassable(item.position.y, item.position.x + 1, item.position.z)){
                addPositionToItem(item, 1, 0, 0);
        }
    }
    if(direction == "U"){
        if(item.position.z > (rowBound - 1) * -1 && 
            grid.isBlockBelowWalkable(item.position.y, item.position.x, item.position.z - 1) && 
            grid.isBlockPassable(item.position.y, item.position.x, item.position.z - 1)){
                addPositionToItem(item, 0, 0, -1);
        }
    }
    if(direction == "D"){
        if(item.position.z < 0 && 
            grid.isBlockBelowWalkable(item.position.y, item.position.x, item.position.z + 1) && 
            grid.isBlockPassable(item.position.y, item.position.x, item.position.z + 1)){
                addPositionToItem(item, 0, 0, 1);
        }
    }
}


const [gameContainer, canvas, scene, camera, renderer] = initApplication();
scene.background = new THREE.Color("rgb(150, 150, 150)");
camera.position.z = 5;
const light = createLight(0xffffff);
light.position.set(-1, 2, 4);
scene.add(light);

const movable = new THREE.SphereGeometry(0.5, 6, 6);
const material = new THREE.MeshPhongMaterial( {color: 0xffff00} );
const sphere = new THREE.Mesh(movable, material);
addPositionToItem(sphere, 0, 1, 0);

scene.add(sphere);

//Format: Columns, Rows
//Floors are defaulted to 1
const dimensions = [3, 4];
let grid = new GridOfBlocks();
grid.initDimensions(dimensions[0], dimensions[1]);
grid.addFloor();

for(let i = 0; i < grid.cols; i++){
    for(let j = 0; j < grid.rows; j++){
        grid.addBlockToGrid(1, i+1, j+1);
    }
}
grid.addIsometricRotation();
grid.addOffset(-1, 0, 1);
grid.removeBlock(1, 1, 2);

grid.addFloor();
grid.addBlockToGrid(2, 2, 3);

grid.gridGroup.add(sphere);
grid.addToScene(scene);


function animate(){
    if (resizeRendererToDisplaySize(renderer)) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);

}
renderer.setAnimationLoop(animate);

window.addEventListener('keydown', (event) => {
    if(event.key == "w" || event.key == "ArrowUp"){
        moveItemInGrid(grid, sphere, "U", grid.floors, grid.rows, grid.cols);
    }
    if(event.key == "a" || event.key == "ArrowLeft"){
        moveItemInGrid(grid, sphere, "L", grid.floors, grid.rows, grid.cols);
    }
    if(event.key == "s" || event.key == "ArrowDown"){
        moveItemInGrid(grid, sphere, "D", grid.floors, grid.rows, grid.cols);
    }
    if(event.key == "d" || event.key == "ArrowRight"){
        moveItemInGrid(grid, sphere, "R", grid.floors, grid.rows, grid.cols);
    }
})

const prism = new THREE.Triangle();
const p = new THREE.Mesh(prism, material);
scene.add(p);
