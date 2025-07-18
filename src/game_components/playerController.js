import { Player } from "./blocks.js";
import { activeAnimationList } from "../main.js";
import { PlayerAction, BlockType } from "./blockConstants.js";

export class PlayerController{
    #level;
    #movementBindings = [
        { keys: ["w"], action: PlayerAction.UP },
        { keys: ["a"], action: PlayerAction.LEFT },
        { keys: ["s"], action: PlayerAction.DOWN },
        { keys: ["d"], action: PlayerAction.RIGHT }
    ];

    constructor(level){
        this.#level = level;
    }

    getMovementBindings(){
        return this.#movementBindings;
    }

    getMovementKeys(){
        return ["w", "s", "a", "d"];
    }

    getPullingKey(){
        return "Shift";
    }

    movePlayerInGrid(grid, player, direction){
        //stop if animations are happening
        if(activeAnimationList.length > 0) return;

        //stop if grid is null
        if(!grid) return;
    
        //preliminary check to restrict only players to be able to use this function
        if((player instanceof Player) == false) return;
    
        const directionVectors = {
            [PlayerAction.LEFT]: [0, -1, 0],
            [PlayerAction.RIGHT]: [0, 1, 0],
            [PlayerAction.UP]: [0, 0, 1],
            [PlayerAction.DOWN]: [0, 0, -1],
        };
    
        //grabs new position difference based on the direction specified
        const positionDiffs = directionVectors[direction] ?? [NaN, NaN, NaN];
        const newPosition = player.getPosition().map((value, index) => value + positionDiffs[index]);
        //gets the predicted pushable block's new position (assumed to go in the same direction)
        const newPushableBlockPosition = player.getPosition().map((value, index) => value + 2*positionDiffs[index]);
        //gets the predicted pullable block's current position (assumed to go in the opposite direction)
        const newPullableBlockPosition = player.getPosition().map((value, index) => value - positionDiffs[index]);
    
        if(newPosition.some(element => isNaN(element)) || 
            positionDiffs.some(element => isNaN(element)) || 
            grid.checkCoordinateInBounds(...newPosition) == false){
            return;
        }
    
        //check if player's next tile is a walkable tile
        if(grid.isBlockBelowWalkable(...newPosition) == false){
            return;
        }
        //check if player is not pulling (default move = pushing)
        else if(player.getActionState(PlayerAction.PULL) == false){
            //check if a pushable block is in front of the player
            if(grid.isBlockPushable(...newPosition)){
                //check if pushable block will stay in bounds
                if(grid.checkCoordinateInBounds(...newPushableBlockPosition) == false){
                    console.log("Pushable block can't go out of bounds");
                    return;
                }
                //check if the new position is walkable
                if(grid.isBlockBelowWalkable(...newPushableBlockPosition) == false){
                    console.log("Pushable block can't enter non-walkable space");
                    return;
                }
                //check if the new position is passable
                if(grid.isBlockPassable(...newPushableBlockPosition, direction) == false){
                    console.log("Player can't push current pushable block");
                    return;
                }
                //specific to teleporters: check if its destination spot is unoccupied
                const block = grid.getEnterable(...newPushableBlockPosition);
                if(block && block.type === BlockType.TELEPORTER){
                    const targetGrid = this.#level.getGrid(block.getTargetGridID());
                    //adjust position to account for indexing
                    if(targetGrid && !targetGrid.isBlockPassable(...block.getTargetGridPosition().map(value => value - 1))){
                        console.log("Currently can't teleport pushable block, teleporter destination is occupied");
                        return;
                    }
                }
                //apply change if prerequisites are met
                grid.swapBlocks(...newPosition, ...newPushableBlockPosition);
                grid.swapBlocks(...player.getPosition(), ...newPosition);
                console.log("Pushable block has moved.");
            }
            else{
                //non-pushable block, check if block is passable instead
                if(grid.isBlockPassable(...newPosition, direction) == false){
                    console.log("Player attempting to move to impassable location");
                    return;
                }
                //specific to teleporters: check if its destination spot is unoccupied
                const block = grid.getEnterable(...newPosition);
                if(block && block.type === BlockType.TELEPORTER){
                    const targetGrid = this.#level.getGrid(block.getTargetGridID());
                    //adjust position to account for indexing
                    if(targetGrid && !targetGrid.isBlockPassable(...block.getTargetGridPosition().map(value => value - 1))){
                        console.log("Currently can't teleport player, teleporter destination is occupied");
                        return;
                    }
                }
                grid.swapBlocks(...player.getPosition(), ...newPosition);
                console.log("Player has moved.");
            }
        }
        //checks if the player is pulling
        else if(player.getActionState(PlayerAction.PULL) == true){
            //check if position to pull from is in bounds
            if(grid.checkCoordinateInBounds(...newPullableBlockPosition) == false){
                console.log("Pullable block can't be out of bounds");
                return;
            }
            //check if block behind player is pullable
            if(grid.isBlockPullable(...newPullableBlockPosition) == false){
                console.log("Block behind player is not pullable");
                return;
            }
            //check if block being pulled ends up in a passable position (specific to directional targets)
            if(grid.isBlockPassable(...player.getPosition(), direction) == false){
                console.log("Player attempting to pull block into invalid direction");
                return;
            }
            //check if new position of player is passable
            if(grid.isBlockPassable(...newPosition, direction) == false){
                console.log("Player attempting to move to impassable location (currently pulling)");
                return;
            }
            //specific to teleporters: check if its destination spot is unoccupied
            const block = grid.getEnterable(...newPosition);
            if(block && block.type === BlockType.TELEPORTER){
                const targetGrid = this.#level.getGrid(block.getTargetGridID());
                //adjust position to account for indexing
                if(targetGrid && !targetGrid.isBlockPassable(...block.getTargetGridPosition().map(value => value - 1))){
                    console.log("Currently can't teleport player (currently pulling), teleporter destination is occupied");
                    return;
                }
            }
            const oldPlayerPosition = player.getPosition();
            //apply change if prerequisites are met
            grid.swapBlocks(...player.getPosition(), ...newPosition);
            grid.swapBlocks(...newPullableBlockPosition, ...oldPlayerPosition);
            console.log("Pullable block has moved");
        }
    }
}