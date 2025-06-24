import * as THREE from 'three';
import * as Helpers from './helpers';

export const BlockType = {
    BLOCK: 'block',
    PLAYER: 'player',
    PUSHABLE: 'pushable',
    PULLABLE: 'pullable',
    WALL: 'wall',
    FLOOR: 'floor',
    TARGET: 'target'
};

export const Direction = {
    POS_X: 0,
    NEG_X: 1,
    POS_Y: 2,
    NEG_Y: 3,
    POS_Z: 4,
    NEG_Z: 5
};

export const PlayerAction = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
    PULL: 4,
    INTERACT: 5
}

class Block{
    type = BlockType.BLOCK;
    walkable = false;
    solid = true;
    pushable = false;
    pullable = false;
    #object;
    #height;
    #col;
    #row;

    generateColor(argument){
        return 0x202020;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }

    addDistanceToObject(addHeight, addCol, addRow){
        this.#height += addHeight;
        this.#col += addCol;
        this.#row += addRow;
        Helpers.addPositionToItem(this.#object, addCol, addHeight, addRow);
    }

    moveObject(newHeight, newCol, newRow){
        this.#height = newHeight;
        this.#col = newCol;
        this.#row = newRow;
        Helpers.setPositionToItem(this.#object, newCol, newHeight, newRow);
    }

    constructor(height, col, row){
        if(new.target === Block){
            throw new Error("Block is an abstract class");
        }
        this.#height = height;
        this.#col = col;
        this.#row = row;
        this.#object = this.createMeshObject(this.generateColor(height + col + row));
        this.moveObject(height, col, row);
    }

    getPosition(){
        return [this.#height, this.#col, this.#row];
    }

    getObject(){
        return this.#object;
    }

    isWalkable(){
        return this.walkable;
    }

    isSolid(){
        return this.solid;
    }

    isPushable(){
        return this.pushable;
    }

    isPullable(){
        return this.pullable;
    }
}

export class Floor extends Block{
    type = BlockType.FLOOR;
    walkable = true;
    solid = true;
    pushable = false;
    pullable = false;

    generateColor(argument){
        let color = 0x00cc00;
        if(argument % 2 == 0) color = 0xcc0000;
        return color;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this.addDistanceToObject(0.25, 0, 0);
    }
}

export class Wall extends Block{
    type = BlockType.WALL;
    walkable = false;
    solid = true;
    pushable = false;
    pullable = false;

    generateColor(argument){
        let color = 0x00ff00;
        if(argument % 2 == 0) color = 0xff0000;
        return color;
    }
}

export class Player extends Block{
    type = BlockType.PLAYER;
    walkable = false;
    solid = true;
    pushable = false;
    pullable = false;
    //up, down, left, right, pull, interact
    #currentStates = [false, false, false, false, false, false];

    generateColor(argument){
        return 0xffff00;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.SphereGeometry(0.5, 10, 10);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const sphere = new THREE.Mesh(geometry, material);
        sphere.renderOrder = 1;
        return sphere;
    }

    toggleActionState(state, action){
        this.#currentStates[action] = state;
    }

    getActionState(action){
        return this.#currentStates[action];
    }
}

export class PushableBlock extends Block{
    type = BlockType.PUSHABLE;
    walkable = true;
    solid = true;
    pushable = true;
    pullable = false;

    generateColor(argument){
        return 0x0000ff;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.8} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }
}

export class PullableBlock extends Block{
    type = BlockType.PULLABLE;
    walkable = true;
    solid = true;
    pushable = false;
    pullable = true;

    generateColor(argument){
        return 0xff8800;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.9} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }
}

export class TargetSpace extends Block{
    type = BlockType.TARGET;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;
    //+X, -X, +Y, -Y, +Z, -Z
    #enterable = [true, true, true, true, true, true];
    #filled = false;

    generateColor(argument){
        return 0x88ffff;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.9} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 1;
        return cube;
    }

    canEnterFromDirection(direction){
        return this.#enterable[direction];
    }

    setFilled(status){
        this.#filled = status;
        if(status == true){
            this.getObject().material.color.setHex(0xff88ff);
            this.getObject().material.opacity = 0.5;
        }
        else{
            this.getObject().material.color.setHex(this.generateColor(null));
            this.getObject().material.opacity = 0.9;
        }
    }

    checkIfFilled(){
        return this.#filled;
    }
}
