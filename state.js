export const gameState = {
    db: null,
    gameRef: null,
    myColor: null,
    currentRoom: null,
    playerColor: null,
    isBuildMode: false,
    actionsLeft: 0,
    gameOver: false,
    isExpanded: false,
    expansionAnimationDone: false,
    rows: 8,
    cols: 8,
    selectedPiece: null,
    board: Array(8).fill(null).map(() => Array(8).fill(null)),
    
    myResources: { 
        wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, 
        food: 0, gem: 0, coal: 0, polymer: 0 
    },
    
    pendingMove: null,
    pendingAcademy: null,
    lastOpponentMove: null // Для подсветки последнего хода противника
};