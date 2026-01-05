import { gameState } from './state.js';
import { PIECE_URLS, BUILDING_ICONS, BUILDINGS, T2_BUILDINGS, T3_BUILDINGS, FORTRESS_HP } from './constants.js';
import { onPiecePointerDown, buildSomething, isNearOwnPiece, movePiece, isValidMove, finishAcademyRecruit } from './game.js';

export const dragState = {
    started: false, cloneEl: null, from: null, isBuildingDrag: false,
    pointerId: null, startX: 0, startY: 0, lastHover: null
};

export function showToast(msg) {
    const t = document.getElementById('game-toast');
    t.innerText = msg;
    t.className = "show";
    setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000);
}

// Баннер смены хода
export function showTurnBanner(isMyTurn) {
    const banner = document.getElementById('turn-banner');
    if (!banner) return;
    banner.innerText = isMyTurn ? "ВАШ ХОД" : "ХОД ПРОТИВНИКА";
    banner.style.color = isMyTurn ? "#2ecc71" : "#e74c3c";
    banner.classList.add('active');
    setTimeout(() => {
        banner.classList.remove('active');
    }, 1500);
}

export function isFog(r, c) {
    if (!gameState.isExpanded) return false;
    return (r >= 4 && r <= 11);
}

export function isUpgradedUnit(piece) { return piece && piece.type.endsWith('_2'); }

export function recalcBoard() {
    const buildMenu = document.getElementById('build-menu-container');
    let safeTop = 60; 
    let safeBottom = 15; 

    if (gameState.isBuildMode) safeTop = 150; 

    if (window.innerWidth <= 768) {
        if (gameState.isBuildMode) {
            const menuH = buildMenu.offsetHeight || (window.innerHeight * 0.38); 
            safeBottom = menuH + 10; 
        } else {
            safeBottom = 60; 
        }
    }

    const availableHeight = window.innerHeight - safeTop - safeBottom;
    const availableWidth = window.innerWidth - 10;
    if (availableHeight < 0) return;

    const maxSqH = Math.floor(availableHeight / gameState.rows);
    const maxSqW = Math.floor(availableWidth / gameState.cols);
    let sqSize = Math.min(maxSqH, maxSqW);

    document.documentElement.style.setProperty('--sq-size', sqSize + 'px');
    const wrapper = document.getElementById('board-wrapper');
    wrapper.style.paddingTop = safeTop + 'px';
    wrapper.style.paddingBottom = safeBottom + 'px';
}

export function render() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    document.documentElement.style.setProperty('--rows', gameState.rows);
    document.documentElement.style.setProperty('--cols', gameState.cols);
    if (gameState.isExpanded) boardEl.classList.add('expanded');
    
    const rangeR = gameState.playerColor === 'b' ? [...Array(gameState.rows).keys()].reverse() : [...Array(gameState.rows).keys()];
    const rangeC = [...Array(gameState.cols).keys()];
    const forgeUI = document.getElementById('forge-ui');
    let forgeActive = false;
    
    rangeR.forEach(r => {
        rangeC.forEach(c => {
            const square = document.createElement('div');
            let isDark = (r + c) % 2 !== 0;
            square.className = `square ${isDark ? 'dark' : 'light'}`;
            if (isFog(r, c)) square.classList.add('fog');
            
            // --- ПОДСВЕТКА ПОСЛЕДНЕГО ХОДА (РАМКИ) ---
            if (gameState.lastOpponentMove) {
                if (gameState.lastOpponentMove.from.r === r && gameState.lastOpponentMove.from.c === c) square.classList.add('last-move-src');
                if (gameState.lastOpponentMove.to.r === r && gameState.lastOpponentMove.to.c === c) square.classList.add('last-move-dst');
            }

            // --- ПОДСВЕТКА ВОЗМОЖНЫХ ХОДОВ ---
            if (gameState.selectedPiece && !gameState.isBuildMode) {
                if (isValidMove(gameState.selectedPiece.r, gameState.selectedPiece.c, r, c)) {
                    square.classList.add('legal-move');
                    if (gameState.board[r][c] && gameState.board[r][c].color !== gameState.playerColor) {
                        square.classList.add('enemy-target');
                    }
                }
                if (gameState.selectedPiece.r === r && gameState.selectedPiece.c === c) {
                    square.style.boxShadow = "inset 0 0 25px rgba(241, 196, 15, 0.6)";
                }
            }
            
            if (gameState.isExpanded && r >= 4 && r < 12 && !gameState.expansionAnimationDone) { 
                square.classList.add('growing');
                const dist = Math.abs(r - 7.5) + Math.abs(c - 3.5);
                square.style.animationDelay = `${dist * 0.05}s`; 
            }

            const p = gameState.board[r][c];
            if(p) {
                const pDiv = document.createElement('div');
                if (p.type === 'forge') {
                    pDiv.className = 'special-piece t3-building';
                    pDiv.innerHTML = BUILDING_ICONS['forge'];
                    pDiv.style.textShadow = '0 0 15px #e67e22';
                    square.appendChild(pDiv);
                }
                else if (BUILDINGS.includes(p.type)) {
                    pDiv.className = 'special-piece';
                    if (T2_BUILDINGS.includes(p.type)) pDiv.classList.add('t2-building');
                    if (T3_BUILDINGS.includes(p.type)) pDiv.classList.add('t3-building');
                    if (p.type === 'house') pDiv.classList.add('settlement');
                    pDiv.innerHTML = BUILDING_ICONS[p.type] || '?';
                    
                    if (p.type.startsWith('fortress')) {
                        const max = FORTRESS_HP[p.type] || 2;
                        const cur = p.hp !== undefined ? p.hp : max;
                        const bar = document.createElement('div');
                        bar.className = 'hp-bar';
                        const fill = document.createElement('div');
                        fill.className = 'hp-val';
                        fill.style.width = (cur / max * 100) + '%';
                        bar.appendChild(fill);
                        pDiv.appendChild(bar);
                    }
                    square.appendChild(pDiv);
                } else {
                    pDiv.className = 'piece';
                    const baseType = p.type.replace('_2', '');
                    pDiv.style.backgroundImage = `url(${PIECE_URLS[p.color + baseType]})`;
                    if (isUpgradedUnit(p)) pDiv.classList.add('upgraded');
                    
                    if (p.movedThisTurn) pDiv.classList.add('exhausted');

                    if (p.armor > 0) {
                        const badge = document.createElement('div');
                        badge.className = 'armor-badge';
                        badge.innerText = p.armor;
                        pDiv.appendChild(badge);
                    }
                    pDiv.addEventListener('pointerdown', (e) => {
                        e.stopPropagation();
                        onPiecePointerDown(e, r, c);
                    });
                    
                    square.appendChild(pDiv);
                    if (p.onForge && p.color === gameState.playerColor) {
                        gameState.selectedPiece = { r, c }; 
                        forgeActive = true;
                        square.style.boxShadow = "inset 0 0 20px #e67e22";
                    }
                }
            } 

            square.addEventListener('pointerdown', (e) => {
                if (gameState.selectedPiece && !gameState.isBuildMode) {
                     if (isValidMove(gameState.selectedPiece.r, gameState.selectedPiece.c, r, c)) {
                         movePiece(gameState.selectedPiece.r, gameState.selectedPiece.c, r, c);
                     } else {
                         gameState.selectedPiece = null;
                         render();
                     }
                }
            });

            boardEl.appendChild(square);
        });
    });

    forgeUI.style.display = forgeActive ? 'block' : 'none';
    
    const els = {
        wood: document.getElementById('res-wood-val'),
        stone: document.getElementById('res-stone-val'),
        metal: document.getElementById('res-metal-val'),
        cedar: document.getElementById('res-cedar-val'),
        paper: document.getElementById('res-paper-val'),
        food: document.getElementById('res-food-val'),
        gem: document.getElementById('res-gem-val'),
        coal: document.getElementById('res-coal-val'),
        polymer: document.getElementById('res-poly-val')
    };
    for (let k in els) {
        if(els[k]) {
            els[k].innerText = gameState.myResources[k];
            const parent = els[k].parentElement;
            if (gameState.myResources[k] >= 5) parent.classList.add('limit-reached');
            else parent.classList.remove('limit-reached');
        }
    }
}

export function hasSpecial(color, type) { return gameState.board.flat().some(p => p && p.type === type && p.color === color); }

export function updateUI() {
    const statusEl = document.getElementById('status');
    const hasHQ = hasSpecial(gameState.playerColor, 'hq');
    if (gameState.actionsLeft > 0) statusEl.textContent = hasHQ ? `ТВОЙ ХОД (${gameState.actionsLeft} ОД)` : "ТВОЙ ХОД";
    else statusEl.textContent = "ХОД ПРОТИВНИКА...";
    
    if (gameState.isBuildMode) document.body.classList.add('build-mode');
    else document.body.classList.remove('build-mode');
    document.getElementById('btn-build-hq').classList.toggle('hidden-btn', hasHQ);
    
    const btnApogee = document.getElementById('btn-apogee');
    if (gameState.isExpanded) {
        btnApogee.style.display = 'none';
    } else {
        btnApogee.style.display = gameState.isBuildMode ? 'block' : 'none';
    }
    
    const btnCamp = document.getElementById('btn-camp-recruit');
    const hasCamp = hasSpecial(gameState.playerColor, 'camp');
    if (hasCamp && gameState.isBuildMode) {
        btnCamp.style.display = 'block';
        btnCamp.classList.add('fade-btn');
    } else {
        btnCamp.style.display = 'none';
    }
}

export function openAcademyModal(fr, fc, tr, tc, isT2) {
    gameState.pendingAcademy = { from: {r:fr, c:fc}, acad: {r:tr, c:tc} };
    const modal = document.getElementById('academy-modal');
    const stdContainer = document.getElementById('acad-std-options');
    const eliteContainer = document.getElementById('acad-elite-options');
    const eliteSection = document.getElementById('acad-elite-section');

    stdContainer.innerHTML = ''; eliteContainer.innerHTML = '';
    const units = [{t:'n', i:'♞'}, {t:'b', i:'♝'}, {t:'r', i:'♜'}];

    units.forEach(u => {
        const btn = document.createElement('div');
        btn.className = 'promo-btn';
        btn.innerHTML = `${u.i}<span class="cost">2 БУМАГИ</span>`;
        btn.onclick = () => finishAcademyRecruit(u.t, 2);
        stdContainer.appendChild(btn);
    });

    if (isT2) {
        eliteSection.classList.remove('hidden');
        units.forEach(u => {
            const btn = document.createElement('div');
            btn.className = 'promo-btn upgraded-offer';
            btn.innerHTML = `${u.i}<span class="cost" style="color:gold">5 БУМАГИ</span>`;
            btn.onclick = () => finishAcademyRecruit(u.t + '_2', 5); 
            eliteContainer.appendChild(btn);
        });
    } else { eliteSection.classList.add('hidden'); }
    modal.classList.remove('hidden');
}

export function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

export function showPromotionModal(fr, fc, tr, tc) {
    gameState.pendingMove = { fr, fc, tr, tc };
    const modal = document.getElementById('promotion-modal');
    const container = document.getElementById('promo-options-container');
    container.innerHTML = '';
    [{t:'q', i:'♛'}, {t:'r', i:'♜'}, {t:'b', i:'♝'}, {t:'n', i:'♞'}].forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'promo-btn';
        btn.innerHTML = opt.i;
        btn.onclick = () => window.finishPromotion(opt.t);
        container.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

export function endGame(isWin) {
    gameState.gameOver = true;
    const modal = document.getElementById('victory-modal');
    const title = document.getElementById('victory-title');
    title.innerHTML = isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ...';
    title.style.color = isWin ? '#2ecc71' : '#e74c3c';
    modal.classList.remove('hidden');
}

// Drag & Drop Logic
export function initDrag(e, bgImage, icon) {
    dragState.pointerId = e.pointerId;
    dragState.startX = e.clientX; dragState.startY = e.clientY;
    dragState.started = false;
    
    const clone = document.createElement('div');
    clone.className = 'dragging-clone';
    if (bgImage) clone.style.backgroundImage = bgImage;
    if (icon) clone.innerHTML = icon;
    dragState.cloneEl = clone;

    document.addEventListener('pointermove', onDocumentPointerMove);
    document.addEventListener('pointerup', onDocumentPointerUp);
    document.addEventListener('pointercancel', cleanupDrag);
}

function onDocumentPointerMove(e) {
    if (e.pointerId !== dragState.pointerId) return;
    const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
    if (!dragState.started) {
        if (dist > 10) {
            dragState.started = true;
            document.body.appendChild(dragState.cloneEl);
            dragState.cloneEl.style.display = 'flex';
        } else { return; }
    }
    if (dragState.started) {
        e.preventDefault();
        dragState.cloneEl.style.left = `${e.clientX}px`;
        dragState.cloneEl.style.top = `${e.clientY}px`;
        updateHoverHighlight(e.clientX, e.clientY);
    }
}

function onDocumentPointerUp(e) {
    if (e.pointerId !== dragState.pointerId) return;
    if (dragState.started) {
        const target = getSquareFromPoint(e.clientX, e.clientY);
        if (target) {
            if (dragState.isBuildingDrag) {
                if (isNearOwnPiece(target.r, target.c, dragState.from.type)) {
                    buildSomething(target.r, target.c, dragState.from.type);
                } else if (dragState.from.type === 'demolish') {
                    buildSomething(target.r, target.c, 'demolish');
                } else { showToast("СТРОИТЬ МОЖНО ТОЛЬКО РЯДОМ С СОЮЗНЫМИ ЮНИТАМИ."); }
            } else {
                if (isValidMove(dragState.from.r, dragState.from.c, target.r, target.c)) {
                    movePiece(dragState.from.r, dragState.from.c, target.r, target.c);
                }
            }
        }
    }
    cleanupDrag();
}

function cleanupDrag() {
    if (dragState.cloneEl) {
        if(dragState.cloneEl.parentElement) dragState.cloneEl.parentElement.removeChild(dragState.cloneEl);
        dragState.cloneEl = null; 
    }
    if (dragState.lastHover) dragState.lastHover.classList.remove('drag-over');
    dragState.lastHover = null;
    dragState.started = false;
    
    document.removeEventListener('pointermove', onDocumentPointerMove);
    document.removeEventListener('pointerup', onDocumentPointerUp);
    document.removeEventListener('pointercancel', cleanupDrag);
}

window.addEventListener('blur', cleanupDrag);
window.addEventListener('visibilitychange', cleanupDrag);
document.addEventListener('pointercancel', cleanupDrag);

function updateHoverHighlight(x, y) {
    if(dragState.cloneEl) dragState.cloneEl.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if(dragState.cloneEl) dragState.cloneEl.style.display = 'flex';
    const sq = el?.closest('.square');
    if (dragState.lastHover && dragState.lastHover !== sq) dragState.lastHover.classList.remove('drag-over');
    if (sq) { sq.classList.add('drag-over'); dragState.lastHover = sq; }
}

function getSquareFromPoint(x, y) {
    if(dragState.cloneEl) dragState.cloneEl.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if(dragState.cloneEl) dragState.cloneEl.style.display = 'flex';
    const sq = el?.closest('.square'); 
    if (!sq) return null;
    const idx = Array.from(document.getElementById('board').children).indexOf(sq);
    if (idx === -1) return null;
    const visualRow = Math.floor(idx / gameState.cols);
    const c = idx % gameState.cols;
    const r = gameState.playerColor === 'b' ? (gameState.rows - 1) - visualRow : visualRow;
    return { r, c };
}