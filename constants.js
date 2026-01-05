export const PIECE_URLS = {
    wk: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    wq: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    wr: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    wb: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    wn: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    wp: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    bk: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    bq: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    br: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    bn: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bp: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
};

export const BUILDINGS = ['hq', 'camp', 'academy', 'academy_t2', 'lumber', 'lumber_t2', 'lumber_t3', 'mine', 'mine_t2', 'mine_t3', 'papermill', 'papermill_t2', 'farm', 'house', 'fortress', 'fortress_t2', 'fortress_t3', 'forge', 'furnace', 'barricade', 'warehouse'];
export const T2_BUILDINGS = ['academy', 'lumber_t2', 'mine_t2', 'fortress_t2', 'furnace', 'warehouse', 'papermill_t2'];
export const T3_BUILDINGS = ['lumber_t3', 'mine_t3', 'fortress_t3', 'forge', 'academy_t2']; 

export const BUILDING_ICONS = { 
    hq: '🏰', camp: '⛺', 
    academy: '🎓', academy_t2: '🏛️', 
    lumber: '🪓', lumber_t2: '🌲', lumber_t3: '🧬', 
    mine: '⛏️', mine_t2: '🏗️', mine_t3: '💎',
    papermill: '📜', papermill_t2: '🖨️', farm: '🌾',
    house: '🏠', demolish: '🧨',
    fortress: '🧱', fortress_t2: '🛡️', fortress_t3: '🏯',
    forge: '⚒️', furnace: '🔥',
    barricade: '🚧', warehouse: '📦'
};

export const BUILDING_COSTS = {
    hq: { wood: 2, stone: 4, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    camp: { wood: 3, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    lumber: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    mine: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    papermill: { wood: 2, stone: 2, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    farm: { wood: 2, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    furnace: { wood: 0, stone: 3, metal: 1, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    fortress: { wood: 0, stone: 4, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    demolish: { wood: 0, stone: 0, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    barricade: { wood: 0, stone: 2, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    
    // TIER 2 UPGRADES
    lumber_t2: { wood: 4, stone: 2, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    mine_t2: { wood: 2, stone: 4, metal: 0, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    academy: { wood: 4, stone: 4, metal: 2, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 }, // Camp -> Academy
    fortress_t2: { wood: 0, stone: 4, metal: 2, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    warehouse: { wood: 2, stone: 2, metal: 2, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    papermill_t2: { wood: 0, stone: 0, metal: 2, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 }, // Upgrade Papermill

    // TIER 3 UPGRADES
    lumber_t3: { wood: 4, stone: 2, metal: 2, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    mine_t3: { wood: 2, stone: 4, metal: 2, cedar: 2, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    fortress_t3: { wood: 0, stone: 5, metal: 5, cedar: 0, paper: 0, food: 0, gem: 0, coal: 0, polymer: 0 },
    academy_t2: { wood: 2, stone: 2, metal: 2, cedar: 2, paper: 0, food: 0, gem: 2, coal: 0, polymer: 2 }, // Academy -> University
    forge: { wood: 5, stone: 0, metal: 5, cedar: 0, paper: 0, food: 0, gem: 5, coal: 5, polymer: 0 }
};

export const BUILDING_LIMITS = { hq: 1, camp: 1, academy: 1, academy_t2: 1, papermill: 1, papermill_t2: 1, lumber: 2, mine: 2, farm: 2, fortress: 4, forge: 1, furnace: 2, barricade: 6, warehouse: 1 };
export const FORTRESS_HP = { fortress: 2, fortress_t2: 4, fortress_t3: 8, barricade: 1 };