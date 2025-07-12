import { GridOfBlocks } from "./grid";

export class ListOfGrids {
    #grids = new Map();
    #numberOfGrids = 0;
    #currentGridID = "";
    #sceneObj;

    constructor(scene){
        this.#sceneObj = scene;
    }

    getJSONfromLevel(legends){
        let jsonData = {};
        jsonData.grids = new Array(this.#numberOfGrids);
        let idx = 0;
        this.#grids.forEach(value => {
            jsonData.grids[idx] = value.convertToJSONString(legends);
            idx++;
        })
        return jsonData;
    }

    initLevelFromJSON(configFile, legends){
        if(!configFile) return;
        this.#numberOfGrids = configFile.grids.length;
        console.log(configFile.grids)
        this.#currentGridID = null;
        configFile.grids.forEach(element => {
            if(!this.#currentGridID) this.#currentGridID = element.gridID;
            const newGrid = new GridOfBlocks(0, 0, 0);
            this.generateLevelFromJSON(newGrid, element, this.#sceneObj, legends);
            this.#grids.set(element.gridID, newGrid);
        });
        this.getCurrentGrid().attachToItem(this.#sceneObj);
    }

    destroyLevels(){
        this.getCurrentGrid().detachFromItem(this.#sceneObj);
        this.#grids.forEach(value => {
            value.prepareForNewLevel(0, 0, 0);
        });
        this.#grids.clear();
    }

    generateLevelFromJSON(grid, levelData, scene, legends){
        if(!levelData || !Array.isArray(levelData.layers) || !levelData.gridSize || !levelData.gridID){
            console.error("Invalid level data format");
            return;
        }
        if(!legends){
            console.error("Legend data not loaded; aborting");
            return;
        }
        const {height, columns, rows} = levelData.gridSize;
        grid.detachFromItem(scene);
        //initialize dimensions
        grid.prepareForNewLevel(height, columns, rows);  
        grid.setCenter();
        grid.addIsometricRotation();
        grid.setGridID(levelData.gridID);
        //place in blocks
        for(let i = 0; i < height; i++){
            const currLayer = levelData.layers[i];
            const currLayerLayout = currLayer.layout;
            //initialize new blocks; rows are iterated in reverse; row 0 is the bottom of the list
            for(let j = rows - 1; j >= 0; j--){
                for(let k = 0; k < columns; k++){
                    const gridRow = rows - j;
                    const blockType = legends.codeToType[currLayerLayout[j][k]];
                    if(!blockType){
                        console.warn(`Unrecognized symbol '${blockType}' at [${i}, ${k}, ${j}]. Skipping.`);
                        continue;
                    }
                    grid.addBlockToGrid(blockType, i+1, k+1, gridRow);
                }
            }
            //go through target blocks, set enterable directions
            const currTargets = currLayer.targets;
            if(currTargets && Array.isArray(currTargets)){
                for(let m = 0; m < currTargets.length; m++){
                    const [col, row] = currTargets[m].position;
                    const enterable = currTargets[m].directions.split("").map(element => element == "1");
                    const targetBlock = grid.getTarget(i+1, col, row);
                    if(targetBlock){
                        targetBlock.setEnterableDirection(...enterable);
                    }
                    else{
                        console.warn(`No target block found at layer ${i + 1}, col ${col}, row ${row}`);
                    }
                }
            }
        }
        console.log("Current level ID: ", grid.getGridID());
    }

    getGrid(gridID){
        return this.#grids.get(gridID);
    }

    getNumGrids(){
        return this.#numberOfGrids;
    }

    getCurrentGrid(){
        return this.#grids.get(this.#currentGridID);
    }

    changeToGrid(newGridID, scene){
        console.log(this.#grids)
        if(!Number.isInteger(newGridNum) || newGridNum < 1 || newGridNum > this.#numberOfGrids){
            console.log("Invalid floor selected");
            return false;
        }
        this.getCurrentGrid().detachFromItem(scene);
        this.#currentGridID = newGridID;
        this.getCurrentGrid().attachToItem(scene);
        return true;
    }
}