export const PIECE_URLS = {
    wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    
    wram: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjOGI0NTEzIiBkPSJNMjAgMTgwaDQwMHYxNTBIMjB6Ii8+PHBhdGggZmlsbD0iIzU1NSIgZD0iTTQyMCAxNjBoODJ2MTkwaC04MnoiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIzNTAiIHI9IjQwIiBmaWxsPSIjNDQ0Ii8+PGNpcmNsZSBjeD0iMzUwIiBjeT0iMzUwIiByPSI0MCIgZmlsbD0iIzQ0NCIvPjwvc3ZnPg==',
    // Иконка торпеды (ракета)
    wtorpedo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZTc0YzNjIiBkPSJNMTUwIDEwMCBMNDAwIDI1NiBMMTUwIDQxMiBaIi8+PC9zdmc+',

    bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    
    bram: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjOGI0NTEzIiBkPSJNMjAgMTgwaDQwMHYxNTBIMjB6Ii8+PHBhdGggZmlsbD0iIzU1NSIgZD0iTTQyMCAxNjBoODJ2MTkwaC04MnoiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIzNTAiIHI9IjQwIiBmaWxsPSIjNDQ0Ii8+PGNpcmNsZSBjeD0iMzUwIiBjeT0iMzUwIiByPSI0MCIgZmlsbD0iIzQ0NCIvPjwvc3ZnPg==',
    btorpedo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZTc0YzNjIiBkPSJNMTUwIDEwMCBMNDAwIDI1NiBMMTUwIDQxMiBaIi8+PC9zdmc+'
};

export const BUILDINGS = [
    'hq', 'hq_t2', 'hq_t3', 'hq_t4', 
    'camp', 'academy', 'academy_t2', 'workshop',
    'lumber', 'lumber_t2', 'lumber_t3', 'lumber_t4', 
    'mine', 'mine_t2', 'mine_t3', 'mine_t4', 
    'papermill', 'jeweler',
    'farm', 'house', 
    'fortress', 'fortress_t2', 'fortress_t3', 
    'barricade', 'warehouse',
    'magetower', 'torpedo_tower'
];

export const T2_BUILDINGS = ['academy', 'lumber_t2', 'mine_t2', 'fortress', 'warehouse', 'hq_t2', 'papermill']; 
export const T3_BUILDINGS = ['lumber_t3', 'mine_t3', 'fortress_t2', 'academy_t2', 'hq_t3', 'workshop', 'magetower', 'jeweler']; 
export const T4_BUILDINGS = ['lumber_t4', 'mine_t4', 'hq_t4', 'fortress_t3', 'torpedo_tower'];

export const BUILDING_ICONS = { 
    hq: '🏰', hq_t2: '🏯', hq_t3: '🏙️', hq_t4: '🛰️',
    camp: '⛺', academy: '🎖️', academy_t2: '🏛️',
    lumber: '🪓', lumber_t2: '🌲', lumber_t3: '🧪', lumber_t4: '☣️',
    mine: '⛏️', mine_t2: '🏗️', mine_t3: '💎', mine_t4: '⚛️',
    papermill: '📜', 
    warehouse: '📦', farm: '🚜', house: '🏠',
    barricade: '🚧', 
    fortress: '🧱',      
    fortress_t2: '🗼',   
    fortress_t3: '🛡️',   
    workshop: '🛠️',      
    magetower: '🔮',     
    jeweler: '💍',
    torpedo_tower: '🚀',       
    demolish: '🧨'
};

export const BUILDING_COSTS = {
    // TIER 1
    hq: { wood: 4, stone: 4, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    camp: { wood: 3, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    lumber: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    mine: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    farm: { wood: 2, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    demolish: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    barricade: { wood: 0, stone: 2, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    
    // TIER 2
    fortress: { wood: 0, stone: 5, metal: 2, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    lumber_t2: { wood: 4, stone: 2, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    mine_t2: { wood: 2, stone: 4, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    academy: { wood: 4, stone: 4, metal: 2, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 }, 
    warehouse: { wood: 2, stone: 2, metal: 2, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    hq_t2: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    papermill: { wood: 4, stone: 2, metal: 2, cedar: 4, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },

    // TIER 3
    fortress_t2: { wood: 0, stone: 5, metal: 5, cedar: 0, paper: 0, food: 0, gem: 2, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    lumber_t3: { wood: 4, stone: 4, metal: 4, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    mine_t3: { wood: 4, stone: 4, metal: 2, cedar: 4, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    academy_t2: { wood: 2, stone: 2, metal: 2, cedar: 2, paper: 0, food: 0, gem: 2, coal: 0, polymer: 2, uranium: 0, chemical: 0, mana_gem: 0 }, 
    hq_t3: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 4, coal: 0, polymer: 4, uranium: 0, chemical: 0, mana_gem: 0 },
    workshop: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0, uranium: 0, chemical: 0, mana_gem: 0 },
    magetower: { wood: 0, stone: 4, metal: 4, cedar: 0, paper: 0, food: 0, gem: 4, coal: 0, polymer: 4, uranium: 0, chemical: 0, mana_gem: 0 },
    jeweler: { wood: 4, stone: 4, metal: 2, cedar: 4, paper: 0, food: 0, gem: 0, coal: 0, polymer: 2, uranium: 0, chemical: 0, mana_gem: 0 },

    // TIER 4
    fortress_t3: { wood: 0, stone: 5, metal: 5, cedar: 0, paper: 0, food: 0, gem: 5, coal: 0, polymer: 0, uranium: 2, chemical: 2, mana_gem: 0 },
    lumber_t4: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 2, coal: 0, polymer: 4, uranium: 0, chemical: 0, mana_gem: 0 },
    mine_t4: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 4, coal: 0, polymer: 2, uranium: 0, chemical: 0, mana_gem: 0 },
    hq_t4: { wood: 4, stone: 4, metal: 4, cedar: 4, paper: 0, food: 0, gem: 4, coal: 0, polymer: 4, uranium: 4, chemical: 4, mana_gem: 0 },
    // 5 всех ресурсов кроме еды и бумаги
    torpedo_tower: { wood: 5, stone: 5, metal: 5, cedar: 5, paper: 0, food: 0, gem: 5, coal: 5, polymer: 5, uranium: 5, chemical: 5, mana_gem: 5 }
};

export const BUILDING_LIMITS = { 
    hq: 1, hq_t2: 1, hq_t3: 1, hq_t4: 1, 
    camp: 1, academy: 1, academy_t2: 1, workshop: 1, magetower: 2, jeweler: 1,
    torpedo_tower: 1,
    papermill: 1, lumber: 1, mine: 1, farm: 1, 
    fortress: 4, fortress_t2: 4, fortress_t3: 2, 
    barricade: 2, // ЛИМИТ БАРРИКАД ИЗМЕНЕН НА 2
    warehouse: 1 
};

export const FORTRESS_HP = { 
    fortress: 2,     
    fortress_t2: 4,  
    fortress_t3: 8,  
    hq_t2: 1, hq_t3: 2, hq_t4: 3 
};