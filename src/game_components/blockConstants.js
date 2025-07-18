export const BlockType = {
    NONE: 'none',
    BLOCK: 'block',
    ENTERABLE: 'enterable',
    PLAYER: 'player',
    PUSHABLE: 'pushable',
    PULLABLE: 'pullable',
    WALL: 'wall',
    FLOOR: 'floor',
    TARGET: 'target',
    TELEPORTER: 'teleporter'
};

export const PlayerAction = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
    PULL: 4,
    TELEPORT: 5
}

export const BlockRenderOrder = {
    NONE: 0,
    FLOOR: 0,
    WALL: 1,
    TRANSPARENT_BLOCK: 2,
    TARGET: 3,
    BORDER: 4,
    PLAYER: 0
}

export const BlockColor = {
    [BlockType.NONE]: 0x0,
    [BlockType.BLOCK]: 0x222222,
    [BlockType.PLAYER]: 0xffff00,
    [BlockType.PUSHABLE]: 0x0000ff,
    [BlockType.PULLABLE]: 0xff9911,
    //alternating colors depending on parity
    [BlockType.WALL]: [0xff0000, 0x00ff00],
    [BlockType.FLOOR]: [0x444444, 0xbcbcbc],
    //placeholder followed by border color
    [BlockType.ENTERABLE]: [0x0, 0x371300],
    //default color, push correct, pull correct, push incorrect, pull incorrect
    [BlockType.TARGET]: [0xa8ffff, 0xff88ff, 0xff44dd, 0xc2185b, 0xd70000],
    //active color, occupied color
    [BlockType.TELEPORTER]: [0xfcba03, 0xa8914a]
}

export const BlockOpacity = {
    [BlockType.NONE]: 0,
    [BlockType.BLOCK]: 1,
    [BlockType.PLAYER]: 1,
    [BlockType.PUSHABLE]: 0.7,
    [BlockType.PULLABLE]: 0.8,
    [BlockType.WALL]: 1,
    [BlockType.FLOOR]: 1,
    [BlockType.ENTERABLE]: 0.8,
    //default color, push correct, pull correct, push incorrect, pull incorrect
    [BlockType.TARGET]: [0.8, 0.5, 0.4, 0.5, 0.4],
    //active color, occupied color
    [BlockType.TELEPORTER]: [0.8, 0.8]
}