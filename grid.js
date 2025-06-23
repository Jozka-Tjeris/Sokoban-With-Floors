import * as THREE from 'three';
import * as Helpers from './helpers';
import * as Blocks from './blocks';

export class GridOfBlocks{
    //Outermost layer stores floors
    //The second inner layer stores the columns
    //The innermost layer stores the column length
    //Format: yxz
    #gridGroup;
    #gridArray;
    #height;
    #cols;
    #rows;

    constructor(height, col, row){
        this.#gridGroup = new THREE.Object3D();
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

    static getRowInGrid(row){
        return row*-1;
    }

    addBlockToGrid(blockType, floor, col, row){
        if(this.checkCoordinateInBounds(floor - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1)) == false){
            console.log("Block generation failed");
            return;
        }

        let block = null;
        switch(blockType){
            case Blocks.BlockType.FLOOR:
                block = new Blocks.Floor(floor - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.WALL:
                block = new Blocks.Wall(floor - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.PLAYER:
                block = new Blocks.Player(floor - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.PUSHABLE:
                block = new Blocks.PushableBlock(floor - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
        }
        this.#gridArray[floor - 1][col - 1][row - 1] = block;
        this.#gridGroup.add(block.getObject());

        return block;
    }

    addOffset(x, y, z){
        Helpers.addPositionToItem(this.#gridGroup, x, y, z);
    }

    removeBlock(floor, col, row){
        this.#gridGroup.remove(this.#gridArray[floor - 1][col - 1][row - 1].getObject());
        this.#gridArray[floor - 1][col - 1][row - 1] = null;
    }

    swapBlocks(height1, col1, row1, height2, col2, row2){
        if(this.checkCoordinateInBounds(height1, col1, row1) == false){
            console.log("First set of coordinates are invalid");
            return;
        }
        if(this.checkCoordinateInBounds(height2, col2, row2) == false){
            console.log("Second set of coordinates are invalid");
            return;
        }
        let block1 = this.#gridArray[height1][col1][row1];
        let block2 = this.#gridArray[height2][col2][row2];
        this.#gridArray[height1][col1][row1] = block2;
        this.#gridArray[height2][col2][row2] = block1;
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

    addItemToGrid(item){
        this.#gridGroup.add(item);
    }

    addIsometricRotation(){
        Helpers.applyIsometricRotation(this.#gridGroup);
    }

    checkCoordinateInBounds(floor, col, row){
        if(floor < 0 || floor >= this.#height){
            console.log("Out of bounds; target floor: " + (floor + 1) + ", max floors: " + this.#height);
            return false;
        }
        if(col < 0 || col >= this.#cols){
            console.log("Out of bounds; column: " + (col + 1) + ", max cols: " + this.#cols);
            return false;
        }
        const currRow = GridOfBlocks.getRowInGrid(row);
        if(currRow < 0 || currRow >= this.#rows){
            console.log("Out of bounds; row: " + (currRow + 1) + ", max rows: " + this.#rows);
            return false;
        }
        return true;
    }

    isBlockBelowWalkable(floor, col, row){
        const isNull = this.#gridArray[floor - 1][col][GridOfBlocks.getRowInGrid(row)] == null;
        if(isNull == true){
            console.log("Block below is null");
            return false;
        }
        const isWalkable = this.#gridArray[floor - 1][col][GridOfBlocks.getRowInGrid(row)].isWalkable();
        if(isWalkable == false){
            console.log("Block below not walkable");
            return false;
        }
        return true;
    }

    isBlockPassable(floor, col, row){
        const isNull = this.#gridArray[floor][col][GridOfBlocks.getRowInGrid(row)] == null;
        if(isNull == true){
            console.log("Block in front is null");
            return true;
        }
        const isSolid = this.#gridArray[floor][col][GridOfBlocks.getRowInGrid(row)].isSolid();
        if(isSolid == true){
            console.log("There is a block blocking the way");
            return false;
        }
        return true;
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
}