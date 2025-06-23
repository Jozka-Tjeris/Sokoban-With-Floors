import * as THREE from 'three';
import * as Helpers from './helpers';

export const BlockType = {
    BLOCK: 'block',
    PLAYER: 'player',
    PUSHABLE: 'pushable',
    WALL: 'wall',
    FLOOR: 'floor'
};

class Block{
    type = BlockType.BLOCK;
    walkable = false;
    solid = true;
    pushable = false;
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
}

export class Floor extends Block{
    type = BlockType.FLOOR;
    walkable = true;
    solid = true;
    pushable = false;

    generateColor(argument){
        let color = 0x00cc00;
        if(argument % 2 == 0) color = 0xcc0000;
        return color;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const cube = new THREE.Mesh(geometry, material);
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

    generateColor(argument){
        return 0xffff00;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.SphereGeometry(0.5, 10, 10);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const sphere = new THREE.Mesh(geometry, material);
        return sphere;
    }
}

export class PushableBlock extends Block{
    type = BlockType.PUSHABLE;
    walkable = true;
    solid = true;
    pushable = true;

    generateColor(argument){
        return 0x0000ff;
    }

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.7} );
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }
}