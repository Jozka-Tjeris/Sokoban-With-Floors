import * as THREE from 'three';
import * as Helpers from './helpers';

export const BlockType = {
    NONE: 'none',
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

const BlockRenderOrder = {
    NONE: 0,
    FLOOR: 0,
    WALL: 1,
    TRANSPARENT_BLOCK: 2,
    TARGET: 3,
    BORDER: 4,
    PLAYER: 5
}

export class Block{
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
        cube.renderOrder = BlockRenderOrder.NONE;
        return cube;
    }

    addDistanceToObject(addHeight, addCol, addRow){
        this.#height += addHeight;
        this.#col += addCol;
        this.#row += addRow;
        Helpers.addPositionToItem(this._object, addCol, addHeight, -1*addRow);
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

    freeBlockMemory(){
        if(this._object){
            this._object.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this._object.clear();
            this._object = null;
        }
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
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        let color = 0xbcbcbc;
        if((height + col + row) % 2 == 0) color = 0x444444;
        this._object = this.createMeshObject(color);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.addDistanceToObject(0.25, 0, 0);
        this.getObject().renderOrder = BlockRenderOrder.FLOOR;
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
         Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.WALL;
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
        const geometry = new THREE.SphereGeometry(0.25, 10, 10);
        const material = new THREE.MeshPhongMaterial( {color: colorParam} );
        const sphere = new THREE.Mesh(geometry, material);
        Helpers.addPositionToItem(sphere, 0, 0.55, 0);
        const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.45, 10, 1, false);
        const cylinder = new THREE.Mesh(baseGeometry, material);
        cylinder.add(sphere);
        return cylinder;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0xffff00);
         Helpers.setPositionToItem(this._object, col, height, -1*row);
        Helpers.addPositionToItem(this._object, 0, -0.3, 0);
        this.getObject().renderOrder = BlockRenderOrder.PLAYER;
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
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.7} );
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0x0000ff);
         Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.TRANSPARENT_BLOCK;
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
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: 0.8} );
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0xff9911);
         Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.TRANSPARENT_BLOCK;
    }
}

export class TargetSpace extends Block{
    type = BlockType.TARGET;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;
    //Right, Left, Top, Bottom, Front, Back
    #enterable = [true, true, true, true, true, true];
    #borders = new Array(6);

    createMeshObject(colorParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({color: colorParam, transparent: true, opacity: 0.8});
        const cube = new THREE.Mesh(geometry, material);

        const offsetConstant = 0.6;
        const faceOffsets = [
            [1, 0, 0],  // +X
            [-1, 0, 0], // -X
            [0, 1, 0],  // +Y
            [0, -1, 0], // -Y
            [0, 0, 1],  // +Z
            [0, 0, -1]  // -Z
        ];

        for(let i = 0; i < 6; i++){
            const currFace = new THREE.PlaneGeometry(1, 1);
            const borderMaterial = new THREE.MeshPhongMaterial({color: 0x371300, emissive: 0x371300});
            const currBorderMesh = new THREE.Mesh(currFace, borderMaterial);
            Helpers.addPositionToItem(currBorderMesh, ...(faceOffsets[i].map(value => value * offsetConstant)));
            //when moving to the left or right, rotate the border by 90 degrees on the y-axis
            if(faceOffsets[i][0] != 0){
                Helpers.QRotateDegreesObject3DAxis(currBorderMesh, new THREE.Vector3(0, 1, 0), 90);
            }
            //when moving to the top or bottom, rotate the border by -90 degrees on the x-axis
            if(faceOffsets[i][1] != 0){
                Helpers.QRotateDegreesObject3DAxis(currBorderMesh, new THREE.Vector3(1, 0, 0), -90);
            }
            currBorderMesh.renderOrder = BlockRenderOrder.BORDER;
            this.#borders[i] = currBorderMesh;
        }
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(0xa8ffff);
         Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.TARGET;
    }

    setEnterableDirection(right, left, up, down, front, back){
        const directions = [right, left, up, down, front, back];
        directions.forEach((value, index) => {
            const oldValue = this.#enterable[index];
            this.#enterable[index] = value;
            //set direction to be non-enterable
            if(value == false && oldValue == true){
                this.getObject().add(this.#borders[index]);
            }
            //set direction to be enterable
            else if(value == true && oldValue == false){
                this.getObject().remove(this.#borders[index]);
            }
        });
    }

    canEnterFromDirection(direction){
        switch(direction){
            case PlayerAction.LEFT:
                return this.#enterable[0];
            case PlayerAction.RIGHT:
                return this.#enterable[1];
            case PlayerAction.UP:
                return this.#enterable[4];
            case PlayerAction.DOWN:
                return this.#enterable[5];
        }
        //for top and bottom directions, handle later with later player actions
        return false;
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
            this.getObject().material.opacity = 0.8;
        }
    }

    freeBlockMemory(){
        super.freeBlockMemory();

        for (const border of this.#borders) {
            if (!border) continue;
            border.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            border.clear();
        }
        this.#borders = [];
    }
}
