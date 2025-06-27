Idea: Sokoban but 3D

20 June 2025: Creation of the document

Idea: Use files to store the configuration of each level

Space Types:
- Empty space (Default block)
- Target spaces (Fill Entirely) (Can be drawn as a frame box)
- Directional target spaces (Can only be hit from certain direction(s)) (Can be drawn as a partially open frame box with added glow on open sides)

Basic Block Types:
- Immovable blocks (Obstacles)
- Ramps (Changing block heights)
- Solid blocks (Pushable)
- Solid blocks (Pullable)
- Add ID tags to blocks and target spaces so only matching IDs work

Miscellaneous Effects:
- Gravity 
- Gates
- Switches
- Moving walls & Obstacles
- Fragile floors

Functions:
- Undo

Ways to deal with multiple layers:
- Transparency filters (30-50%) or dimming
- Grayscaling different layers to add context or numbering
- Camera lock
- Toggle visibility on other layers
- Isometric (but rotatable camera), 30 degree-ish downward camera angle
- 2.5D

Add a level editor for easy testing and mockups.

Todo: create an encoding for storing level information into a JSON-esque file.

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
