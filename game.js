import { gameState } from './state.js';
import { BUILDING_COSTS, BUILDING_LIMITS, FORTRESS_HP, BUILDINGS, PIECE_URLS, BUILDING_ICONS } from './constants.js';
import { sendNetworkMessage } from './network.js';
import { updateUI, render, recalcBoard, showToast, hasSpecial, isFog, isUpgradedUnit, openAcademyModal, closeModal, showPromotionModal, endGame, initDrag, dragState, showTurnBanner, playSlashAnimation } from './ui.js';

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
    // ОД обновятся при начале хода
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
        gameState.lastOpponentMove = { from: d.from || {r:d.r, c:d.c}, to: {r:d.r, c:d.c}, isCapture: true }; 
    } else if (d.type === 'attack_armor') {
        if (gameState.board[d.r][d.c]) gameState.board[d.r][d.c].armor = d.armor;
        gameState.lastOpponentMove = { from: d.from || {r:d.r, c:d.c}, to: {r:d.r, c:d.c}, isCapture: true };
    } else if (d.type === 'transform') {
        if (gameState.board[d.from.r][d.from.c] && gameState.board[d.from.r][d.from.c].type === 'p') gameState.board[d.from.r][d.from.c] = null;
        const isElite = d.newType.endsWith('_2');
        gameState.board[d.to.r][d.to.c] = { type: d.newType, color: oppColor, moved: true, armor: 0, rank: isElite ? 2 : 1 };
    } else if (d.type === 'build') {
        let obj = { type: d.buildType, color: oppColor };
        // Присваиваем HP или Armor (для HQ)
        if (d.buildType === 'fortress') obj.hp = FORTRESS_HP['fortress'];
        if (d.buildType === 'barricade') obj.hp = FORTRESS_HP['barricade'];
        if (d.buildType === 'hq_t2') obj.armor = 1;
        if (d.buildType === 'hq_t3') obj.armor = 2;
        if (d.buildType === 'hq_t4') obj.armor = 3;
        
        gameState.board[d.r][d.c] = obj;
        gameState.lastOpponentMove = { type: 'build', r: d.r, c: d.c };
    } else if (d.type === 'upgrade') {
        if(gameState.board[d.r][d.c]) {
            gameState.board[d.r][d.c].type = d.newType;
            if (d.newType.startsWith('fortress')) gameState.board[d.r][d.c].hp = FORTRESS_HP[d.newType];
            // Броня для HQ
            if (d.newType === 'hq_t2') gameState.board[d.r][d.c].armor = 1;
            if (d.newType === 'hq_t3') gameState.board[d.r][d.c].armor = 2;
            if (d.newType === 'hq_t4') gameState.board[d.r][d.c].armor = 3;
        }
        gameState.lastOpponentMove = { type: 'build', r: d.r, c: d.c };
    } else if (d.type === 'demolish') {
        gameState.board[d.r][d.c] = null;
    } else if (d.type === 'apogee_trigger') {
        playSlashAnimation();
        // Задержка перед расширением, чтобы проигралась анимация разреза
        setTimeout(() => triggerExpansion(), 700);
    }
    
    if (d.isLast) {
         turnEndLogic();
         showTurnBanner(true);
    } else if (d.type !== 'build' && d.type !== 'upgrade' && d.type !== 'demolish') {
         render();
    }
    render(); updateUI();
}

export function turnEndLogic() {
    // ЛОГИКА ОД (AP) НА ОСНОВЕ TIER-ов КЦ
    let baseAP = 1; 
    const hqT1 = hasSpecial(gameState.playerColor, 'hq');
    const hqT2 = hasSpecial(gameState.playerColor, 'hq_t2');
    const hqT3 = hasSpecial(gameState.playerColor, 'hq_t3');
    const hqT4 = hasSpecial(gameState.playerColor, 'hq_t4');

    if (hqT1) baseAP = 2; // T1 (Base + 1)
    if (hqT2) baseAP = 3; // T2 (+2)
    if (hqT3) baseAP = 4; // T3 (+3)
    if (hqT4) baseAP = 5; // T4 (+4)

    gameState.actionsLeft = baseAP; 
    
    gameState.board.flat().forEach(p => { 
        if (p) {
            p.freeMoveUsed = false; 
            p.movedThisTurn = false;
        }
    });
    collectResources();
}

export function getMaxResourceLimit() {
    const warehouses = getBuildingCount('warehouse');
    return 5 + (warehouses * 5); 
}

export function collectResources() {
    const maxLimit = getMaxResourceLimit();
    let produced = { w:0, s:0, m:0, c:0, p:0, f:0, g:0, cl:0, poly:0, ura:0, ch:0 };
    
    // Сбор от добытчиков
    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            const p = gameState.board[r][c];
            if (p && p.color === gameState.playerColor) {
                // ЛЕСОПИЛКИ
                if (p.type === 'lumber') { produced.w += 1; }
                if (p.type === 'lumber_t2') { produced.w += 2; produced.c += 1; }
                if (p.type === 'lumber_t3') { produced.w += 3; produced.c += 2; produced.poly += 1; }
                if (p.type === 'lumber_t4') { produced.w += 4; produced.c += 3; produced.poly += 2; produced.ch += 1; }
                
                // ШАХТЫ
                if (p.type === 'mine') { produced.s += 1; }
                if (p.type === 'mine_t2') { produced.s += 2; produced.m += 1; }
                if (p.type === 'mine_t3') { produced.s += 3; produced.m += 2; produced.g += 1; }
                if (p.type === 'mine_t4') { produced.s += 4; produced.m += 3; produced.g += 2; produced.ura += 1; }
                
                // ФЕРМА
                if (p.type === 'farm') { produced.f += 1; }
            }
        }
    }

    // Применение добычи (срезаем по лимиту)
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

    // КОНВЕРТЕРЫ (Строгая проверка лимитов: не сжигать, если некуда класть)
    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            const p = gameState.board[r][c];
            if (p && p.color === gameState.playerColor) {
                // ПЛАВИЛЬНЯ: 1 Кедр -> 1 Уголь
                if (p.type === 'furnace') {
                    if ((gameState.myResources.cedar || 0) >= 1 && (gameState.myResources.coal || 0) < maxLimit) {
                        gameState.myResources.cedar--;
                        gameState.myResources.coal = (gameState.myResources.coal || 0) + 1;
                    }
                }
                // БУМАЖНАЯ ФАБРИКА T1: 1 Дерево -> 1 Бумага
                if (p.type === 'papermill') {
                    if ((gameState.myResources.wood || 0) >= 1 && (gameState.myResources.paper || 0) < maxLimit) {
                        gameState.myResources.wood--;
                        gameState.myResources.paper = (gameState.myResources.paper || 0) + 1;
                    }
                }
                // БУМАЖНАЯ ФАБРИКА T2: 2 Дерева -> 2 Бумаги
                if (p.type === 'papermill_t2') {
                    if ((gameState.myResources.wood || 0) >= 2 && (gameState.myResources.paper || 0) <= maxLimit - 2) {
                        gameState.myResources.wood -= 2;
                        gameState.myResources.paper = (gameState.myResources.paper || 0) + 2;
                    }
                }
            }
        }
    }
}

export function buildSomething(r, c, type) {
    let apCost = 2;
    // Удешевленные здания
    if (type === 'lumber' || type === 'mine' || type === 'demolish' || type === 'hq' || type === 'barricade') apCost = 1;

    if (type === 'demolish') {
        const target = gameState.board[r][c];
        if (!target || target.color !== gameState.playerColor) { showToast("НЕЛЬЗЯ СНОСИТЬ."); return; }
        const isBuilding = BUILDINGS.includes(target.type);
        if (!isBuilding) return showToast("НЕЛЬЗЯ СНОСИТЬ ЮНИТОВ!");
        if (gameState.actionsLeft < apCost) { showToast(`НУЖНО ${apCost} ОД.`); return; }
        
        gameState.board[r][c] = null;
        gameState.actionsLeft -= apCost;
        sendNetworkMessage({ type: 'demolish', r, c, isLast: (gameState.actionsLeft<=0) });
        if(gameState.actionsLeft <= 0) showTurnBanner(false);
        updateUI(); render();
        return;
    }

    const costs = BUILDING_COSTS[type];
    const isUpgrade = type.endsWith('_t2') || type.endsWith('_t3') || type.endsWith('_t4');

    if (isUpgrade) {
        let requiredType = '';
        let baseType = '';
        
        // Логика HQ апгрейдов
        if (type === 'hq_t2') requiredType = 'hq';
        else if (type === 'hq_t3') requiredType = 'hq_t2';
        else if (type === 'hq_t4') requiredType = 'hq_t3';
        // Логика остальных
        else if (type === 'academy_t2') requiredType = 'academy';
        else if (type === 'papermill_t2') requiredType = 'papermill';
        else if (type.endsWith('_t2')) {
            baseType = type.replace('_t2', '');
            requiredType = baseType; 
        } else if (type.endsWith('_t3')) {
            baseType = type.replace('_t3', '');
            requiredType = baseType + '_t2'; 
        } else if (type.endsWith('_t4')) {
            baseType = type.replace('_t4', '');
            requiredType = baseType + '_t3';
        }
        
        const target = gameState.board[r][c];
        if (!target || target.type !== requiredType || target.color !== gameState.playerColor) {
            showToast(`СТАВИТЬ ТОЛЬКО НА ${requiredType}!`);
            return;
        }
        if (gameState.actionsLeft < apCost) return showToast(`НУЖНО ${apCost} ОД.`);
        if (!checkResources(costs)) return;
        
        payResources(costs);
        gameState.board[r][c].type = type;
        if (type.startsWith('fortress')) gameState.board[r][c].hp = FORTRESS_HP[type];
        // Установка брони для HQ
        if (type === 'hq_t2') gameState.board[r][c].armor = 1; 
        if (type === 'hq_t3') gameState.board[r][c].armor = 2;
        if (type === 'hq_t4') gameState.board[r][c].armor = 3;
        
        gameState.actionsLeft -= apCost;
        sendNetworkMessage({ type: 'upgrade', r, c, newType: type, isLast: (gameState.actionsLeft<=0) });
        if(gameState.actionsLeft <= 0) showTurnBanner(false);
        updateUI(); render();
        return;
    }

    if (gameState.board[r][c]) return; 
    if (gameState.actionsLeft < apCost) return showToast(`НУЖНО ${apCost} ОД.`);
    
    // Проверка лимитов на количество зданий (базовый тип для всех тиров)
    // Упрощение: используем префиксы.
    let limitCheckType = type.split('_')[0]; // hq, mine, lumber
    if (BUILDING_LIMITS[type] && getBuildingCount(limitCheckType) >= BUILDING_LIMITS[type]) {
        showToast(`ЛИМИТ ПОСТРОЕК (${type})!`);
        return;
    }

    if (!checkResources(costs)) return;

    payResources(costs);
    gameState.actionsLeft -= apCost;
    let newObj = { type: type, color: gameState.playerColor };
    if (type === 'fortress') newObj.hp = FORTRESS_HP['fortress'];
    if (type === 'barricade') newObj.hp = FORTRESS_HP['barricade'];
    gameState.board[r][c] = newObj;
    sendNetworkMessage({ type: 'build', r, c, buildType: type, isLast: (gameState.actionsLeft<=0) });
    if(gameState.actionsLeft <= 0) showTurnBanner(false);
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
    const r = gameState.myResources;
    if ((r.wood||0) < cost.wood || (r.stone||0) < cost.stone || 
        (r.metal||0) < cost.metal || (r.cedar||0) < cost.cedar ||
        (r.paper||0) < cost.paper || (r.gem||0) < cost.gem || 
        (r.coal||0) < cost.coal || (r.polymer||0) < cost.polymer ||
        (r.uranium||0) < cost.uranium || (r.chemical||0) < cost.chemical) {
        showToast(`НЕ ХВАТАЕТ РЕСУРСОВ!`);
        return false;
    }
    return true;
}

function payResources(cost) {
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
    
    // Перенос фигур (без изменений)
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
    
    recalcBoard(); 
    render(); 
    updateUI();

    const boardEl = document.getElementById('board');
    
    // !!! ВАЖНО: Включаем режим анимации (мягкая сетка)
    boardEl.classList.add('animating-board');

    const fogSquares = Array.from(boardEl.querySelectorAll('.fog'));
    
    // Схлопываем туман
    fogSquares.forEach(sq => {
        sq.classList.add('collapsed'); 
        sq.classList.add('fog-waiting'); 
    });

    void boardEl.offsetWidth; // Reflow

    // Запускаем анимацию раздвигания
    setTimeout(() => {
        fogSquares.forEach(sq => {
            sq.classList.remove('collapsed'); 
        });
    }, 100);

    // Анимация тумана внутри
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
    
    // Глитч эффект
    const renderRowsForGlitch = gameState.playerColor === 'b' ? [...Array(16).keys()].reverse() : [...Array(16).keys()];
    let sqIdx = 0;
    const allSquares = Array.from(boardEl.children);
    
    renderRowsForGlitch.forEach(r => {
        for(let c=0; c<8; c++) {
            const p = gameState.board[r][c];
            if (p && p.glitched) {
                const pieceEl = allSquares[sqIdx].querySelector('.piece');
                if (pieceEl) {
                    pieceEl.classList.add('glitch-shred');
                    setTimeout(() => {
                        if(pieceEl) pieceEl.classList.remove('glitch-shred');
                        p.glitched = false; 
                    }, 2500);
                }
            }
            sqIdx++;
        }
    });

    // !!! ВАЖНО: Когда анимация точно закончилась (2s CSS transition + запас),
    // убираем класс, чтобы сетка стала "железобетонной"
    setTimeout(() => { 
        gameState.expansionAnimationDone = true; 
        boardEl.classList.remove('animating-board');
    }, 2200);
}

export function recruitPawn() {
    if (gameState.actionsLeft < 1) { showToast("НУЖНО 1 ОД!"); return; }
    if ((gameState.myResources.food||0) < 2) { showToast("НУЖНО 2 ЕДЫ!"); return; }
    
    let campR = -1, campC = -1;
    for(let r=0; r<gameState.rows; r++) {
        for(let c=0; c<gameState.cols; c++) {
            if(gameState.board[r][c] && gameState.board[r][c].type === 'camp' && gameState.board[r][c].color === gameState.playerColor) {
                campR = r; campC = c; break;
            }
        }
    }
    
    if (campR === -1) { showToast("НЕТ ЛАГЕРЯ!"); return; }

    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const targetR = campR + dir;
    
    if (targetR < 0 || targetR >= gameState.rows || gameState.board[targetR][campC]) {
        showToast("МЕСТО ВЫСАДКИ ЗАНЯТО!");
        return;
    }
    
    gameState.myResources.food -= 2;
    gameState.actionsLeft--;
    gameState.board[targetR][campC] = { type: 'p', color: gameState.playerColor, moved: true, armor: 0, movedThisTurn: true, rank: 1 };
    sendNetworkMessage({ type: 'transform', from: {r: campR, c: campC}, to: {r: targetR, c: campC}, newType: 'p', isLast: (gameState.actionsLeft <= 0) });
    if(gameState.actionsLeft <= 0) showTurnBanner(false);
    updateUI(); render();
}

export function finishAcademyRecruit(newType, paperCost) {
    if (gameState.actionsLeft < 1) { showToast("НЕТ ОД ДЛЯ ОБУЧЕНИЯ!"); return; }
    if ((gameState.myResources.paper||0) < paperCost) { showToast(`НЕ ХВАТАЕТ БУМАГИ (НУЖНО ${paperCost})!`); return; }
    
    const { from, acad } = gameState.pendingAcademy;
    const dir = gameState.playerColor === 'w' ? -1 : 1;
    const spawnR = acad.r + dir;
    const spawnC = acad.c;

    if (spawnR < 0 || spawnR >= gameState.rows || gameState.board[spawnR][spawnC]) {
        showToast("ВЫХОД ИЗ АКАДЕМИИ ЗАБЛОКИРОВАН!");
        closeModal('academy-modal');
        return; 
    }

    gameState.myResources.paper -= paperCost;

    gameState.board[from.r][from.c] = null;
    
    const isElite = newType.endsWith('_2');
    const unitRank = isElite ? 2 : 1;

    gameState.board[spawnR][spawnC] = { 
        type: newType, 
        color: gameState.playerColor, 
        moved: true, 
        freeMoveUsed: false, 
        armor: 0, 
        movedThisTurn: true,
        rank: unitRank
    };

    gameState.actionsLeft--; 
    sendNetworkMessage({ type: 'transform', from: from, to: {r:spawnR, c:spawnC}, newType: newType, isLast: (gameState.actionsLeft <= 0) });
    if(gameState.actionsLeft <= 0) showTurnBanner(false);
    closeModal('academy-modal');
    updateUI(); render();
}

export function finishPromotion(newType) {
    document.getElementById('promotion-modal').classList.add('hidden');
    const { fr, fc, tr, tc } = gameState.pendingMove;
    gameState.board[tr][tc] = gameState.board[fr][fc]; 
    gameState.board[tr][tc].type = newType; 
    gameState.board[fr][fc] = null;
    gameState.actionsLeft--;
    sendNetworkMessage({ type: 'move', from: {r:fr, c:fc}, to: {r:tr, c:tc}, isLast: (gameState.actionsLeft <= 0), win: false, promoteTo: newType });
    if(gameState.actionsLeft <= 0) showTurnBanner(false);
    gameState.pendingMove = null; updateUI(); render();
}

export function isValidMove(fr, fc, tr, tc) {
    if (tr < 0 || tr >= gameState.rows || tc < 0 || tc >= gameState.cols) return false;
    const p = gameState.board[fr][fc]; 
    if (!p) return false;
    const dest = gameState.board[tr][tc];

    const startFog = isFog(fr, fc);
    const endFog = isFog(tr, tc);
    const baseType = p.type.replace('_2', '');
    const isKnight = baseType === 'n';

    if (gameState.isExpanded) {
        // Определение зон: 1 = Верх (0-3), 2 = Низ (12-15), 0 = Туман (4-11)
        const startBase = (fr < 4) ? 1 : (fr > 11 ? 2 : 0);
        const endBase = (tr < 4) ? 1 : (tr > 11 ? 2 : 0);
        
        // 1. Полный запрет перелета из Базы в Базу (минуя туман)
        // Например: с 3 ряда на 12.
        if (startBase !== 0 && endBase !== 0 && startBase !== endBase) {
            return false;
        }

        // 2. Строгая проверка ВХОДА и ВЫХОДА из тумана (для всех кроме Коня)
        if (!isKnight) {
            // Если идем СВЕРХУ (База 1) В туман -> Цель обязана быть рядом 4
            if (startBase === 1 && endBase === 0) {
                if (tr !== 4) return false;
            }

            // Если идем СНИЗУ (База 2) В туман -> Цель обязана быть рядом 11
            if (startBase === 2 && endBase === 0) {
                if (tr !== 11) return false;
            }

            // Если ВЫХОДИМ из тумана ВВЕРХ -> Цель обязана быть рядом 3
            if (startBase === 0 && endBase === 1) {
                if (tr !== 3) return false;
            }

            // Если ВЫХОДИМ из тумана ВНИЗ -> Цель обязана быть рядом 12
            if (startBase === 0 && endBase === 2) {
                if (tr !== 12) return false;
            }
        }
    }

    if (dest && dest.color === p.color) {
        if ((dest.type === 'academy' || dest.type === 'academy_t2') && p.type === 'p') return true; 
        return false; 
    }
    if (dest && isUpgradedUnit(dest) && p.type === 'p') return false;
    
    const dr = tr - fr, dc = tc - fc; 
    const adr = Math.abs(dr), adc = Math.abs(dc);

    switch(baseType) {
        case 'p':
            const dir = p.color === 'w' ? -1 : 1;
            if (dest && (dest.type === 'academy' || dest.type === 'academy_t2') && dest.color === p.color) return true;
            if (dc === 0 && !dest && dr === dir) return true;
            if (dc === 0 && !dest && !p.moved && dr === 2 * dir) {
                if (!gameState.board[fr + dir][fc]) return true;
            }
            if (adc === 1 && dr === dir && dest && dest.color !== p.color) return true;
            return false;
            
        case 'n': return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        
        case 'b': 
            if (adr !== adc) return false;
            return isPathClear(fr, fc, tr, tc);
            
        case 'r': 
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(fr, fc, tr, tc);
            
        case 'q': 
            if (!(adr === adc || dr === 0 || dc === 0)) return false;
            return isPathClear(fr, fc, tr, tc);
            
        case 'k': return (adr <= 1 && adc <= 1); 
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

    if (dest && (dest.type === 'academy' || dest.type === 'academy_t2') && dest.color === piece.color && piece.type === 'p') {
        openAcademyModal(fr, fc, tr, tc, dest.type === 'academy_t2');
        return;
    }

    // ЛОГИКА АТАКИ ПОСТРОЕК С ЗАЩИТОЙ
    if (dest && dest.color !== piece.color) {
        // Проверяем HP (стены, баррикады)
        if (dest.hp !== undefined && dest.hp > 0) {
            dest.hp--; // Снимаем 1 ед. защиты
            
            // Фигура тратит действие, но ОСТАЕТСЯ НА МЕСТЕ
            if (piece.type !== 'p' || piece.rank !== 2) { // Если не элитная, тратим ход (упростим: атака всегда тратит ход)
                 piece.movedThisTurn = true; 
            }
            
            gameState.actionsLeft--;
            sendNetworkMessage({ type: 'attack_hit', r: tr, c: tc, hp: dest.hp, isLast: (gameState.actionsLeft<=0) });
            
            if(gameState.actionsLeft <= 0) showTurnBanner(false);
            gameState.selectedPiece = null;
            updateUI(); render();
            return; // ПРЕРЫВАЕМ ФУНКЦИЮ, ПЕРЕМЕЩЕНИЯ НЕ ПРОИСХОДИТ
        }

        // Проверяем ARMOR (КЦ/Штабы)
        if (dest.armor !== undefined && dest.armor > 0) {
            dest.armor--; // Снимаем 1 ед. брони
            
            piece.movedThisTurn = true;
            gameState.actionsLeft--;
            sendNetworkMessage({ type: 'attack_armor', r: tr, c: tc, armor: dest.armor, isLast: (gameState.actionsLeft<=0) });
            
            if(gameState.actionsLeft <= 0) showTurnBanner(false);
            gameState.selectedPiece = null;
            updateUI(); render();
            return; // ПРЕРЫВАЕМ ФУНКЦИЮ, ПЕРЕМЕЩЕНИЯ НЕ ПРОИСХОДИТ
        }
    }
    
    // Если защиты нет (или это обычная фигура), код идет дальше и происходит захват
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

    if (costsAP) gameState.actionsLeft--;
    
    const endRow = gameState.playerColor === 'w' ? 0 : (gameState.rows - 1);
    if (piece.type === 'p' && tr === endRow && !isWinMove) {
        showPromotionModal(fr, fc, tr, tc); 
        return; 
    }

    sendNetworkMessage({ 
        type: 'move', from: {r:fr, c:fc}, to: {r:tr, c:tc}, 
        isLast: (gameState.actionsLeft <= 0), win: isWinMove, 
        freeMoveUsed: !costsAP 
    });

    if(gameState.actionsLeft <= 0) showTurnBanner(false);
    
    gameState.selectedPiece = null; 
    updateUI(); render();
}

export function isNearOwnPiece(r, c, type) {
    if (gameState.board[r][c] && gameState.board[r][c].color === gameState.playerColor && (type.endsWith('_t2') || type.endsWith('_t3') || type.endsWith('_t4') || type === 'academy')) return true;
    if (gameState.board[r][c]) return false; 
    
    const targetIsFog = isFog(r, c);
    for(let dr = -1; dr <= 1; dr++) {
        for(let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                const neighbor = gameState.board[nr][nc];
                if (neighbor && neighbor.color === gameState.playerColor) {
                    
                    const neighborIsBuilding = BUILDINGS.includes(neighbor.type);

                    if (type.startsWith('fortress') || type === 'barricade') {
                         if (targetIsFog === isFog(nr, nc)) return true;
                    } 
                    else {
                        if (!neighborIsBuilding) {
                             if (targetIsFog === isFog(nr, nc)) return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

export function onPiecePointerDown(e, fr, fc) {
    if (gameState.gameOver || !gameState.currentRoom || gameState.actionsLeft <= 0) {
         return;
    }
    
    if (gameState.board[fr][fc] && gameState.board[fr][fc].type === 'camp') return;
    const p = gameState.board[fr][fc];
    if (!p || p.color !== gameState.playerColor) return;
    
    if (p.movedThisTurn) {
        showToast("ЭТА ФИГУРА УЖЕ ХОДИЛА!");
        return;
    }

    gameState.selectedPiece = {r: fr, c: fc}; 
    dragState.isBuildingDrag = false;
    dragState.from = { r: fr, c: fc };
    const baseType = p.type.replace('_2', '');
    initDrag(e, `url(${PIECE_URLS[p.color + baseType]})`);
    
    render(); 
}

export function onSidebarPointerDown(e, type) {
    if (gameState.gameOver || !gameState.currentRoom || gameState.actionsLeft <= 0 || !gameState.isBuildMode) return;
    dragState.isBuildingDrag = true;
    dragState.from = { type: type };
    // Получаем иконку для драга
    let icon = BUILDING_ICONS[type];
    if (!icon) {
        // Попытка найти базовый тип
        const base = type.replace('_t2','').replace('_t3','').replace('_t4','');
        icon = BUILDING_ICONS[base];
    }
    initDrag(e, null, icon);
}