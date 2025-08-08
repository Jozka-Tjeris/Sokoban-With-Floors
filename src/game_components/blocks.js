import * as THREE from 'three';
import * as Helpers from '../utilities/helpers';
import * as AnimHelpers from '../utilities/animationHandler.js';
import { BlockType, PlayerAction, BlockRenderOrder, BlockColor, BlockOpacity, BlockTextures } from './blockConstants.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

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
    #objectID;
    #objectIDObj;
    #objectIDMarker;

    createMeshObject(colorParam, opacityParam){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, opacity: opacityParam} );
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

    addAnimationToObject(addHeight, addCol, addRow){
        this.#height += addHeight;
        this.#col += addCol;
        this.#row += addRow;
        AnimHelpers.animatePositionOffsetToItem(this._object, addCol, addHeight, -1*addRow);
    }

    constructor(height, col, row){
        if(new.target === Block){
            throw new Error("Block is an abstract class");
        }
        if(new.target === Enterable){
            throw new Error("Enterable is an abstract class");
        }
        this.#height = height;
        this.#col = col;
        this.#row = row;
        this.#objectID = null;
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

    clearID(){
        if(this.#objectIDObj){
            if(this.#objectIDObj.parent){
                this.#objectIDObj.parent.remove(this.#objectIDObj);
            }
            this.#objectIDObj.traverse((child) => {
                // console.log(child)
                if(child.geometry) child.geometry.dispose();
                if(child.material){
                    if(Array.isArray(child.material)){
                        child.material.forEach((mat) => mat.dispose());
                    } 
                    else{
                        child.material.dispose();
                    }
                }
            });
            this.#objectIDObj.clear();
            this.#objectIDObj = null;
        }
        this.#objectID = null;

        if(this.#objectIDMarker){
            if(this.#objectIDMarker.parent){
                this.#objectIDMarker.parent.remove(this.#objectIDMarker);
            }
            this.#objectIDMarker.traverse((child) => {
                // console.log(child)
                if(child.geometry) child.geometry.dispose();
                if(child.material){
                    if(Array.isArray(child.material)){
                        child.material.forEach((mat) => mat.dispose());
                    } 
                    else{
                        child.material.dispose();
                    }
                }
            });
            this.#objectIDMarker.clear();
            this.#objectIDMarker = null;
        }
    }

    #addObjectIDMarker(){
        const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const coreTexture = new THREE.TextureLoader().load(BlockTextures["ID_Core"]);
        const material = new THREE.MeshStandardMaterial( {color: BlockColor["ID_Core"], transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.3, emissive: 0x33ff33, emissiveIntensity: 0.4, depthWrite: false, bumpMap: coreTexture, bumpScale: 1} );
        this.#objectIDMarker = new THREE.Mesh(geometry, material);
        this.getObject().add(this.#objectIDMarker);
        this.#objectIDMarker.renderOrder = BlockRenderOrder.NONE;
    }

    setObjectID(id){
        this.clearID();
        this.#objectID = id?.toString();
        if(!this.#objectID) return;
        const loader = new FontLoader();
        loader.load( '/fonts/helvetiker_regular.typeface.json', ( font ) => {
            const material = new THREE.MeshPhongMaterial( {color: new THREE.Color("rgb(205, 205, 205)")} );
            const geometry = new TextGeometry(this.#objectID, {
                font: font,
                size: 0.2,
                depth: 0,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 5
            } );
            this.#objectIDObj = new THREE.Mesh(geometry, material);
            this.#objectIDObj.visible = false;
            this.#objectIDObj.userData.isID = true;
            Helpers.QRotateDegreesObject3DAxis(this.#objectIDObj, new THREE.Vector3(1, 0, 0), -90);
            Helpers.addPositionToItem(this.#objectIDObj, 0.13, 1, 0.4);
            this._object.add(this.#objectIDObj);
            this.#addObjectIDMarker();
        });
    }

    getObjectID(){
        return this.#objectID;
    }

    freeBlockMemory(){
        if(this._object){
            this._object.traverse((child) => {
                if(child.geometry) child.geometry.dispose();
                if(child.material){
                    if(Array.isArray(child.material)){
                        child.material.forEach((mat) => {
                            if(mat.bumpMap){
                                mat.bumpMap.dispose();
                            }
                            mat.dispose();
                        });
                    } 
                    else{
                        if(child.material.bumpMap){
                            child.material.bumpMap.dispose();
                        }
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

    createMeshObject(colorParam, opacityParam){
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshPhongMaterial({ color: colorParam, opacity: opacityParam });
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        const option = (height + col + row) % 2;
        this._object = this.createMeshObject(BlockColor[this.type][option], BlockOpacity[this.type]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.addDistanceToObject(0.25, 0, 0);
        this.getObject().renderOrder = BlockRenderOrder.FLOOR;
    }

    setAsTeleportDestination(status){
        console.log(this.getObject().material.color.getHex(), BlockColor[this.type][0], BlockColor[this.type][1])
        if(status === true){
            if(this.getObject().material.color.getHex() === BlockColor[this.type][0]){
                this.getObject().material.color.setHex(BlockColor[this.type][2]);
            }
            else{
                this.getObject().material.color.setHex(BlockColor[this.type][3]);
            }
        }
        else{
            if(this.getObject().material.color.getHex() === BlockColor[this.type][2]){
                this.getObject().material.color.setHex(BlockColor[this.type][0]);
            }
            else{
                this.getObject().material.color.setHex(BlockColor[this.type][1]);
            }
        }
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
        const option = (height + col + row) % 2;
        this._object = this.createMeshObject(BlockColor[this.type][option], BlockOpacity[this.type]);
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
    //up, down, left, right, pull, teleport
    #currentStates = [false, false, false, false, false, false];

    createMeshObject(colorParam, opacityParam){
        const geometry = new THREE.SphereGeometry(0.25, 10, 10);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, opacity: opacityParam, transparent: true} );
        const sphere = new THREE.Mesh(geometry, material);
        Helpers.addPositionToItem(sphere, 0, 0.55, 0);
        const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.45, 10, 1, false);
        const cylinder = new THREE.Mesh(baseGeometry, material);
        cylinder.add(sphere);
        return cylinder;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(BlockColor[this.type], BlockOpacity[this.type]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        Helpers.addPositionToItem(this._object, 0, -0.3, 0);
        this.getObject().traverse(object => {
            object.renderOrder = BlockRenderOrder.PLAYER;
        })
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

    createMeshObject(colorParam, opacityParam, textureParamPath){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const patternTexture = new THREE.TextureLoader().load(textureParamPath);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: opacityParam, bumpMap: patternTexture, bumpScale: 0.3, specular: 0x888888, shininess: 30} );
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(BlockColor[this.type], BlockOpacity[this.type], BlockTextures[this.type]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        //set to lower priority in drawing order to prevent z-fighting with target spaces when animating
        Helpers.addPositionToItem(this._object, -0.0005, -0.0005, -0.0005);
        this.getObject().renderOrder = BlockRenderOrder.TRANSPARENT_BLOCK;
    }
}

export class PullableBlock extends Block{
    type = BlockType.PULLABLE;
    walkable = true;
    solid = true;
    pushable = false;
    pullable = true;

    createMeshObject(colorParam, opacityParam, textureParamPath){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const patternTexture = new THREE.TextureLoader().load(textureParamPath);
        const material = new THREE.MeshPhongMaterial( {color: colorParam, transparent: true, opacity: opacityParam, bumpMap: patternTexture, bumpScale: 0.3, specular: 0x888888, shininess: 30} );
        const cube = new THREE.Mesh(geometry, material);
        return cube;
    }

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(BlockColor[this.type], BlockOpacity[this.type], BlockTextures[this.type]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        //set to lower priority in drawing order to prevent z-fighting with target spaces when animating
        Helpers.addPositionToItem(this._object, -0.0005, -0.0005, -0.0005);
        this.getObject().renderOrder = BlockRenderOrder.TRANSPARENT_BLOCK;
    }
}

class Enterable extends Block{
    type = BlockType.ENTERABLE;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;
    //Right, Left, Top, Bottom, Front, Back
    #enterable = [true, true, true, true, true, true];
    #borders = new Array(6);
    #isOccupied = false;
    #canTeleportIntoSpace = true;

    createMeshObject(colorParam, opacityParam, blockTexturePath, borderTexturePath){
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const patternTexture = new THREE.TextureLoader().load(blockTexturePath);
        const material = new THREE.MeshPhongMaterial({color: colorParam, transparent: true, opacity: opacityParam, bumpMap: patternTexture ?? null, bumpScale: 0.3, specular: 0x888888, shininess: 30});
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

        const borderTexture = new THREE.TextureLoader().load(borderTexturePath);
        for(let i = 0; i < 6; i++){
            const currFace = new THREE.PlaneGeometry(1, 1);
            const borderMaterial = new THREE.MeshPhongMaterial({color: BlockColor[BlockType.ENTERABLE][1], emissive: BlockColor[BlockType.ENTERABLE][1], bumpMap: borderTexture ?? null, bumpScale: 2, specular: 0x888888, shininess: 30});
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

    //TODO: visual cue for this behaviour
    toggleTeleportable(status){
        if(status == true){
            this.#canTeleportIntoSpace = true;
        }
        else{
            this.#canTeleportIntoSpace = true;
        }
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
            case PlayerAction.TELEPORT:
                return this.#canTeleportIntoSpace;
        }
        //for top and bottom directions, handle later with later player actions
        return false;
    }

    setFilled(status){
        this.#isOccupied = status;
    }

    getFilled(){
        return this.#isOccupied;
    }

    freeBlockMemory(){
        super.freeBlockMemory();

        for (const border of this.#borders) {
            if (!border) continue;
            border.traverse((child) => {
                if(child.geometry) child.geometry.dispose();
                if(child.material){
                    if(Array.isArray(child.material)){
                        child.material.forEach((mat) => {
                            if(mat.bumpMap){
                                mat.bumpMap.dispose();
                            }
                            mat.dispose();
                        });
                    } 
                    else{
                        if(child.material.bumpMap){
                            child.material.bumpMap.dispose();
                        }
                        child.material.dispose();
                    }
                }
            });
            border.clear();
        }
        this.#borders = [];
    }

    getDirectionsAsJSONString(){
        const directionString = new Array(6);
        this.#enterable.forEach((value, index) => {
            directionString[index] = value ? "1" : "0";
        });
        return directionString;
    }
}

export class TargetSpace extends Enterable{
    type = BlockType.TARGET;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(BlockColor[this.type][0], BlockOpacity[this.type][0], BlockTextures[this.type], BlockTextures[BlockType.ENTERABLE][1]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.TARGET;
    }

    checkID(id){
        //No ID block entering ID target
        if(this.getObjectID() != null && id == null){
            return false;
        }
        //ID block entering no ID target
        if(this.getObjectID() == null && id != null){
            return false;
        }
        //ID block entering ID target
        if(this.getObjectID() != null && id != null){
            //Check if IDs match
            if(this.getObjectID() === id){
                return true;
            }
            return false;
        }
        //No ID block entering no ID target
        if(this.getObjectID() == null && id == null){
            return true;
        }
    }

    setFilled(status, type, id){
        super.setFilled(status);
        if(status == true){
            if(this.checkID(id)){
                if(type === BlockType.PUSHABLE){
                    this.getObject().material.color.setHex(BlockColor[this.type][1]);
                    this.getObject().material.opacity = BlockOpacity[this.type][1];
                }
                if(type === BlockType.PULLABLE){
                    this.getObject().material.color.setHex(BlockColor[this.type][2]);
                    this.getObject().material.opacity = BlockOpacity[this.type][2];
                }
                return true;
            }
            else{
                if(type === BlockType.PUSHABLE){
                    this.getObject().material.color.setHex(BlockColor[this.type][3]);
                    this.getObject().material.opacity = BlockOpacity[this.type][3];
                }
                if(type === BlockType.PULLABLE){
                    this.getObject().material.color.setHex(BlockColor[this.type][4]);
                    this.getObject().material.opacity = BlockOpacity[this.type][4];
                }
                return false;
            }
        }
        else{
            this.getObject().material.color.setHex(BlockColor[this.type][0]);
            this.getObject().material.opacity = BlockOpacity[this.type][0];
        }
        return false;
    }
}

export class Teleporter extends Enterable{
    type = BlockType.TELEPORTER;
    walkable = false;
    solid = false;
    pushable = false;
    pullable = false;
    #targetGridID = null;
    #targetPosition = [0, 0, 0];
    #isUsable = true;

    constructor(height, col, row){
        super(height, col, row);
        this._object = this.createMeshObject(BlockColor[this.type][0], BlockOpacity[this.type][0], BlockTextures[this.type], BlockTextures[BlockType.ENTERABLE][1]);
        Helpers.setPositionToItem(this._object, col, height, -1*row);
        this.getObject().renderOrder = BlockRenderOrder.TRANSPARENT_BLOCK;
    }

    setDestinationOccupied(status){
        if(!this.#isUsable) return;
        if(status == true){
            this.getObject().material.color.setHex(BlockColor[this.type][1]);
            this.getObject().material.opacity = BlockOpacity[this.type][0];
        }
        else{
            this.getObject().material.color.setHex(BlockColor[this.type][0]);
            this.getObject().material.opacity = BlockOpacity[this.type][1];
        }
    }

    setTargetSpace(gridID, height, col, row){
        this.#targetGridID = gridID;
        this.#targetPosition = [height, col, row];
    }

    getTargetGridID(){
        return this.#targetGridID;
    }

    getTargetGridPosition(){
        return this.#targetPosition;
    }

    setDisabled(){
        this.#isUsable = false;
        this.getObject().material.color.setHex(BlockColor[this.type][1]);
        this.getObject().material.opacity = BlockOpacity[this.type][0];
    }

    getUsable(){
        return this.#isUsable;
    }
}
