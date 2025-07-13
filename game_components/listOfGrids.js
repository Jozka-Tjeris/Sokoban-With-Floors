import { PlayerAction, BlockType, Player} from "./blocks.js";
import { GridOfBlocks } from "./grid.js";
import { PlayerController } from "./playerController.js";

export class ListOfGrids {
    #grids = new Map();
    #numberOfGrids = 0;
    #currentGridID;
    #sceneObj;
    #playerController;
    #teleporterBlocks;
    #containsPlayer;

    constructor(scene){
        this.#containsPlayer = false;
        this.#sceneObj = scene;
        this.#playerController = new PlayerController(this);
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
        this.#teleporterBlocks = [];
        this.#currentGridID = null;
        this.#containsPlayer = false;
        let generateGrid = true;
        configFile.grids.forEach(element => {
            if(generateGrid){
                if(!this.#currentGridID){
                    this.#currentGridID = element.gridID;
                }
                const newGrid = new GridOfBlocks(0, 0, 0);
                const generatedCorrectly = this.generateLevelFromJSON(newGrid, element, this.#sceneObj, legends);
                if(generatedCorrectly !== true){
                    this.destroyLevels();
                    generateGrid = false;
                }
                else{
                    this.#grids.set(element.gridID, newGrid);
                }
            }
        });
        if(generateGrid){
            this.validateAllTeleporters();
            this.getCurrentGrid().attachToItem(this.#sceneObj);
        }
    }

    destroyLevels(){
        if(this.getCurrentGrid()){
            this.getCurrentGrid().detachFromItem(this.#sceneObj);
        }
        this.#grids.forEach(value => {
            value.clearAll();
        });
        this.#grids.clear();
    }

    validateAllTeleporters(){
        console.log(this.#teleporterBlocks)
        this.#teleporterBlocks.forEach(value => {
            const gridID = value.getTargetGridID();
            const gridPosition = value.getTargetGridPosition();
            //translate gridPosition to internal coordinate system
            let internalPosition = new Array(gridPosition.length);
            for(let i = 0; i < gridPosition.length; i++){
                internalPosition[i] = gridPosition[i] - 1;
            }
            //check if gridID exists within the level
            let isValid = true;
            if(!this.#grids.has(gridID)){
                console.warn(`Grid ID ${gridID} is not valid`);
                isValid = false;
            }
            else{
                //then check if the position in that grid is valid:
                //walkable underneath
                if(!this.#grids.get(gridID).isBlockBelowWalkable(...internalPosition)){
                    console.warn(`Target position ${gridPosition} is not walkable`);
                    isValid = false;
                }
                //not occupied by non-movable object
                if(!this.#grids.get(gridID).isBlockPassable(...internalPosition)){
                    const blockInstance = this.#grids.get(gridID).getBlock(...gridPosition);
                    const isMovable = blockInstance instanceof BlockType.PUSHABLE || blockInstance instanceof BlockType.PULLABLE;
                    //special case where object is movable, allow in that case, reject otherwise
                    if(!isMovable){
                        console.warn(`Target position ${gridPosition} contains an immovable block`);
                        isValid = false;
                    }
                }
            }

            if(!isValid){
                console.warn(`Teleport block pointing to grid ID ${gridID} to position ${gridPosition} is invalid, Disabling block.`);
                value.setDisabled();
            }
            else{
                console.log(`Teleport block pointing to grid ID ${gridID} to position ${gridPosition} is valid.`);
            }
        })
    }

    transportBlockToGrid(oldGrid, newGrid, oldPosition, newPosition){
        const oldBlock = oldGrid.getBlock(...oldPosition);
        if(oldBlock == null) return false;
        const ajustedNewPos = newPosition.map(value => value - 1);
        console.log(newGrid.getBlock(...ajustedNewPos))
        if(newGrid.getBlock(...ajustedNewPos)){
            console.warn(`Block already occupies destination of teleporter for grid ${newGrid.getGridID()} at position ${newPosition}`);
            return false;
        }
        let playerActions = new Map();
        const isPlayer = oldBlock.type === BlockType.PLAYER;
        if(isPlayer){
            for (const value in PlayerAction) {
                playerActions.set(value, oldBlock.getActionState(PlayerAction[value]));
            }
        }
        const adjustedOldPos = oldPosition.map(value => value + 1);
        oldGrid.removeBlock(...adjustedOldPos);
        console.log(oldGrid.getGridID(), newGrid.getGridID(), this.getCurrentGrid().getGridID(), newPosition)
        newGrid.addBlockToGrid(oldBlock.type, ...newPosition);
        if(isPlayer){
            for (const value in PlayerAction) {
                newGrid.getPlayer().toggleActionState(playerActions.get(value), PlayerAction[value]);
            }
        }
        return true;
    }

    checkAllTeleporters(){
        this.#teleporterBlocks.forEach(value => {
            console.log(value.getFilled())
            if(value.getFilled()){
                let oldBlock = this.getCurrentGrid().getBlock(...value.getPosition());
                const successful = this.transportBlockToGrid(this.getCurrentGrid(), this.#grids.get(value.getTargetGridID()), value.getPosition(), value.getTargetGridPosition());
                value.setFilled(false);
                if(successful){
                    if(oldBlock.type === BlockType.PLAYER){
                        console.log(`Changing to grid ${value.getTargetGridID()}`)
                        this.changeToGrid(value.getTargetGridID(), this.#sceneObj);
                    }
                }
            }
        });
    }

    generateLevelFromJSON(grid, levelData, scene, legends){
        if(!levelData || !Array.isArray(levelData.layers) || !levelData.gridSize || !levelData.gridID){
            console.error("Invalid level data format");
            alert("Invalid level data format");
            return false;
        }
        if(!legends){
            console.error("Legend data not loaded; aborting");
            alert("Legend data not loaded; aborting");
            return false;
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
                    if(blockType === BlockType.PLAYER){
                        if(!this.#containsPlayer){
                            this.#containsPlayer = true;
                        }
                        else{
                            console.error(`Player already exists in a previous location, aborting.`);
                            alert(`Player already exists in a previous location, aborting.`);
                            return false;
                        }
                    }
                    grid.addBlockToGrid(blockType, i+1, k+1, gridRow);
                    if(blockType === BlockType.TELEPORTER){
                        this.#teleporterBlocks.push(grid.getEnterable(i+1, k+1, gridRow));
                    }
                }
            }
            //go through target blocks, set enterable directions
            const currTargets = currLayer.targets;
            if(currTargets && Array.isArray(currTargets)){
                for(let m = 0; m < currTargets.length; m++){
                    const [col, row] = currTargets[m].position;
                    const enterable = currTargets[m].directions.split("").map(element => element == "1");
                    const targetBlock = grid.getEnterable(i+1, col, row);
                    if(targetBlock){
                        targetBlock.setEnterableDirection(...enterable);
                    }
                    else{
                        console.warn(`No target block found at layer ${i + 1}, col ${col}, row ${row}`);
                    }
                }
            }
            //go through teleporter blocks, set destinations
            const currTeleporters = currLayer.teleporters;
            if(currTeleporters && Array.isArray(currTeleporters)){
                for(let n = 0; n < currTeleporters.length; n++){
                    const [col, row] = currTeleporters[n].position;
                    const targetID = currTeleporters[n].targetGridID;
                    const targetPosition = currTeleporters[n].targetGridPosition;
                    const teleportBlock = grid.getEnterable(i+1, col, row);
                    if(teleportBlock){
                        teleportBlock.setTargetSpace(targetID, ...targetPosition);
                    }
                    else{
                        console.warn(`No teleport block found at layer ${i + 1}, col ${col}, row ${row}`);
                    }
                }
            }
        }
        console.log("Current level ID: ", grid.getGridID());
        return true;
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
        if(!this.#grids.has(newGridID)){
            console.error(`New gridID ${newGridID} doesn't exist`);
            return false;
        }
        this.getCurrentGrid().detachFromItem(scene);
        this.#currentGridID = newGridID;
        this.getCurrentGrid().attachToItem(scene);
        return true;
    }

    updatePlayerActions(keyStates){
        const grid = this.getCurrentGrid();

        if(!grid){
            console.log("Current grid doesn't exist, aborting");
            return;
        }

        if(grid.getPlayer() instanceof Player == false){
            console.error("Current grid doesn't have a valid player, aborting");
            return;
        }

        const keyNames = [...this.#playerController.getMovementKeys(), "Shift", "e"]

        for(let i = 0; i < keyNames.length; i++){
            if(keyStates.hasOwnProperty(keyNames[i]) != true){
                console.error(`Key binding ${keyNames[i]} missing from key states, aborting`);
                return;
            }
        }

        //check player interaction for pulling
        grid.getPlayer().toggleActionState(keyStates["Shift"], PlayerAction.PULL);

        for(const { keys, action } of this.#playerController.getMovementBindings()){
            const isKeyHeld = keys.some(keyValue => keyStates[keyValue]);
            //check if key is held down and action is not perfomed yet
            if(isKeyHeld && grid.getPlayer() && !grid.getPlayer().getActionState(action)){
                grid.getPlayer().toggleActionState(true, action);
                this.#playerController.movePlayerInGrid(grid, grid.getPlayer(), action);
            }
            //check if key is no longer held down, unlocks movement for future keypresses
            if(!isKeyHeld && grid.getPlayer()){
                grid.getPlayer().toggleActionState(false, action);
            }
        }
    }
}
