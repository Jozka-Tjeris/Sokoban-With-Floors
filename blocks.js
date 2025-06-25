import * as THREE from 'three';
import * as Helpers from './helpers';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

export const BlockType = {
    BLOCK: 'block',
    PLAYER: 'player',
    PUSHABLE: 'pushable',
    PULLABLE: 'pullable',
    WALL: 'wall',
    FLOOR: 'floor',
    TARGET: 'target'
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
    _object;
    #height;
    #col;
    #row;

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
        Helpers.addPositionToItem(this._object, addCol, addHeight, addRow);
    }

    moveObject(newHeight, newCol, newRow){
        this.#height = newHeight;
        this.#col = newCol;
        this.#row = newRow;
        Helpers.setPositionToItem(this._object, newCol, newHeight, newRow);
    }

    constructor(height, col, row){
        if(new.target === Block){
            throw new Error("Block is an abstract class");
        }
        this.#height = height;
        this.#col = col;
        this.#row = row;
    }

    getPosition(){
        return [this.#height, this.#col, this.#row];
    }

    getObject(){
        return this._object;
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

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        let color = 0xbcbcbc;
        if((height + col + row) % 2 == 0) color = 0x444444;
        this._object = this.createMeshObject(color);
        this.moveObject(height, col, row);
        this.addDistanceToObject(0.25, 0, 0);
    }
}

export class Wall extends Block{
    type = BlockType.WALL;
    walkable = false;
    solid = true;
    pushable = false;
    pullable = false;

    constructor(height, col, row){
        super(height, col, row);
        let color = 0x00ff00;
        if((height + col + row) % 2 == 0) color = 0xff0000;
        this._object = this.createMeshObject(color);
        this.moveObject(height, col, row);
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

    createMeshObject(colorParam){
        const geometry = new THREE.SphereGeometry(0.5, 10, 10);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const sphere = new THREE.Mesh(geometry, material);
        sphere.renderOrder = 1;
        return sphere;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0xffff00);
        this.moveObject(height, col, row);
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

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.8} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0x0000ff);
        this.moveObject(height, col, row);
    }
}

export class PullableBlock extends Block{
    type = BlockType.PULLABLE;
    walkable = true;
    solid = true;
    pushable = false;
    pullable = true;

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.9} );
        const cube = new THREE.Mesh(geometry, material);
        cube.renderOrder = 0;
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0xff8800);
        this.moveObject(height, col, row);
    }
}

export class TargetSpace extends Block{
    type = BlockType.TARGET;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;
    //+X, -X, +Y, -Y, +Z, -Z
    #enterable = [false, false, false, false, false, false];
    _lineMaterial;

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const params = {color: colorParam, transparent: true, opacity: 0.9, depthWrite: true};
        const material = new THREE.MeshPhongMaterial( params );
        const cube = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry( geometry ); 
        const edgePositions = [];

        const posAttr = edges.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            console.log(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
            edgePositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        }
        const lineGeo = new LineSegmentsGeometry();
        lineGeo.setPositions(edgePositions);

        this._lineMaterial = new LineMaterial( { color: 0xffffff, worldUnits: false, linewidth: 10, dashed: false} );
        this._lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

        const line = new LineSegments2(lineGeo, this._lineMaterial);
        cube.add(line);
        cube.renderOrder = 1;
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0x88ffff);
        this.moveObject(height, col, row);
    }

    setEnterableDirection(directions){

    }

    canEnterFromDirection(direction){
        return this.#enterable[direction];
    }

    setFilled(status, type){
        if(status == true){
            if(type === BlockType.PUSHABLE){
                this.getObject().material.color.setHex(0xff88ff);
                this.getObject().material.opacity = 0.5;
            }
            if(type === BlockType.PULLABLE){
                this.getObject().material.color.setHex(0xff44dd);
                this.getObject().material.opacity = 0.4;
            }
        }
        else{
            this.getObject().material.color.setHex(0x88ffff);
            this.getObject().material.opacity = 0.9;
        }
    }

    resizeLineMaterial(sizeX, sizeY){
        this._lineMaterial.resolution.set(sizeX, sizeY);
    }

    getLineMaterial(){
        return this._lineMaterial;
    }
}
