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

    addBlockToGrid(blockType, height, col, row){
        if(this.checkCoordinateInBounds(height - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1)) == false){
            console.log("Block generation failed");
            return;
        }

        let block = null;
        switch(blockType){
            case Blocks.BlockType.FLOOR:
                block = new Blocks.Floor(height - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.WALL:
                block = new Blocks.Wall(height - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.PLAYER:
                block = new Blocks.Player(height - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
            case Blocks.BlockType.PUSHABLE:
                block = new Blocks.PushableBlock(height - 1, col - 1, GridOfBlocks.getRowInGrid(row - 1));
                break;
        }
        this.#gridArray[height - 1][col - 1][row - 1] = block;
        this.#gridGroup.add(block.getObject());

        return block;
    }

    addOffset(x, y, z){
        Helpers.addPositionToItem(this.#gridGroup, x, y, z);
    }

    removeBlock(height, col, row){
        this.#gridGroup.remove(this.#gridArray[height - 1][col - 1][row - 1].getObject());
        this.#gridArray[height - 1][col - 1][row - 1] = null;
    }

    swapBlocks(height1, col1, row1, height2, col2, row2){
        //check raw coordinates
        if(this.checkCoordinateInBounds(height1, col1, row1) == false){
            console.log("First set of coordinates are invalid");
            return;
        }
        if(this.checkCoordinateInBounds(height2, col2, row2) == false){
            console.log("Second set of coordinates are invalid");
            return;
        }
        //get index in gridArray
        const rowInGrid1 = GridOfBlocks.getRowInGrid(row1);
        const rowInGrid2 = GridOfBlocks.getRowInGrid(row2);

        //swaps blocks around
        let block1 = this.#gridArray[height1][col1][rowInGrid1];
        let block2 = this.#gridArray[height2][col2][rowInGrid2];
        this.#gridArray[height1][col1][rowInGrid1] = block2;
        this.#gridArray[height2][col2][rowInGrid2] = block1;

        //use true coordinate system
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

    checkCoordinateInBounds(height, col, row){
        if(height < 0 || height >= this.#height){
            console.log("Out of bounds; target height: " + (height + 1) + ", max height: " + this.#height);
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

    isBlockBelowWalkable(height, col, row){
        const isNull = this.#gridArray[height - 1][col][GridOfBlocks.getRowInGrid(row)] == null;
        if(isNull == true){
            console.log("Block below is null");
            return false;
        }
        const isWalkable = this.#gridArray[height - 1][col][GridOfBlocks.getRowInGrid(row)].isWalkable();
        if(isWalkable == false){
            console.log("Block below not walkable");
            return false;
        }
        return true;
    }

    isBlockPassable(height, col, row){
        const isNull = this.#gridArray[height][col][GridOfBlocks.getRowInGrid(row)] == null;
        if(isNull == true){
            console.log("Block in front is null");
            return true;
        }
        const isSolid = this.#gridArray[height][col][GridOfBlocks.getRowInGrid(row)].isSolid();
        if(isSolid == true){
            console.log("There is a block blocking the way");
            return false;
        }
        return true;
    }

    isBlockPushable(height, col, row){
        const isNull = this.#gridArray[height][col][GridOfBlocks.getRowInGrid(row)] == null;
        if(isNull == true){
            console.log("Block in front is null");
            return false;
        }
        const isPushable = this.#gridArray[height][col][GridOfBlocks.getRowInGrid(row)].isPushable();
        if(isPushable == false){
            console.log("Block in front is not pushable");
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