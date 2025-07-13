import * as THREE from 'three';
import * as Helpers from '../utilities/helpers';
import * as Blocks from './blocks';

export class GridOfBlocks{
    //Outermost layer stores floors
    //The second inner layer stores the columns
    //The innermost layer stores the column length
    //Format: yxz
    #gridGroup;
    #gridArray;
    #enterableSpaces;
    #playerObject;
    #height;
    #cols;
    #rows;
    #gridID;

    constructor(height, col, row){
        this.#gridGroup = new THREE.Group();
        this.#enterableSpaces = new Map();
        this.#height = height;
        this.#cols = col;
        this.#rows = row;
        this.#gridID = "None";
        this.#playerObject = null;
        this.#gridArray = new Array(height);
        for(let k = 0; k < this.#height; k++){
            this.#gridArray[k] = new Array(col);
            for(let i = 0; i < this.#cols; i++){
                this.#gridArray[k][i] = new Array(row).fill(null);
            }
        }
    }

    setGridID(newID){
        this.#gridID = newID.toString();
    }

    getGridID(){
        return this.#gridID;
    }

    prepareForNewLevel(height, col, row){
        this.clearAll();
        this.resetGrid(height, col, row);
    }

    resetGrid(height, col, row){
        this.#height = height;
        this.#cols = col;
        this.#rows = row;
        this.#gridArray = new Array(height);
        for(let k = 0; k < this.#height; k++){
            this.#gridArray[k] = new Array(col);
            for(let i = 0; i < this.#cols; i++){
                this.#gridArray[k][i] = new Array(row).fill(null);
            }
        }
    }

    addBlockToGrid(blockType, height, col, row){
        //Assumes grid coordinates are already being used
        const dimensionParams = [height - 1, col - 1, row - 1];
        if(this.checkCoordinateInBounds(...dimensionParams) == false){
            console.log("Block generation failed");
            return;
        }
        if(this.#gridArray[height - 1][col - 1][row - 1] != null){
            console.log("A block already exists at the position: ", height, col, row);
            return;
        }
        if(this.#enterableSpaces.get(dimensionParams.toString().replaceAll(',', ':')) != null){
            console.log("A target space already exists at the position: ", height, col, row);
            return;
        }

        let cttrClass = null;
        switch(blockType){
            case Blocks.BlockType.FLOOR:
                cttrClass = Blocks.Floor; 
                break;
            case Blocks.BlockType.WALL:
                cttrClass = Blocks.Wall;
                break;
            case Blocks.BlockType.PLAYER:
                cttrClass = Blocks.Player;
                if(this.#playerObject instanceof Blocks.Player){
                    console.log("Player already exists in the grid");
                    return;
                }
                break;
            case Blocks.BlockType.PUSHABLE:
                cttrClass = Blocks.PushableBlock;
                break;
            case Blocks.BlockType.PULLABLE:
                cttrClass = Blocks.PullableBlock;
                break;
            case Blocks.BlockType.TARGET:
                const targetBlock = new Blocks.TargetSpace(...dimensionParams);
                const keyPosition = dimensionParams.toString().replaceAll(',', ':');
                this.#enterableSpaces.set(keyPosition, targetBlock);
                this.#gridGroup.add(targetBlock.getObject());
                return targetBlock;
            case Blocks.BlockType.TELEPORTER:
                const elevChangeBlock = new Blocks.Teleporter(...dimensionParams);
                const elevChangePosition = dimensionParams.toString().replaceAll(',', ':');
                this.#enterableSpaces.set(elevChangePosition, elevChangeBlock);
                this.#gridGroup.add(elevChangeBlock.getObject());
                return elevChangeBlock;
            case Blocks.BlockType.NONE:
                return;
            default:
                console.log("Block type: " + blockType + " unsupported");
                return;
        }
        const block = new cttrClass(...dimensionParams);
        this.#gridArray[height - 1][col - 1][row - 1] = block;
        this.#gridGroup.add(block.getObject());
        if(cttrClass == Blocks.Player && this.#playerObject instanceof Blocks.Player == false){
            this.#playerObject = block;
        }
        return block;
    }

    addOffset(x, y, z){
        Helpers.addPositionToItem(this.#gridGroup, x, y, z);
    }

    removeBlock(height, col, row){
        //Assumes already in grid coordinates
        if(this.checkCoordinateInBounds(height - 1, col - 1, row - 1) == false){
            console.log("Out of bounds removal");
            return;
        }
        if(this.#gridArray[height - 1][col - 1][row - 1] == null){
            console.log("Block is already removed");
            return;
        }
        const object = this.#gridArray[height - 1][col - 1][row - 1].getObject?.();
        const isPlayer = this.#gridArray[height - 1][col - 1][row - 1] instanceof Blocks.Player;
        if(object){
            this.#gridGroup.remove(object);
            this.#gridArray[height - 1][col - 1][row - 1].freeBlockMemory();
        }
        this.#gridArray[height - 1][col - 1][row - 1] = null;
        if(isPlayer){
            console.log("EEE")
            this.#playerObject = null;
        }
    }

    swapBlocks(height1, col1, row1, height2, col2, row2){
        //check grid coordinates
        if(this.checkCoordinateInBounds(height1, col1, row1) == false){
            console.log("First set of coordinates are invalid");
            return;
        }
        if(this.checkCoordinateInBounds(height2, col2, row2) == false){
            console.log("Second set of coordinates are invalid");
            return;
        }

        //swaps blocks around
        let block1 = this.#gridArray[height1][col1][row1];
        let block2 = this.#gridArray[height2][col2][row2];
        this.#gridArray[height1][col1][row1] = block2;
        this.#gridArray[height2][col2][row2] = block1;

        //use coordinate system to move blocks around
        if(block1 != null){
            block1.addDistanceToObject(height2 - height1, col2 - col1, row2 - row1);
        }
        if(block2 != null){
            block2.addDistanceToObject(height1 - height2, col1 - col2, row1 - row2);
        }
    }

    attachToItem(item){
        item.add(this.#gridGroup);
    }

    detachFromItem(item){
        item.remove(this.#gridGroup);
    }

    setCenter(){
        this.#gridGroup.position.set(-this.#cols/2.0-0.5, -this.#height/2.0-0.5, -this.#rows/2.0-0.5);
    }

    addIsometricRotation(){
        Helpers.QRotateDegreesObject3DAxis(this.#gridGroup, new THREE.Vector3(0, 1, 0), -25);
        Helpers.QRotateDegreesObject3DAxis(this.#gridGroup, new THREE.Vector3(1, 0, 0), 50);
    }

    checkCoordinateInBounds(height, col, row){
        //Assumes that coordinates follow grid coordinates
        if(height < 0 || height >= this.#height){
            console.log("Out of bounds; target height: " + (height + 1) + ", max height: " + this.#height);
            return false;
        }
        if(col < 0 || col >= this.#cols){
            console.log("Out of bounds; column: " + (col + 1) + ", max cols: " + this.#cols);
            return false;
        }
        if(row < 0 || row >= this.#rows){
            console.log("Out of bounds; row: " + (row + 1) + ", max rows: " + this.#rows);
            return false;
        }
        return true;
    }

    getEnterable(height, col, row){
        return this.#enterableSpaces.get((height - 1) + ":" + (col - 1) + ":" + (row - 1));
    }

    getBlock(height, col, row){
        if(this.checkCoordinateInBounds(height, col, row) == false){
            return undefined;
        }
        return this.#gridArray[height][col][row];
    }

    isBlockBelowWalkable(height, col, row){
        const blockToCheck = this.getBlock(height - 1, col, row);
        const isBlock = blockToCheck instanceof Blocks.Block;
        if(isBlock == false){
            return false;
        }
        const isWalkable = blockToCheck.isWalkable();
        if(isWalkable == false){
            console.log("Block below not walkable");
            return false;
        }
        return true;
    }

    isBlockPassable(height, col, row, direction){
        const blockToCheck = this.getBlock(height, col, row);
        const targetToCheck = this.#enterableSpaces.get(height + ":" + col + ":" + row) ?? null;
        const isBlock = blockToCheck instanceof Blocks.Block;
        const isTargetBlock = targetToCheck instanceof Blocks.Block;

        if(isBlock == false && isTargetBlock == false){
            return true;
        }
        if(isBlock == true){
            //the player check makes sure that it doesn't treat the player as an impassable block
            //the player will be moving away from their current position after a movement update
            //so it's acceptable to ignore the player position
            const isSolid = blockToCheck.isSolid() && (blockToCheck instanceof Blocks.Player == false);
            if(isSolid == true){
                console.log("There is a block blocking the way");
                return false;
            }
            if(isTargetBlock == false){
                //not a target space that requires direction checking
                return true;
            }
        }
        if(isTargetBlock == true){
            //check possible entrances
            const isEnterable = targetToCheck.canEnterFromDirection(direction);
            if(isEnterable == false){
                console.log("Target space not allowed to be entered from direction: " + direction);
                return false;
            }
            console.log("Can enter target space from direction: " + direction);
            return true;
        }
        console.log("Error: Undefined case for passability");
        return false;
    }

    isBlockPushable(height, col, row){
        const blockToCheck = this.getBlock(height, col, row);
        const isBlock = blockToCheck instanceof Blocks.Block;
        if(isBlock == false){
            return false;
        }
        const isPushable = blockToCheck.isPushable();
        if(isPushable == false){
            console.log("Block in front is not pushable");
            return false;
        }
        return true;
    }

    isBlockPullable(height, col, row){
        const blockToCheck = this.getBlock(height, col, row);
        const isBlock = blockToCheck instanceof Blocks.Block;
        if(isBlock == false){
            return false;
        }
        const isPushable = blockToCheck.isPullable();
        if(isPushable == false){
            console.log("Block behind is not pullable");
            return false;
        }
        return true;
    }

    addBlockToGridViaTeleport(blocktype, height, col, row){
        if(!this.checkCoordinateInBounds(height, col, row)){
            console.log("Position not valid (out of bounds)");
            return;
        }
        if(!this.isBlockBelowWalkable(height, col, row)){
            console.log("Position not valid (not walkable)");
            return;
        }
        if(!this.isBlockPassable(height, col, row)){
            console.log("Position already occupied");
            return;
        }
        if(this.#playerObject instanceof Blocks.Player && blocktype == Blocks.BlockType.PLAYER){
            console.log("Player already exists");
            return;
        }
        this.addBlockToGrid(blocktype, height, col, row);
    }

    verifyTargetSpaces(){
        let state = true;
        //checks if every target space is filled
        this.#enterableSpaces.forEach((value, key) => {
            if(value instanceof Blocks.TargetSpace){
                const position = value.getPosition();
                const currentBlock = this.getBlock(...position);
                const containsPushable = currentBlock instanceof Blocks.PushableBlock;
                const containsPullable = currentBlock instanceof Blocks.PullableBlock;
                state &&= containsPushable || containsPullable;
                if(containsPushable){
                    value.setFilled(true, Blocks.BlockType.PUSHABLE);
                }
                else if(containsPullable){
                    value.setFilled(true, Blocks.BlockType.PULLABLE);
                }
                else{
                    value.setFilled(false, null);
                }
            }
            if(value instanceof Blocks.Teleporter){
                const currPosition = value.getPosition();
                if(this.getBlock(...currPosition)){
                    value.setFilled(true);
                    console.log(value, this.#gridID)
                    console.log("HI")
                }
                else{
                    value.setFilled(false);
                }
            }
        });
        return state;
    }

    getCols(){ 
        return this.#cols;
    }

    getRows(){
        return this.#rows;
    }

    getHeight(){
        return this.#height;
    }

    getPlayer(){
        return this.#playerObject;
    }

    clearAll(){
        // First, clear all grid-registered blocks
        for (let h = 0; h < this.#height; h++) {
            for (let x = 0; x < this.#cols; x++) {
                for (let z = 0; z < this.#rows; z++) {
                    const block = this.#gridArray[h][x][z];
                    if (block) {
                        block.freeBlockMemory();
                        const obj = block.getObject?.();
                        if (obj) this.#gridGroup.remove(obj);
                    }
                    this.#gridArray[h][x][z] = null;
                }
            }
        }

        this.#enterableSpaces.forEach((block) => {
            block.freeBlockMemory();
            const obj = block.getObject?.();
        });
        this.#enterableSpaces.clear();

        this.#gridGroup.clear();
        this.#gridArray = [];
        this.#playerObject = null;
    }

    convertToJSONString(legendData){
        let objString = {};
        objString.gridSize = {"height": this.#height, "columns": this.#cols, "rows": this.#rows};
        objString.layers = new Array(this.#height);
        //go through each height
        for(let i = 0; i < this.#height; i++){
            //create new object to store current layer
            objString.layers[i] = {};
            const layerLayout = new Array(this.#rows);
            let currRow = 0;
            //traverse from back to front
            for(let k = this.#rows - 1; k >= 0; k--){
                const rowLayout = new Array(this.#cols);
                for(let j = 0; j < this.#cols; j++){
                    //check if block or target exists at this position
                    const block = this.getBlock(i, j, k);
                    const target = this.getEnterable(i+1, j+1, k+1);
                    let blockCode = " ";
                    if(block){
                        blockCode = legendData.typeToCode[block.type] ?? " ";
                    }
                    if(target){
                        blockCode = legendData.typeToCode[target.type] ?? " ";
                        //add target directions onto additional property "targets"
                        if(!objString.layers[i].hasOwnProperty("targets")){
                            objString.layers[i].targets = [];
                        }
                        objString.layers[i].targets.push({
                            "position": [j+1, k+1],
                            "directions": target.getDirectionsAsJSONString().join("")
                        })
                    }
                    rowLayout[j] = blockCode;
                }
                //store current row layout
                layerLayout[currRow] = rowLayout.join("");
                currRow++;
            }
            //store current height layout
            objString.layers[i].layout = layerLayout;
        }
        return objString;
    }
}
