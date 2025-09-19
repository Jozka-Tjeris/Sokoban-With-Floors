Idea: Sokoban but 3D

20 June 2025: Creation of the document

Idea: Use files to store the configuration of each level

Space Types:
- Empty space (Default block)
- Target spaces
- Directional target spaces
- Teleporters

Block Types:
- Immovable blocks (Obstacles)
- Solid blocks (Pushable)
- Solid blocks (Pullable)
- Add ID tags to blocks and target spaces so only matching IDs work

Functions:
- Undo

- Camera lock
- Isometric (but rotatable camera), 30 degree-ish downward camera angle
- 2.5D

Notes:

22 June: 
- Grid generation mockup
- Player movement mockup
- Key binding
- Added logic to prevent walking into holes or solid walls

23 June:
- Refactored sections to separate files
- Changed from perspective camera to orthographic camera
- Simplified grid generation
- Added pushable blocks

24 June:
- Added target spaces
- Added logic to check target spaces when other blocks interact with them (i.e. basic win condition)
- Added pullable blocks
- Updated color scheme to improve contrast between block types
- Added support for target spaces to handle pullable blocks
- Refactored main animation loop

25 June:
- Reassigned mesh object creation to subclasses for finer control
- Added directional target spaces
- Refactored rendering order for blocks
- Updated player movement to handle directional target spaces

26 June:
- Refactored grid creation process (centering & rotation)
- Refined logic for handling pullable blocks

27 June:
- Integrated backend server into application
- Added clean-up procedure for objects in grid
- Simplified z-value handling in grid

28 June:
- Updated frontend to reflect level loading feature is in WIP status
- Refactored grid class to handle objects in a more standardized manner
- Integrated level loading into the main file
- Integrated level export data to user downloads

29 June:
- Integrated level import onto the application
- Added json file format checking

12 July:
- Added teleporter class
- Added list of grids class
- Integrated teleporters and list of grids into the main file
- Added base functionality for teleporters (without occupied checking at destination)

13 July:
- Abstracted player controller function into a new class
- Check if player entering teleporter already has its destination occupied in controller
- Added level that demonstrates teleporter interactions

14 July:
- Checked both origin and destination for teleporters for visual updates
- Added level that demonstrates ID-specific interactions
- Added condition to check IDs for level completion

16 July:
- Added animations to basic movements and block interactions
- Added teleport-specific animations (partial)
- Added checks to prevent unnecessary teleport checks during animations

17 July:
- Added opacity-changing for teleporter animation
- Added titles to display per grid

18 July:
- Displayed IDs on blocks and target spaces

23 July:
- Added textrues onto blocks
- Moved grid titles onto html display

24 July:
- Added ID update (green crystal core) for better clarity
- Hid ID labels behind toggleable button for visual simplicity

31 July:
- Added tutorial section
- Added CSS styling to webpage

2 August:
- Added about section
- Updated styling, resizing and controls section

3 August:
- Added switch to show/hide key presses

4 August:
- Added GIF images to supplement tutorial section
- Added sticky keys for some on-screen buttons for mobile functionality

7 August:
- Added first 12 levels (Basic, Pulls, Board)

8 August:
- Added 4 more levels (Warps)

9 August:
- Added 4 more levels (Label)

18 & 19 September:
- Deployed app using Vercel
- Added debug mode to hide console log statements
- Fixed import level bugs
- Fixed level naming bugs
- Removed unnecessary backend server
