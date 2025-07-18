import { Player, Block} from "./blocks.js";
import { PlayerAction, BlockType, BlockOpacity } from "./blockConstants.js";
import { GridOfBlocks } from "./grid.js";
import { PlayerController } from "./playerController.js";
import * as Helpers from "../utilities/helpers.js";
import * as AnimHelpers from '../utilities/animationHandler.js';

export class ListOfGrids {
    #grids = new Map();
    #numberOfGrids = 0;
    #currentGridID;
    #sceneObj;
    #playerController;
    #teleporterBlocks;
    #containsPlayer;
    #checkTeleporters;

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

    async initLevelFromJSON(configFile, legends){
        if(!configFile) return;
        this.#numberOfGrids = configFile.grids.length;
        this.#teleporterBlocks = [];
        this.#currentGridID = null;
        this.#containsPlayer = false;
        let generateGrid = true;
        this.destroyLevels();

        for(const element of configFile.grids){
            if(generateGrid){
                if(!this.#currentGridID){
                    this.#currentGridID = element.gridID;
                }
                const newGrid = new GridOfBlocks(0, 0, 0);
                const generatedCorrectly = await this.generateLevelFromJSON(newGrid, element, this.#sceneObj, legends);
                if(generatedCorrectly !== true){
                    this.destroyLevels();
                    generateGrid = false;
                }
                else{
                    this.#grids.set(element.gridID, newGrid);
                    this.#grids.get(element.gridID).setAnimationCall(() => {
                        this.setCheckTeleporters(true);
                    });
                }
            }
        }
        if(generateGrid){
            this.validateAllTeleporters();
            this.getCurrentGrid().attachToItem(this.#sceneObj);
            this.#sceneObj.add(this.getCurrentGrid().getTitle());
        }
    }

    moveCameraInGrid(x, y, z){
        Helpers.addPositionToItem(this.getCurrentGrid().getGroup(), x, y, z);
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

    setCheckTeleporters(status){
        this.#checkTeleporters = status;
    }

    getCheckTeleporters(){
        return this.#checkTeleporters;
    }

    validateAllTeleporters(){
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
                    const blockInstance = this.#grids.get(gridID).getBlock(...internalPosition);
                    const isMovable = blockInstance && (blockInstance.type === BlockType.PUSHABLE || blockInstance.type === BlockType.PULLABLE);
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
                // console.log(`Teleport block pointing to grid ID ${gridID} to position ${gridPosition} is valid.`);
            }
        })
    }

    transportBlockToGrid(oldGrid, newGrid, oldPosition, newPosition){
        const oldBlock = oldGrid.getBlock(...oldPosition);
        if(oldBlock == null) return false;
        const ajustedNewPos = newPosition.map(value => value - 1);
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
        newGrid.addBlockToGrid(oldBlock.type, ...newPosition);
        if(isPlayer){
            for (const value in PlayerAction) {
                newGrid.getPlayer().toggleActionState(playerActions.get(value), PlayerAction[value]);
            }
        }
        return true;
    }

    checkDestinationOccupied(teleporter){
        //check target destination if occupied
        const targetDest = this.#grids.get(teleporter.getTargetGridID());
        if(targetDest){
            if(targetDest.getBlock(...teleporter.getTargetGridPosition().map(value => value - 1)) instanceof Block){
                teleporter.setDestinationOccupied(true);
            }else{
                teleporter.setDestinationOccupied(false);
            }
        }
    }

    checkAllTeleporters(){
        if(!this.#teleporterBlocks) return;

        //update all teleporters in all grids
        this.#grids.values().forEach(value => {
            value.updateTeleporters();
        })

        this.#teleporterBlocks.forEach(value => {
            if(value.getFilled()){
                let oldBlock = this.getCurrentGrid().getBlock(...value.getPosition());
                const oldGridID = this.getCurrentGrid().getGridID();
                value.setFilled(false);
                AnimHelpers.animateTeleportToItemExitBlock(oldBlock.getObject(), BlockOpacity[oldBlock.type], () => {
                    //wait on the original grid first
                    setTimeout(() => {
                        const successful = this.transportBlockToGrid(this.getCurrentGrid(), this.#grids.get(value.getTargetGridID()), value.getPosition(), value.getTargetGridPosition());
                        if(successful){
                            const newBlock = this.#grids.get(value.getTargetGridID()).getBlock(...value.getTargetGridPosition().map(value => value - 1));
                            Helpers.addPositionToItem(newBlock.getObject(), 0, 1, 0);
                            //disable opacity and depthWrite
                            newBlock.getObject().material.opacity = 0;
                            newBlock.getObject().traverse(object => {
                                object.material.depthWrite = false;
                            })

                            console.log(`Changing to grid ${value.getTargetGridID()}`)
                            this.changeToGrid(value.getTargetGridID(), this.#sceneObj);
                            //wait on the destination grid first
                            setTimeout(() => {
                                AnimHelpers.animateTeleportToItemEnterBlock(newBlock.getObject(), BlockOpacity[newBlock.type], () => {
                                    if(oldBlock.type !== BlockType.PLAYER){
                                        //wait before changing back to the original grid
                                        setTimeout(() => {
                                            console.log(`Changing back to grid ${oldGridID}`)
                                            this.changeToGrid(oldGridID, this.#sceneObj);
                                        }, 500);
                                    }
                                    this.checkDestinationOccupied(value);
                                });
                            }, 300)
                        }
                    }, 500)
                })
            }
            this.checkDestinationOccupied(value);
        });
    }

    async generateLevelFromJSON(grid, levelData, scene, legends){
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
        await grid.setTitle(levelData.gridTitle);
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
                        this.#teleporterBlocks.push(grid.getEnterable(i, k, gridRow-1));
                    }
                }
            }
            //go through target blocks, set enterable directions and IDs
            const currTargets = currLayer.targets;
            if(currTargets && Array.isArray(currTargets)){
                for(let m = 0; m < currTargets.length; m++){
                    const [col, row] = currTargets[m].position;
                    const enterable = currTargets[m].directions.split("").map(element => element == "1");
                    const id = currTargets[m].id ?? null;
                    const targetBlock = grid.getEnterable(i, col-1, row-1);
                    if(targetBlock){
                        targetBlock.setEnterableDirection(...enterable);
                        targetBlock.setObjectID(id);
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
                    const teleportBlock = grid.getEnterable(i, col-1, row-1);
                    if(teleportBlock){
                        teleportBlock.setTargetSpace(targetID, ...targetPosition);
                    }
                    else{
                        console.warn(`No teleport block found at layer ${i + 1}, col ${col}, row ${row}`);
                    }
                }
            }
            //go through movable blocks, set IDs
            const currBlocks = currLayer.blocks;
            if(currBlocks && Array.isArray(currBlocks)){
                for(let p = 0; p < currBlocks.length; p++){
                    const [col, row] = currBlocks[p].position;
                    const id = currBlocks[p].id ?? null;
                    const block = grid.getBlock(i, col-1, row-1);
                    if(block){
                        block.setObjectID(id);
                    }
                    else{
                        console.warn(`No block found at layer ${i + 1}, col ${col}, row ${row}`);
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
        this.#sceneObj.remove(this.getCurrentGrid().getTitle());
        this.#currentGridID = newGridID;
        this.getCurrentGrid().attachToItem(scene);
        this.getCurrentGrid().setCenter();
        this.#sceneObj.add(this.getCurrentGrid().getTitle());
        return true;
    }

    updatePlayerActions(keyStates){
        const grid = this.getCurrentGrid();

        if(!grid){
            return;
        }

        if(grid.getPlayer() instanceof Player == false){
            console.log("Current grid doesn't have a valid player, aborting");
            return;
        }

        const keyNames = [...this.#playerController.getMovementKeys(), 
            this.#playerController.getPullingKey()
        ]

        for(let i = 0; i < keyNames.length; i++){
            if(keyStates.hasOwnProperty(keyNames[i]) != true){
                console.error(`Key binding ${keyNames[i]} missing from key states, aborting`);
                return;
            }
        }

        //check player interaction for pulling
        grid.getPlayer().toggleActionState(keyStates[this.#playerController.getPullingKey()], PlayerAction.PULL);

        for(const { keys, action } of this.#playerController.getMovementBindings()){
            const isKeyHeld = keys.some(keyValue => keyStates[keyValue]);
            //check if key is held down and action is not perfomed yet
            if(isKeyHeld && grid.getPlayer() && !grid.getPlayer().getActionState(action)){
                grid.getPlayer().toggleActionState(true, action);
                this.#playerController.movePlayerInGrid(grid, grid.getPlayer(), action);
                //check all grids
                let areAllTargetsFilled = true;
                this.#grids.values().forEach(value => {
                    const expression = value.verifyTargetSpaces();
                    areAllTargetsFilled &&= expression;
                })
                console.log("All target spaces filled: " + areAllTargetsFilled);
            }
            //check if key is no longer held down, unlocks movement for future keypresses
            if(!isKeyHeld && grid.getPlayer()){
                grid.getPlayer().toggleActionState(false, action);
            }
        }
    }
}
