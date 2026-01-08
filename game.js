import { gameState } from './state.js';
import { BUILDING_COSTS, BUILDING_LIMITS, FORTRESS_HP, BUILDINGS, PIECE_URLS, BUILDING_ICONS } from './constants.js';
import { sendNetworkMessage } from './network.js';
import { updateUI, render, recalcBoard, showToast, hasSpecial, isFog, isUpgradedUnit, openAcademyModal, closeModal, showPromotionModal, endGame, initDrag, dragState, showTurnBanner, playSlashAnimation, openCampModal, openWorkshopModal, openProductionModal, openMageTowerModal, playMagicShot, openTorpedoModal } from './ui.js';

export function initBoard() {
    gameState.playerColor = gameState.myColor;
    gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
    const layout = ['r','n','b','q','k','b','n','r'];
    for(let i=0; i<8; i++) {
        gameState.board[0][i] = { type: layout[i], color: 'b', moved: false, armor: 0, movedThisTurn: false, rank: 1 };
        gameState.board[1][i] = { type: 'p', color: 'b', moved: false, armor: 0, movedThisTurn: false, rank: 1 };
        gameState.board[6][i] = { type: 'p', color: 'w', moved: false, armor: 0, movedThisTurn: false, rank: 1 };
        gameState.board[7][i] = { type: layout[i], color: 'w', moved: false, armor: 0, movedThisTurn: false, rank: 1 };
    }
    gameState.actionsLeft = (gameState.playerColor === 'w') ? 1 : 0; 
    recalcBoard(); render();
}

export function handleData(d) {
    const oppColor = (gameState.playerColor === 'w' ? 'b' : 'w');
    if (d.type === 'move') {
        const targetPiece = gameState.board[d.to.r][d.to.c];
        const isCapture = targetPiece && (targetPiece.color === gameState.playerColor || BUILDINGS.includes(targetPiece.type));
        gameState.lastOpponentMove = { from: d.from, to: d.to, isCapture: isCapture };
        let movingPiece = gameState.board[d.from.r][d.from.c];
        if (!movingPiece) movingPiece = { type: 'p', color: oppColor }; 
        gameState.board[d.from.r][d.from.c] = null;
        movingPiece.moved = true;
        if (d.promoteTo) movingPiece.type = d.promoteTo;
        gameState.board[d.to.r][d.to.c] = movingPiece;
        if (d.win) endGame(false);
    } else if (d.type === 'attack_hit') {
        if (gameState.board[d.r][d.c]) gameState.board[d.r][d.c].hp = d.hp;
        gameState.lastOpponentMove = { from: d.from, to: {r:d.r, c:d.c}, isCapture: true }; 
    } else if (d.type === 'attack_armor') {
        if (gameState.board[d.r][d.c]) gameState.board[d.r][d.c].armor = d.armor;
        gameState.lastOpponentMove = { from: d.from, to: {r:d.r, c:d.c}, isCapture: true };
    } else if (d.type === 'attack_shoot') {
        const target = gameState.board[d.r][d.c];
        if(target) {
            if(target.armor > 0) target.armor = Math.max(0, target.armor - 1);
            else if(target.hp > 0) target.hp = Math.max(0, target.hp - 1);
            else gameState.board[d.r][d.c] = null; 
        }
        if (d.from) {
            playMagicShot(d.from.r, d.from.c, d.r, d.c);
        } else {
            playSlashAnimation();
        }
        gameState.lastOpponentMove = { from: d.from, to: {r:d.r, c:d.c}, isCapture: true };
    } else if (d.type === 'transform') {
        if (d.from && gameState.board[d.from.r][d.from.c]) {
             gameState.board[d.from.r][d.from.c] = null;
        }
        const isElite = d.newType.endsWith('_2'); 
        let newObj = { type: d.newType, color: oppColor, moved: true, armor: 0, rank: isElite ? 2 : 1 };
        if (d.newType === 'ram') newObj.armor = 1;
        gameState.board[d.to.r][d.to.c] = newObj;
    } else if (d.type === 'production') {
        showToast("ПРОТИВНИК ПРОИЗВЕЛ РЕСУРСЫ");
    } else if (d.type === 'build') {
        let obj = { type: d.buildType, color: oppColor };
        if (d.buildType === 'fortress') obj.hp = FORTRESS_HP['fortress'];
        if (d.buildType === 'fortress_t2') { obj.hp = FORTRESS_HP['fortress_t2']; }
        if (d.buildType === 'fortress_t3') { obj.hp = FORTRESS_HP['fortress_t3']; }
        if (d.buildType === 'barricade') obj.hp = FORTRESS_HP['barricade'];
        if (d.buildType === 'hq_t2') obj.armor = 1;
        if (d.buildType === 'hq_t3') obj.armor = 2;
        if (d.buildType === 'hq_t4') obj.armor = 3;
        if (d.buildType === 'ram') obj.armor = 1;
        if (d.buildType === 'torpedo') obj.armor = 10;
        
        gameState.board[d.r][d.c] = obj;
        gameState.lastOpponentMove = { type: 'build', r: d.r, c: d.c };
    } else if (d.type === 'upgrade') {
        if(gameState.board[d.r][d.c]) {
            gameState.board[d.r][d.c].type = d.newType;
            if (d.newType.startsWith('fortress')) gameState.board[d.r][d.c].hp = FORTRESS_HP[d.newType];
            if (d.newType === 'hq_t2') gameState.board[d.r][d.c].armor = 1;
            if (d.newType === 'hq_t3') gameState.board[d.r][d.c].armor = 2;
            if (d.newType === 'hq_t4') gameState.board[d.r][d.c].armor = 3;
        }
        gameState.lastOpponentMove = { type: 'build', r: d.r, c: d.c };
    } else if (d.type === 'demolish') {
        gameState.board[d.r][d.c] = null;
    } else if (d.type === 'apogee_trigger') {
        playSlashAnimation();
        setTimeout(() => triggerExpansion(), 700);
    } else if (d.type === 'pass') {
        showToast("ПРОТИВНИК ПРОПУСТИЛ ХОД");
    }
    
    if (d.isLast) {
         turnEndLogic();
         showTurnBanner(true);
    } else if (d.type !== 'build' && d.type !== 'upgrade' && d.type !== 'demolish') {
         render();
    }
    render(); updateUI();
}

export function passTurn() {
    if (!gameState.isAdminMode && gameState.playerColor !== gameState.myColor) return;
    
    gameState.actionsLeft = 0;
    sendNetworkMessage({ type: 'pass', isLast: true });
    applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
    showTurnBanner(false);
    updateUI(); render();
}

export function turnEndLogic() {
    let baseAP = 1; 
    const hqT1 = hasSpecial(gameState.playerColor, 'hq');
    const hqT2 = hasSpecial(gameState.playerColor, 'hq_t2');
    const hqT3 = hasSpecial(gameState.playerColor, 'hq_t3');
    const hqT4 = hasSpecial(gameState.playerColor, 'hq_t4');

    if (hqT1) baseAP = 2; 
    if (hqT2) baseAP = 3; 
    if (hqT3) baseAP = 4; 
    if (hqT4) baseAP = 5; 

    gameState.actionsLeft = baseAP; 
    gameState.board.flat().forEach(p => { 
        if (p) {
            p.freeMoveUsed = false; 
            p.movedThisTurn = false;
        }
    });

    collectResources();
    applyRegeneration(gameState.playerColor);
}

function applyRegeneration(targetColor) {
    const enemyRams = [];
    const enemyColor = (targetColor === 'w' ? 'b' : 'w');

    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            const p = gameState.board[r][c];
            if (p && p.type === 'ram' && p.color === enemyColor) {
                enemyRams.push({r, c});
            }
        }
    }
    
    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            const p = gameState.board[r][c];
            if (p && p.color === targetColor) {
                let canRegen = true;
                for (let ram of enemyRams) {
                    const dr = Math.abs(r - ram.r);
                    const dc = Math.abs(c - ram.c);
                    if (dr <= 1 && dc <= 1) { 
                        canRegen = false; 
                        break; 
                    }
                }
                
                if (canRegen) {
                    if (p.type === 'fortress_t2' && p.hp < 4) p.hp++;
                    if (p.type === 'fortress_t3' && p.hp < 8) p.hp = Math.min(8, p.hp + 2);
                    if (p.type === 'hq_t2' && p.armor < 1) p.armor++;
                    if (p.type === 'hq_t3' && p.armor < 2) p.armor++;
                    if (p.type === 'hq_t4' && p.armor < 3) p.armor++;
                }
            }
        }
    }
}

export function getMaxResourceLimit() {
    const warehouses = getBuildingCount('warehouse');
    return 5 + (warehouses * 5); 
}

export function collectResources() {
    const maxLimit = getMaxResourceLimit();
    let produced = { w:0, s:0, m:0, c:0, p:0, f:0, g:0, cl:0, poly:0, ura:0, ch:0 };
    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            const p = gameState.board[r][c];
            if (p && p.color === gameState.playerColor) {
                if (p.type === 'lumber') { produced.w += 1; }
                if (p.type === 'lumber_t2') { produced.w += 2; produced.c += 1; }
                if (p.type === 'lumber_t3') { produced.w += 3; produced.c += 2; produced.poly += 1; }
                if (p.type === 'lumber_t4') { produced.w += 4; produced.c += 3; produced.poly += 2; produced.ch += 1; }
                if (p.type === 'mine') { produced.s += 1; }
                if (p.type === 'mine_t2') { produced.s += 2; produced.m += 1; }
                if (p.type === 'mine_t3') { produced.s += 3; produced.m += 2; produced.g += 1; }
                if (p.type === 'mine_t4') { produced.s += 4; produced.m += 3; produced.g += 2; produced.ura += 1; }
                if (p.type === 'farm') { produced.f += 1; }
            }
        }
    }
    const apply = (key, val) => {
        gameState.myResources[key] = Math.min(maxLimit, (gameState.myResources[key] || 0) + val);
    };
    apply('wood', produced.w);
    apply('stone', produced.s);
    apply('metal', produced.m);
    apply('cedar', produced.c);
    apply('food', produced.f);
    apply('gem', produced.g);
    apply('polymer', produced.poly);
    apply('uranium', produced.ura);
    apply('chemical', produced.ch);
}

export function buildSomething(r, c, type) {
    let apCost = 2;
    if (type === 'lumber' || type === 'mine' || type === 'demolish' || type === 'hq' || type === 'barricade') apCost = 1;

    if (gameState.isAdminMode) apCost = 0; 
    if (!gameState.isAdminMode && gameState.actionsLeft < apCost) { showToast(`НУЖНО ${apCost} ОД.`); return; }

    if (type === 'demolish') {
        const target = gameState.board[r][c];
        if (!target || target.color !== gameState.playerColor) { showToast("НЕЛЬЗЯ СНОСИТЬ."); return; }
        const isBuilding = BUILDINGS.includes(target.type);
        if (!isBuilding) return showToast("НЕЛЬЗЯ СНОСИТЬ ЮНИТОВ!");
        
        gameState.board[r][c] = null;
        if(!gameState.isAdminMode) gameState.actionsLeft -= apCost;
        
        const isLast = (gameState.actionsLeft<=0 && !gameState.isAdminMode);
        sendNetworkMessage({ type: 'demolish', r, c, isLast: isLast });
        if(isLast) {
            applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
            showTurnBanner(false);
        }
        updateUI(); render();
        return;
    }

    const costs = BUILDING_COSTS[type];
    const isUpgrade = type.endsWith('_t2') || type.endsWith('_t3') || type.endsWith('_t4');

    if (isUpgrade) {
        let requiredType = '';
        let baseType = '';
        if (type === 'hq_t2') requiredType = 'hq';
        else if (type === 'hq_t3') requiredType = 'hq_t2';
        else if (type === 'hq_t4') requiredType = 'hq_t3';
        else if (type === 'fortress_t2') requiredType = 'fortress';
        else if (type === 'fortress_t3') requiredType = 'fortress_t2';
        else if (type === 'academy_t2') requiredType = 'academy';
        else if (type.endsWith('_t2')) { baseType = type.replace('_t2', ''); requiredType = baseType; } 
        else if (type.endsWith('_t3')) { baseType = type.replace('_t3', ''); requiredType = baseType + '_t2'; } 
        else if (type.endsWith('_t4')) { baseType = type.replace('_t4', ''); requiredType = baseType + '_t3'; }
        
        const target = gameState.board[r][c];
        if (!target || target.type !== requiredType || target.color !== gameState.playerColor) {
            showToast(`СТАВИТЬ ТОЛЬКО НА ${requiredType}!`); return;
        }

        if (!checkResources(costs)) return;
        payResources(costs);

        gameState.board[r][c].type = type;
        if (type.startsWith('fortress')) gameState.board[r][c].hp = FORTRESS_HP[type];
        if (type === 'hq_t2') gameState.board[r][c].armor = 1; 
        if (type === 'hq_t3') gameState.board[r][c].armor = 2;
        if (type === 'hq_t4') gameState.board[r][c].armor = 3;
        
        if(!gameState.isAdminMode) gameState.actionsLeft -= apCost;
        
        const isLast = (gameState.actionsLeft<=0 && !gameState.isAdminMode);
        sendNetworkMessage({ type: 'upgrade', r, c, newType: type, isLast: isLast });
        if(isLast) {
            applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
            showTurnBanner(false);
        }
        updateUI(); render();
        return;
    }

    if (gameState.board[r][c]) return; 
    let limitCheckType = type.split('_')[0]; 
    if (BUILDING_LIMITS[type] && getBuildingCount(limitCheckType) >= BUILDING_LIMITS[type] && !gameState.isAdminMode) {
        showToast(`ЛИМИТ ПОСТРОЕК (${type})!`);
        return;
    }

    if (!checkResources(costs)) return;
    payResources(costs);
    
    if(!gameState.isAdminMode) gameState.actionsLeft -= apCost;
    let newObj = { type: type, color: gameState.playerColor };
    if (type === 'fortress') newObj.hp = FORTRESS_HP['fortress'];
    if (type === 'barricade') newObj.hp = FORTRESS_HP['barricade'];
    gameState.board[r][c] = newObj;
    
    const isLast = (gameState.actionsLeft<=0 && !gameState.isAdminMode);
    sendNetworkMessage({ type: 'build', r, c, buildType: type, isLast: isLast });
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    updateUI(); render(); 
}

export function getBuildingCount(baseType) {
    let count = 0;
    gameState.board.flat().forEach(p => {
        if (p && p.color === gameState.playerColor) {
            const t = p.type;
            if (t === baseType || t.startsWith(baseType + '_')) count++;
        }
    });
    return count;
}

function checkResources(cost) {
    if (gameState.isAdminMode) return true; 
    const r = gameState.myResources;
    if ((r.wood||0) < cost.wood || (r.stone||0) < cost.stone || 
        (r.metal||0) < cost.metal || (r.cedar||0) < cost.cedar ||
        (r.paper||0) < cost.paper || (r.gem||0) < cost.gem || 
        (r.coal||0) < cost.coal || (r.polymer||0) < cost.polymer ||
        (r.uranium||0) < cost.uranium || (r.chemical||0) < cost.chemical ||
        (r.mana_gem||0) < cost.mana_gem) {
        showToast(`НЕ ХВАТАЕТ РЕСУРСОВ!`);
        return false;
    }
    return true;
}

function payResources(cost) {
    if (gameState.isAdminMode) return;
    const r = gameState.myResources;
    r.wood = (r.wood||0) - cost.wood;
    r.stone = (r.stone||0) - cost.stone;
    r.metal = (r.metal||0) - cost.metal;
    r.cedar = (r.cedar||0) - cost.cedar;
    r.paper = (r.paper||0) - cost.paper;
    r.gem = (r.gem||0) - cost.gem;
    r.coal = (r.coal||0) - cost.coal;
    r.polymer = (r.polymer||0) - cost.polymer;
    r.uranium = (r.uranium||0) - cost.uranium;
    r.chemical = (r.chemical||0) - cost.chemical;
    r.mana_gem = (r.mana_gem||0) - cost.mana_gem;
}

export function activateApogee() {
    if (gameState.isExpanded) return;
    playSlashAnimation();
    sendNetworkMessage({ type: 'apogee_trigger' });
    setTimeout(() => triggerExpansion(), 700);
}

function triggerExpansion() {
    if (gameState.isExpanded) return;
    const newState = Array(16).fill(null).map(() => Array(8).fill(null));
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const p = gameState.board[r][c];
            if (p) {
                const isBuilding = BUILDINGS.includes(p.type);
                if (r < 4) {
                    if (p.color === 'w' && !isBuilding) {
                        p.glitched = true; 
                        newState[r + 8][c] = p; 
                    } else {
                        newState[r][c] = p; 
                    }
                } else {
                    if (p.color === 'b' && !isBuilding) {
                        p.glitched = true; 
                        newState[r][c] = p; 
                    } else {
                        newState[r + 8][c] = p; 
                    }
                }
            }
        }
    }
    gameState.board = newState; 
    gameState.rows = 16; 
    gameState.cols = 8;
    gameState.isExpanded = true;
    recalcBoard(); render(); updateUI();

    const boardEl = document.getElementById('board');
    boardEl.classList.add('animating-board');
    const fogSquares = Array.from(boardEl.querySelectorAll('.fog'));
    fogSquares.forEach(sq => { sq.classList.add('collapsed'); sq.classList.add('fog-waiting'); });
    void boardEl.offsetWidth; 
    setTimeout(() => { fogSquares.forEach(sq => { sq.classList.remove('collapsed'); }); }, 100);
    setTimeout(() => {
        const renderRows = gameState.playerColor === 'b' ? [...Array(16).keys()].reverse() : [...Array(16).keys()];
        const allSquares = Array.from(boardEl.children);
        let domIndex = 0;
        const centerR = 7.5; const centerC = 3.5;
        renderRows.forEach(r => {
            for(let c=0; c<8; c++) {
                const sq = allSquares[domIndex];
                if (sq.classList.contains('fog')) {
                    const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
                    sq.style.animationDelay = `${dist * 0.08}s`;
                    sq.classList.add('fog-anim'); 
                    sq.classList.remove('fog-waiting');
                }
                domIndex++;
            }
        });
    }, 1600);
    setTimeout(() => { 
        gameState.expansionAnimationDone = true; 
        boardEl.classList.remove('animating-board');
    }, 2200);
}


export function recruitPawn() {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НУЖНО 1 ОД!"); return; }
    if (!gameState.isAdminMode && (gameState.myResources.food||0) < 2) { showToast("НУЖНО 2 ЕДЫ!"); return; }
    
    const { target } = gameState.pendingInteraction; 
    
    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const targetR = target.r + dir;
    const targetC = target.c;
    
    if (targetR < 0 || targetR >= gameState.rows || gameState.board[targetR][targetC]) {
        showToast("МЕСТО ВЫСАДКИ ЗАНЯТО!");
        return;
    }
    
    if(!gameState.isAdminMode) {
        gameState.myResources.food -= 2;
        gameState.actionsLeft--;
    }
    gameState.board[targetR][targetC] = { type: 'p', color: gameState.playerColor, moved: true, armor: 0, movedThisTurn: true, rank: 1 };
    
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ type: 'transform', from: {r: target.r, c: target.c}, to: {r: targetR, c: targetC}, newType: 'p', isLast: isLast });
    
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    
    closeModal('camp-modal');
    updateUI(); render();
}

export function finishWorkshopBuild(unitType) {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НУЖНО 1 ОД!"); return; }
    
    const cost = { wood: 4, cedar: 4, metal: 2, stone:0, paper:0, food:0, gem:0, coal:0, polymer:0, uranium:0, chemical:0, mana_gem:0 };
    if (!checkResources(cost)) return;

    const { from, target } = gameState.pendingInteraction; 
    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const spawnR = target.r + dir;
    const spawnC = target.c;

    if (spawnR < 0 || spawnR >= gameState.rows || gameState.board[spawnR][spawnC]) {
        showToast("ВЫХОД ЗАБЛОКИРОВАН!");
        closeModal('workshop-modal');
        return;
    }

    payResources(cost);
    if(!gameState.isAdminMode) gameState.actionsLeft--;
    
    gameState.board[from.r][from.c] = null;
    gameState.board[spawnR][spawnC] = { type: 'ram', color: gameState.playerColor, moved: true, armor: 1, movedThisTurn: true, rank: 1 };
    
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ type: 'transform', from: from, to: {r: spawnR, c: spawnC}, newType: 'ram', isLast: isLast });
    
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    closeModal('workshop-modal');
    updateUI(); render();
}

export function finishTorpedoBuild() {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НУЖНО 1 ОД!"); return; }

    const cost = { metal: 10, uranium: 5, wood: 0, stone:0, paper:0, food:0, gem:0, coal:0, polymer:0, chemical:0, mana_gem:0, cedar: 0 };
    if (!checkResources(cost)) return;

    const { from, target } = gameState.pendingInteraction; 
    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const spawnR = target.r + dir;
    const spawnC = target.c;

    if (spawnR < 0 || spawnR >= gameState.rows || gameState.board[spawnR][spawnC]) {
        showToast("ВЫХОД ЗАБЛОКИРОВАН!");
        closeModal('torpedo-modal');
        return;
    }

    payResources(cost);
    if(!gameState.isAdminMode) gameState.actionsLeft--;
    
    // ВАЖНО: ИНИЦИАТОР (Пешка или Король) НЕ УДАЛЯЕТСЯ
    
    // Создаем торпеду на выходе
    gameState.board[spawnR][spawnC] = { type: 'torpedo', color: gameState.playerColor, moved: true, armor: 10, movedThisTurn: true, rank: 1 };
    
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    // Используем 'build', чтобы просто заспавнить объект
    sendNetworkMessage({ type: 'build', r: spawnR, c: spawnC, buildType: 'torpedo', isLast: isLast });
    
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    closeModal('torpedo-modal');
    updateUI(); render();
}

export function finishAcademyRecruit(newType, paperCost) {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НЕТ ОД ДЛЯ ОБУЧЕНИЯ!"); return; }
    if (!gameState.isAdminMode && (gameState.myResources.paper||0) < paperCost) { showToast(`НЕ ХВАТАЕТ БУМАГИ (НУЖНО ${paperCost})!`); return; }
    
    const { from, target } = gameState.pendingInteraction; 
    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const spawnR = target.r + dir;
    const spawnC = target.c;

    if (spawnR < 0 || spawnR >= gameState.rows || gameState.board[spawnR][spawnC]) {
        showToast("ВЫХОД ИЗ АКАДЕМИИ ЗАБЛОКИРОВАН!");
        closeModal('academy-modal');
        return; 
    }

    if(!gameState.isAdminMode) gameState.myResources.paper -= paperCost;
    gameState.board[from.r][from.c] = null;

    const isElite = newType.endsWith('_2');
    gameState.board[spawnR][spawnC] = { 
        type: newType, 
        color: gameState.playerColor, 
        moved: true, 
        freeMoveUsed: false, 
        armor: 0, 
        movedThisTurn: true,
        rank: isElite ? 2 : 1
    };

    if(!gameState.isAdminMode) gameState.actionsLeft--; 
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ type: 'transform', from: from, to: {r:spawnR, c:spawnC}, newType: newType, isLast: isLast });
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    closeModal('academy-modal');
    updateUI(); render();
}

export function processProduction() {
    const type = gameState.pendingInteraction.type;
    const maxLimit = getMaxResourceLimit();
    let success = false;

    if (gameState.isAdminMode) {
        if (type === 'jeweler') gameState.myResources.mana_gem = (gameState.myResources.mana_gem || 0) + 1;
        else if (type === 'papermill') gameState.myResources.paper = (gameState.myResources.paper || 0) + 1;
        success = true;
    } else {
        if (type === 'jeweler') {
             if ((gameState.myResources.gem || 0) >= 2 && (gameState.myResources.mana_gem || 0) < maxLimit) {
                 gameState.myResources.gem -= 2;
                 gameState.myResources.mana_gem = (gameState.myResources.mana_gem || 0) + 1;
                 success = true;
             } else { showToast("Не хватает 2 алмазов или лимит самоцветов!"); }
        }
        else if (type === 'papermill') {
            if ((gameState.myResources.cedar || 0) >= 1 && (gameState.myResources.paper || 0) < maxLimit) {
                gameState.myResources.cedar -= 1;
                gameState.myResources.paper = (gameState.myResources.paper || 0) + 1;
                success = true;
            } else { showToast("Не хватает кедра или лимит бумаги!"); }
        }
    }

    if(success) {
        updateUI(); 
        render();
        openProductionModal(type); 
        showToast("ПРОИЗВЕДЕНО!");
    }
}

export function activateMageTowerMode() {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НУЖНО 1 ОД!"); return; }
    if (!gameState.isAdminMode && (gameState.myResources.mana_gem || 0) < 1) { showToast("НУЖЕН 1 САМОЦВЕТ!"); return; }

    const { target } = gameState.pendingInteraction; 
    let foundTarget = false;
    const tR = target.r;
    const tC = target.c;

    for(let r = tR - 2; r <= tR + 2; r++) {
        for(let c = tC - 2; c <= tC + 2; c++) {
            if(r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                const p = gameState.board[r][c];
                if (p && p.color !== gameState.playerColor) {
                    foundTarget = true;
                    break;
                }
            }
        }
        if(foundTarget) break;
    }

    if (!foundTarget) {
        showToast("НЕТ ЦЕЛЕЙ В РАДИУСЕ ПОРАЖЕНИЯ!");
        return; 
    }
    
    gameState.isTargetingMode = true;
    gameState.targetingSource = {r: target.r, c: target.c}; 
    
    closeModal('magetower-modal');
    showToast("ВЫБЕРИТЕ ЦЕЛЬ (РАДИУС 2)");
    updateUI(); render();
}

export function shootMageTower(targetR, targetC) {
    if (!gameState.isAdminMode && gameState.actionsLeft < 1) { showToast("НЕДОСТАТОЧНО ОД!"); return; }
    if (!gameState.isAdminMode && (gameState.myResources.mana_gem || 0) < 1) { showToast("НЕТ САМОЦВЕТА!"); return; }

    const tower = gameState.targetingSource;
    const dist = Math.max(Math.abs(tower.r - targetR), Math.abs(tower.c - targetC));
    if (dist > 2) { showToast("СЛИШКОМ ДАЛЕКО!"); return; }

    const targetUnit = gameState.board[targetR][targetC];
    if (!targetUnit || targetUnit.color === gameState.playerColor) {
        showToast("НЕВЕРНАЯ ЦЕЛЬ!");
        return;
    }

    if(!gameState.isAdminMode) {
        gameState.myResources.mana_gem -= 1;
        gameState.actionsLeft--;
    }

    if(targetUnit.armor > 0) targetUnit.armor = Math.max(0, targetUnit.armor - 1);
    else if(targetUnit.hp > 0) targetUnit.hp = Math.max(0, targetUnit.hp - 1);
    else gameState.board[targetR][targetC] = null; 

    playMagicShot(tower.r, tower.c, targetR, targetC);
    
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ 
        type: 'attack_shoot', 
        r: targetR, 
        c: targetC, 
        from: {r:tower.r, c:tower.c}, 
        isLast: isLast 
    });
    
    gameState.isTargetingMode = false;
    gameState.targetingSource = null;
    gameState.pendingInteraction = null;
    
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    updateUI(); render();
}

export function finishPromotion(newType) {
    document.getElementById('promotion-modal').classList.add('hidden');
    const { fr, fc, tr, tc } = gameState.pendingMove;
    gameState.board[tr][tc] = gameState.board[fr][fc]; 
    gameState.board[tr][tc].type = newType; 
    gameState.board[fr][fc] = null;
    if(!gameState.isAdminMode) gameState.actionsLeft--;
    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ type: 'move', from: {r:fr, c:fc}, to: {r:tr, c:tc}, isLast: isLast, win: false, promoteTo: newType });
    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    gameState.pendingMove = null; updateUI(); render();
}

export function isValidMove(fr, fc, tr, tc) {
    if (gameState.actionsLeft <= 0 && !gameState.isAdminMode) return false;

    if (tr < 0 || tr >= gameState.rows || tc < 0 || tc >= gameState.cols) return false;
    const p = gameState.board[fr][fc]; 
    if (!p) return false;
    const dest = gameState.board[tr][tc];

    const baseType = p.type.replace('_2', '');
    const isKnight = baseType === 'n';

    if (gameState.isExpanded) {
        const startBase = (fr < 4) ? 1 : (fr > 11 ? 2 : 0);
        const endBase = (tr < 4) ? 1 : (tr > 11 ? 2 : 0);
        if (startBase !== 0 && endBase !== 0 && startBase !== endBase) return false;
        if (!isKnight) {
            if (startBase === 1 && endBase === 0 && tr !== 4) return false;
            if (startBase === 2 && endBase === 0 && tr !== 11) return false;
            if (startBase === 0 && endBase === 1 && tr !== 3) return false;
            if (startBase === 0 && endBase === 2 && tr !== 12) return false;
        }
    }

    // ВХОД В ЗДАНИЯ (АКТИВАЦИЯ)
    if (dest && dest.color === p.color) {
        if (p.type === 'p' || p.type === 'k') { 
            const interactive = ['academy', 'academy_t2', 'workshop', 'jeweler', 'papermill', 'camp', 'magetower', 'torpedo_tower'];
            if (interactive.includes(dest.type)) {
                // ПРОВЕРКА ЗОН (АКТИВАЦИЯ ТОЛЬКО В СВОЕЙ ЗОНЕ)
                if (gameState.isExpanded) {
                    const getZone = (r) => {
                        if (r < 4) return 1; // База
                        if (r > 11) return 3; // Вражеская база
                        return 2; // Туман
                    };
                    const z1 = getZone(fr);
                    const z2 = getZone(tr);
                    // Если зоны разные - активация невозможна (дистанционная)
                    if (z1 !== z2) return false;
                }
                return true;
            }
        }
        return false; 
    }
    if (dest && isUpgradedUnit(dest) && p.type === 'p') return false;
    
    const dr = tr - fr, dc = tc - fc; 
    const adr = Math.abs(dr), adc = Math.abs(dc);

    if (p.type === 'ram') {
         if (adr <= 1 && adc <= 1) return true;
         return false;
    }
    
    if (p.type === 'torpedo') {
        const dir = p.color === 'w' ? -1 : 1;
        if (dc === 0 && dr === dir) return true;
        return false;
    }

    switch(baseType) {
        case 'p':
            const dir = p.color === 'w' ? -1 : 1;
            // Активация уже проверена выше, здесь стандартное движение
            if (dc === 0 && !dest && dr === dir) return true;
            if (dc === 0 && !dest && !p.moved && dr === 2 * dir) {
                if (!gameState.board[fr + dir][fc]) return true;
            }
            if (adc === 1 && dr === dir && dest && dest.color !== p.color) return true;
            return false;
        case 'n': return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        case 'b': if (adr !== adc) return false; return isPathClear(fr, fc, tr, tc);
        case 'r': if (dr !== 0 && dc !== 0) return false; return isPathClear(fr, fc, tr, tc);
        case 'q': if (!(adr === adc || dr === 0 || dc === 0)) return false; return isPathClear(fr, fc, tr, tc);
        case 'k': 
             return (adr <= 1 && adc <= 1); 
    }
    return false;
}

function isPathClear(fr, fc, tr, tc) {
    const stepR = Math.sign(tr - fr), stepC = Math.sign(tc - fc);
    let curR = fr + stepR, curC = fc + stepC;
    while (curR !== tr || curC !== tc) { 
        if (gameState.board[curR][curC]) return false; 
        curR += stepR; curC += stepC; 
    }
    return true;
}

export function movePiece(fr, fc, tr, tc) {
    const piece = gameState.board[fr][fc];
    const dest = gameState.board[tr][tc];

    // ВХОД В ЗДАНИЯ
    if (dest && dest.color === piece.color && (piece.type === 'p' || piece.type === 'k')) {
        if (dest.type === 'camp') {
            openCampModal(fr, fc, tr, tc); 
            return;
        }
        if (dest.type === 'academy' || dest.type === 'academy_t2') {
            openAcademyModal(fr, fc, tr, tc, dest.type === 'academy_t2');
            return; 
        }
        if (dest.type === 'workshop') {
            openWorkshopModal(fr, fc, tr, tc);
            return;
        }
        if (dest.type === 'jeweler' || dest.type === 'papermill') {
            gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc}, type: dest.type };
            openProductionModal(dest.type);
            return;
        }
        if (dest.type === 'magetower') {
            openMageTowerModal(fr, fc, tr, tc);
            return;
        }
        if (dest.type === 'torpedo_tower') {
            openTorpedoModal(fr, fc, tr, tc);
            return;
        }
    }

    if (dest && dest.color !== piece.color) {
        let dmg = 1; 
        if (piece.type === 'ram') dmg = 2;
        if (piece.type === 'torpedo') dmg = 10;
        
        if (dest.armor !== undefined && dest.armor > 0) {
            dest.armor = Math.max(0, dest.armor - dmg);
            
            piece.movedThisTurn = true;
            if(!gameState.isAdminMode) gameState.actionsLeft--;
            const isLast = (gameState.actionsLeft<=0 && !gameState.isAdminMode);
            sendNetworkMessage({ type: 'attack_armor', from: {r:fr, c:fc}, r: tr, c: tc, armor: dest.armor, isLast: isLast });
            if(isLast) {
                applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
                showTurnBanner(false);
            }
            gameState.selectedPiece = null;
            updateUI(); render();
            return; 
        }

        if (dest.hp !== undefined && dest.hp > 0) {
            dest.hp = Math.max(0, dest.hp - dmg);
            if (piece.type !== 'p' || piece.rank !== 2) piece.movedThisTurn = true; 
            if(!gameState.isAdminMode) gameState.actionsLeft--;
            const isLast = (gameState.actionsLeft<=0 && !gameState.isAdminMode);
            sendNetworkMessage({ type: 'attack_hit', from: {r:fr, c:fc}, r: tr, c: tc, hp: dest.hp, isLast: isLast });
            if(isLast) {
                applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
                showTurnBanner(false);
            }
            gameState.selectedPiece = null;
            updateUI(); render();
            return; 
        }
    }
    
    gameState.board[fr][fc] = null;
    let isWinMove = (dest && dest.type === 'k');
    if (isWinMove) endGame(true);

    let costsAP = true;
    if (isUpgradedUnit(piece)) {
        if (!piece.freeMoveUsed) { costsAP = false; piece.freeMoveUsed = true; }
    }

    gameState.board[tr][tc] = piece; 
    piece.moved = true; 
    piece.movedThisTurn = true; 

    if (costsAP && !gameState.isAdminMode) gameState.actionsLeft--;
    
    const endRow = gameState.playerColor === 'w' ? 0 : (gameState.rows - 1);
    if (piece.type === 'p' && tr === endRow && !isWinMove) {
        showPromotionModal(fr, fc, tr, tc); 
        return; 
    }

    const isLast = (gameState.actionsLeft <= 0 && !gameState.isAdminMode);
    sendNetworkMessage({ 
        type: 'move', from: {r:fr, c:fc}, to: {r:tr, c:tc}, 
        isLast: isLast, win: isWinMove, 
        freeMoveUsed: !costsAP 
    });

    if(isLast) {
        applyRegeneration(gameState.playerColor === 'w' ? 'b' : 'w');
        showTurnBanner(false);
    }
    gameState.selectedPiece = null; 
    updateUI(); render();
}

export function isNearOwnPiece(r, c, type) {
    if (gameState.isAdminMode) return true;

    if (gameState.board[r][c] && gameState.board[r][c].color === gameState.playerColor && (type.endsWith('_t2') || type.endsWith('_t3') || type.endsWith('_t4') || type === 'academy')) return true;
    if (gameState.board[r][c]) return false; 
    
    for(let dr = -1; dr <= 1; dr++) {
        for(let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                const neighbor = gameState.board[nr][nc];
                if (neighbor && neighbor.color === gameState.playerColor) {
                    const neighborIsBuilding = BUILDINGS.includes(neighbor.type);
                    if (type.startsWith('fortress') || type === 'barricade') {
                         return true; 
                    } 
                    else {
                        if (!neighborIsBuilding) {
                             return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

export function onPiecePointerDown(e, fr, fc) {
    if (gameState.gameOver || !gameState.currentRoom || (!gameState.isAdminMode && gameState.actionsLeft <= 0)) return;
    
    const p = gameState.board[fr][fc];
    if (!p || p.color !== gameState.playerColor) {
        if (gameState.isTargetingMode) {
             const tower = gameState.targetingSource;
             const dist = Math.max(Math.abs(tower.r - fr), Math.abs(tower.c - fc));
             if (dist <= 2) {
                 shootMageTower(fr, fc);
             } else {
                 showToast("ЦЕЛЬ СЛИШКОМ ДАЛЕКО");
                 gameState.isTargetingMode = false;
                 gameState.targetingSource = null;
                 render();
             }
        }
        return;
    }

    if (BUILDINGS.includes(p.type)) {
        return; 
    }

    if (p.movedThisTurn && !gameState.isAdminMode) { showToast("ЭТА ФИГУРА УЖЕ ХОДИЛА!"); return; }

    gameState.selectedPiece = {r: fr, c: fc}; 
    dragState.isBuildingDrag = false;
    dragState.from = { r: fr, c: fc };
    const baseType = p.type.replace('_2', '');
    
    let bg;
    if (p.type === 'ram') bg = `url(${PIECE_URLS[p.color+'ram']})`;
    else if (p.type === 'torpedo') bg = `url(${PIECE_URLS[p.color+'torpedo']})`;
    else bg = `url(${PIECE_URLS[p.color + baseType]})`;
    
    initDrag(e, bg);
    
    render(); 
}
export function onSidebarPointerDown(e, type) {
    if (gameState.gameOver || !gameState.currentRoom || (!gameState.isAdminMode && gameState.actionsLeft <= 0) || !gameState.isBuildMode) return;
    dragState.isBuildingDrag = true;
    dragState.from = { type: type };
    let icon = BUILDING_ICONS[type];
    if (!icon) {
        const base = type.replace('_t2','').replace('_t3','').replace('_t4','');
        icon = BUILDING_ICONS[base];
    }
    initDrag(e, null, icon);
}