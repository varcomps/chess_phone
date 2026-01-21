
export const gameState = {
    db: null,
    gameRef: null,
    myColor: null,
    currentRoom: null,
    playerColor: 'w', // Чей сейчас ход (глобально)
    isBuildMode: false,
    isAdminMode: false, 
    actionsLeft: 0,
    gameOver: false,
    isExpanded: false,
    expansionAnimationDone: false,
    rows: 8, // Динамическое количество строк
    cols: 8,
    selectedPiece: null,
    board: Array(8).fill(null).map(() => Array(8).fill(null)),
    
    // Локальные ресурсы (каждый игрок считает свои сам)
    myResources: { 
        wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, 
        food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0,
        mana_gem: 0 
    },
    
    visibilityMask: [], // Маска видимости (true - видно, false - туман)
    
    pendingMove: null,
    pendingInteraction: null, 
    lastOpponentMove: null, // Последний ход врага (для отрисовки стрелки)
    isTargetingMode: false,
    targetingSource: null
};
