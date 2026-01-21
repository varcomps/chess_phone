import { gameState } from './state.js';
import { PIECE_URLS, BUILDING_ICONS, BUILDINGS, T2_BUILDINGS, T3_BUILDINGS, T4_BUILDINGS, FORTRESS_HP, BUILDING_LIMITS } from './constants.js';
import { onPiecePointerDown, buildSomething, isNearOwnPiece, movePiece, isValidMove, finishAcademyRecruit, getBuildingCount, getMaxResourceLimit, recruitPawn, finishWorkshopBuild, processProduction, activateMageTowerMode, finishTorpedoBuild, passTurn, updateFogOfWar } from './game.js';

export const dragState = {
    started: false, cloneEl: null, from: null, isBuildingDrag: false,
    pointerId: null, startX: 0, startY: 0, lastHover: null
};

window.finishCampRecruit = recruitPawn;
window.finishWorkshopBuild = finishWorkshopBuild;
window.processProduction = processProduction;
window.activateMageTowerMode = activateMageTowerMode;
window.finishTorpedoBuild = finishTorpedoBuild;
window.passTurn = passTurn; 

window.toggleAdminMode = function() {
    gameState.isAdminMode = !gameState.isAdminMode;
    const btn = document.getElementById('btn-admin-toggle');
    if (gameState.isAdminMode) {
        btn.classList.add('active');
        btn.innerText = "🛠️ ADMIN: ON";
        showToast("GOD MODE ACTIVATED");
    } else {
        btn.classList.remove('active');
        btn.innerText = "🛠️ ADMIN: OFF";
        showToast("GOD MODE OFF");
    }
    updateUI();
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 768) {
        const term = document.getElementById('debug-console');
        if(term) {
            term.style.display = 'block';
            term.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (term.value === 'miku') {
                        document.getElementById('btn-admin-toggle').style.display = 'block';
                        showToast("ACCESS GRANTED");
                        term.value = '';
                        term.style.display = 'none'; 
                    }
                }
            });
        }
    }
});

export function showToast(msg) {
    const t = document.getElementById('game-toast');
    if(t) {
        t.innerText = msg;
        t.className = "show";
        setTimeout(() => { t.className = t.className.replace("show", ""); }, 3000);
    }
}
export function showTurnBanner(isMyTurn) {
    const banner = document.getElementById('turn-banner');
    if (!banner) return;
    banner.innerText = isMyTurn ? "ВАШ ХОД" : "ХОД ПРОТИВНИКА";
    banner.style.color = isMyTurn ? "#2ecc71" : "#e74c3c";
    banner.classList.add('active');
    setTimeout(() => { banner.classList.remove('active'); }, 1500);
}
export function playSlashAnimation() {
    const overlay = document.getElementById('slash-overlay');
    if(overlay) {
        overlay.classList.add('active');
        setTimeout(() => { overlay.classList.remove('active'); }, 1000);
    }
}

export function playMagicShot(fromR, fromC, toR, toC) {
    const getScreenPos = (r, c) => {
        const visualRow = (gameState.myColor === 'b') ? (gameState.rows - 1 - r) : r;
        const visualCol = c;
        const idx = (visualRow * gameState.cols) + visualCol;
        const squares = document.querySelectorAll('.square');
        if (squares[idx]) {
            const rect = squares[idx].getBoundingClientRect();
            return {
                x: rect.left + (rect.width / 2),
                y: rect.top + (rect.height / 2)
            };
        }
        return {x: window.innerWidth / 2, y: window.innerHeight / 2}; 
    };

    const start = getScreenPos(fromR, fromC);
    const end = getScreenPos(toR, toC);

    const ball = document.createElement('div');
    ball.className = 'magic-missile';
    
    ball.style.position = 'fixed'; 
    ball.style.top = '0';
    ball.style.left = '0';
    ball.style.zIndex = '10000'; 
    ball.style.transform = `translate(${start.x}px, ${start.y}px)`; 
    
    document.body.appendChild(ball);

    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;

    const animation = ball.animate([
        { transform: `translate(${start.x}px, ${start.y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${start.x + deltaX}px, ${start.y + deltaY}px) scale(1.5)`, opacity: 1 }
    ], {
        duration: 500, 
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    });

    animation.onfinish = () => {
        ball.remove();
        const hit = document.createElement('div');
        hit.className = 'magic-hit';
        hit.style.position = 'fixed';
        hit.style.left = (end.x - 20) + 'px'; 
        hit.style.top = (end.y - 20) + 'px';
        hit.style.zIndex = '9999';
        document.body.appendChild(hit);
        setTimeout(() => { hit.remove(); }, 600);
    };
}

export function isFog(r, c) {
    if (!gameState.isExpanded) return false;
    return (r >= 4 && r <= 11);
}

export function isUpgradedUnit(piece) { 
    return piece && (piece.rank === 2 || piece.type.endsWith('_2')); 
}

export function recalcBoard() {
    const buildMenu = document.getElementById('build-menu-container');
    let safeTop = 60; let safeBottom = 15; 
    if (gameState.isBuildMode) safeTop = 150; 
    if (window.innerWidth <= 768) {
        if (gameState.isBuildMode) {
            safeBottom = 200; 
        } else { safeBottom = 20; }
        safeTop = 110; 
    }
    const availableHeight = window.innerHeight - safeTop - safeBottom;
    const availableWidth = window.innerWidth - 10;
    if (availableHeight < 0) return;
    const maxSqH = Math.floor(availableHeight / gameState.rows);
    const maxSqW = Math.floor(availableWidth / gameState.cols);
    let sqSize = Math.min(maxSqH, maxSqW);
    document.documentElement.style.setProperty('--sq-size', sqSize + 'px');
    const wrapper = document.getElementById('board-wrapper');
    if(wrapper) {
        wrapper.style.paddingTop = safeTop + 'px';
        wrapper.style.paddingBottom = safeBottom + 'px';
    }
}

export function render() {
    const boardEl = document.getElementById('board');
    if(!boardEl) return;
    
    if (!gameState.visibilityMask || gameState.visibilityMask.length !== gameState.rows) updateFogOfWar();

    boardEl.innerHTML = '';
    document.documentElement.style.setProperty('--rows', gameState.rows);
    document.documentElement.style.setProperty('--cols', gameState.cols);
    if (gameState.isExpanded) boardEl.classList.add('expanded');
    
    const rangeR = gameState.myColor === 'b' ? [...Array(gameState.rows).keys()].reverse() : [...Array(gameState.rows).keys()];
    const rangeC = [...Array(gameState.cols).keys()];
    
    rangeR.forEach(r => {
        rangeC.forEach(c => {
            const square = document.createElement('div');
            let isDark = (r + c) % 2 !== 0;
            square.className = `square ${isDark ? 'dark' : 'light'}`;
            
            // Визуальный эффект тумана (фона)
            if (isFog(r, c)) { square.classList.add('fog'); square.classList.add(isDark ? 'dark' : 'light'); }
            
            // Логический туман войны (Shroud)
            const isVisible = gameState.visibilityMask[r][c];
            if (!isVisible) {
                square.classList.add('shroud');
            }
            
            // Подсветка таргетинга (башня мага)
            if (gameState.isTargetingMode && gameState.targetingSource) {
                const dist = Math.max(Math.abs(gameState.targetingSource.r - r), Math.abs(gameState.targetingSource.c - c));
                if (dist <= 2 && isVisible) square.style.boxShadow = "inset 0 0 20px rgba(155, 89, 182, 0.5)";
            }

            // Подсветка возможных ходов
            if (gameState.selectedPiece) {
                if (isValidMove(gameState.selectedPiece.r, gameState.selectedPiece.c, r, c)) {
                    square.classList.add('legal-move');
                    if (isVisible && gameState.board[r][c] && gameState.board[r][c].color !== gameState.playerColor) {
                        square.classList.add('enemy-target');
                    }
                }
                if (gameState.selectedPiece.r === r && gameState.selectedPiece.c === c) {
                    square.style.boxShadow = "inset 0 0 25px rgba(241, 196, 15, 0.6)";
                }
            }
            
            if (gameState.isExpanded && r >= 4 && r < 12 && !gameState.expansionAnimationDone) { 
                square.classList.add('growing');
            }

            const p = gameState.board[r][c];
            if(p) {
                // Рендерим ТОЛЬКО если это моя фигура ИЛИ клетка видима
                if (p.color === gameState.myColor || isVisible) {
                    const pDiv = document.createElement('div');
                    
                    if (BUILDINGS.includes(p.type)) {
                        pDiv.className = 'special-piece';
                        if (T2_BUILDINGS.includes(p.type)) pDiv.classList.add('t2-building');
                        if (T3_BUILDINGS.includes(p.type)) pDiv.classList.add('t3-building');
                        if (T4_BUILDINGS.includes(p.type)) pDiv.classList.add('t4-building');
                        if (p.type === 'house') pDiv.classList.add('settlement');
                        pDiv.innerHTML = BUILDING_ICONS[p.type] || '?';
                        
                        let shieldVal = 0;
                        if (p.hp !== undefined) shieldVal = p.hp;
                        if (p.armor !== undefined) shieldVal = p.armor;
                        if (shieldVal > 0) {
                            const badge = document.createElement('div');
                            badge.className = 'shield-badge';
                            badge.innerText = shieldVal;
                            pDiv.appendChild(badge);
                        }
                        
                        pDiv.addEventListener('pointerdown', (e) => { 
                            e.stopPropagation(); 
                            onPiecePointerDown(e, r, c); 
                        });

                        square.appendChild(pDiv);
                    } 
                    else {
                        pDiv.className = 'piece';
                        const baseType = p.type.replace('_2', '');
                        if (p.type === 'ram') {
                            pDiv.style.backgroundImage = `url(${PIECE_URLS[p.color + 'ram']})`;
                            pDiv.style.filter = "drop-shadow(2px 4px 6px rgba(0,0,0,0.5))"; 
                        } else if (p.type === 'torpedo') {
                            pDiv.style.backgroundImage = `url(${PIECE_URLS[p.color + 'torpedo']})`;
                            pDiv.style.filter = "drop-shadow(0 0 5px red)";
                            const rot = p.color === 'w' ? '0deg' : '180deg';
                            pDiv.style.transform = `rotate(${rot})`;
                        } else {
                            pDiv.style.backgroundImage = `url(${PIECE_URLS[p.color + baseType]})`;
                        }
                        
                        if (isUpgradedUnit(p)) { pDiv.classList.add('upgraded'); pDiv.classList.add('elite-unit'); }
                        if (p.movedThisTurn) pDiv.classList.add('exhausted');
                        
                        // --- ИНДИКАТОР ШАХА ---
                        if (p.type === 'k' && gameState.isKingInCheck && p.color === gameState.myColor) {
                             pDiv.classList.add('check-danger');
                             square.style.boxShadow = "inset 0 0 30px red";
                        }
                        
                        if (p.armor > 0) {
                            const badge = document.createElement('div');
                            badge.className = 'shield-badge';
                            badge.innerText = p.armor;
                            if (p.type === 'torpedo') badge.style.transform = p.color === 'w' ? '' : 'rotate(180deg)';
                            pDiv.appendChild(badge);
                        }
                        pDiv.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPiecePointerDown(e, r, c); });
                        square.appendChild(pDiv);
                    }
                }
            } 

            square.addEventListener('pointerdown', (e) => {
                if (gameState.isTargetingMode) {
                     onPiecePointerDown(e, r, c); 
                     return;
                }
                if (gameState.selectedPiece) {
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
    
    updateResourcePanel();
}

function updateResourcePanel() {
    const els = {
        wood: document.getElementById('res-wood-val'),
        stone: document.getElementById('res-stone-val'),
        metal: document.getElementById('res-metal-val'),
        cedar: document.getElementById('res-cedar-val'),
        paper: document.getElementById('res-paper-val'),
        food: document.getElementById('res-food-val'),
        gem: document.getElementById('res-gem-val'),
        polymer: document.getElementById('res-poly-val'),
        uranium: document.getElementById('res-uranium-val'),
        chemical: document.getElementById('res-chem-val'),
        mana_gem: document.getElementById('res-mana-val')
    };
    const maxRes = getMaxResourceLimit(); 
    for (let k in els) {
        if(els[k]) {
            els[k].innerText = gameState.myResources[k] || 0;
            if (els[k].nextSibling) els[k].nextSibling.nodeValue = "/" + maxRes;
            const parent = els[k].parentElement;
            if ((gameState.myResources[k] || 0) >= maxRes) parent.classList.add('limit-reached');
            else parent.classList.remove('limit-reached');
        }
    }
}

export function hasSpecial(color, type) { return gameState.board.flat().some(p => p && p.type === type && p.color === color); }
function updateBuildingCounters() {
    if (!gameState.isBuildMode) return;
    document.querySelectorAll('.build-item').forEach(item => {
        const type = item.getAttribute('data-type');
        if (!type || type === 'demolish') return;
        let baseType = type.replace('_t2', '').replace('_t3', '').replace('_t4', '');
        const limit = BUILDING_LIMITS[baseType] || 99;
        const count = getBuildingCount(baseType);
        let counter = item.querySelector('.build-count');
        if (!counter) {
            counter = document.createElement('div'); counter.className = 'build-count'; item.appendChild(counter);
        }
        counter.innerText = `${count}/${limit}`;
        if (count >= limit) counter.style.color = '#e74c3c'; else counter.style.color = '#fff';
    });
}
export function updateUI() {
    const statusEl = document.getElementById('status');
    const hasHQ = hasSpecial(gameState.playerColor, 'hq');
    const hasHQ2 = hasSpecial(gameState.playerColor, 'hq_t2');
    const hasHQ3 = hasSpecial(gameState.playerColor, 'hq_t3');
    const hasHQ4 = hasSpecial(gameState.playerColor, 'hq_t4');
    const isAlive = hasHQ || hasHQ2 || hasHQ3 || hasHQ4;
    
    // ЛОГИКА ОТОБРАЖЕНИЯ СТАТУСА
    if (statusEl) {
        if (gameState.isAdminMode) statusEl.textContent = "РЕЖИМ БОГА";
        else if (gameState.playerColor === gameState.myColor) {
             statusEl.textContent = isAlive ? `ТВОЙ ХОД (${gameState.actionsLeft} ОД)` : "ТВОЙ ХОД";
        } else {
             statusEl.textContent = "ХОД ПРОТИВНИКА...";
        }
    }
    
    if (gameState.isBuildMode) document.body.classList.add('build-mode'); else document.body.classList.remove('build-mode');
    
    const btnApogee = document.getElementById('btn-apogee');
    if (btnApogee) {
        if (gameState.isExpanded) btnApogee.style.display = 'none';
        else btnApogee.style.display = gameState.isBuildMode ? 'block' : 'none';
    }
    
    const passBtn = document.getElementById('btn-pass-turn');
    if (passBtn) {
        const isMyTurn = (gameState.playerColor === gameState.myColor);
        if (isMyTurn && !gameState.gameOver && isAlive) {
            passBtn.style.display = 'block';
        } else {
            passBtn.style.display = 'none';
        }
    }

    updateBuildingCounters();
}

function renderModalStats(resourcesToShow) {
    let html = '<div class="modal-res-header">';
    resourcesToShow.forEach(r => {
        const val = gameState.myResources[r.key] || 0;
        const highlightClass = r.isProduct ? 'highlight' : ''; 
        html += `
            <div class="m-res-item">
                <span class="m-res-icon">${r.icon}</span>
                <span class="m-res-val ${highlightClass}">${val}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

export function openCampModal(fr, fc, tr, tc) {
    gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc} };
    const container = document.getElementById('camp-options');
    const statsHTML = renderModalStats([ { key: 'food', icon: '🥩' } ]);
    container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="finishCampRecruit()">
            <div class="btn-left">
                <span class="btn-icon">♟️</span>
                <span class="btn-title">НОВОБРАНЕЦ</span>
            </div>
            <div class="btn-right">
                <div class="res-badge"><span>🥩</span> <span class="res-val">2</span></div>
            </div>
        </div>
    `;
    document.getElementById('camp-modal').classList.remove('hidden');
}

export function openWorkshopModal(fr, fc, tr, tc) {
    gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc} }; 
    const modal = document.getElementById('workshop-modal');
    const container = modal.querySelector('.promo-options');
    const statsHTML = renderModalStats([
        { key: 'wood', icon: '🌲' },
        { key: 'cedar', icon: '🍁' },
        { key: 'metal', icon: '🔩' }
    ]);
    container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="finishWorkshopBuild('ram')">
            <div class="btn-left">
                <span class="btn-icon">🐏</span>
                <span class="btn-title">ТАРАН</span>
            </div>
            <div class="btn-right" style="gap:5px;">
                <div class="res-badge">🌲<span class="res-val">4</span></div>
                <div class="res-badge">🍁<span class="res-val">4</span></div>
                <div class="res-badge">🔩<span class="res-val">2</span></div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

export function openTorpedoModal(fr, fc, tr, tc) {
    gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc} }; 
    const modal = document.getElementById('torpedo-modal');
    const container = modal.querySelector('.promo-options');
    
    const statsHTML = renderModalStats([
        { key: 'metal', icon: '🔩' },
        { key: 'uranium', icon: '☢️' }
    ]);
    
    container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="finishTorpedoBuild()">
            <div class="btn-left">
                <span class="btn-icon">🚀</span>
                <span class="btn-title">ТОРПЕДА</span>
            </div>
            <div class="btn-right" style="gap:5px;">
                <div class="res-badge">🔩<span class="res-val">10</span></div>
                <div class="res-badge">☢️<span class="res-val">5</span></div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

export function openAcademyModal(fr, fc, tr, tc, isT2) {
    gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc} };
    const modal = document.getElementById('academy-modal');
    const content = document.getElementById('academy-content');
    content.innerHTML = '';
    const statsHTML = renderModalStats([ { key: 'paper', icon: '📄' } ]);
    const statsDiv = document.createElement('div');
    statsDiv.innerHTML = statsHTML;
    content.appendChild(statsDiv);

    const stdUnits = [{t:'n', i:'♞', n:'КОНЬ'}, {t:'b', i:'♝', n:'СЛОН'}, {t:'r', i:'♜', n:'ЛАДЬЯ'}];
    
    const t1Group = document.createElement('div');
    t1Group.className = 'promo-options';
    t1Group.style.marginBottom = '15px';
    t1Group.innerHTML = `<div style="color:#aaa; font-size:0.8em; margin-bottom:5px;">TIER 1</div>`;
    
    stdUnits.forEach(u => {
        const btn = document.createElement('div'); 
        btn.className = 'promo-btn';
        btn.innerHTML = `
            <div class="btn-left">
                <span class="btn-icon">${u.i}</span>
                <span class="btn-title">${u.n}</span>
            </div>
            <div class="btn-right">
                <div class="res-badge">📄 <span class="res-val">2</span></div>
            </div>
        `;
        btn.onclick = () => finishAcademyRecruit(u.t, 2);
        t1Group.appendChild(btn);
    });
    content.appendChild(t1Group);

    if (isT2) {
        const t2Group = document.createElement('div');
        t2Group.className = 'promo-options';
        t2Group.innerHTML = `<div style="color:gold; font-size:0.8em; margin-bottom:5px;">TIER 2 (ЭЛИТА)</div>`;
        stdUnits.forEach(u => {
            const btn = document.createElement('div'); 
            btn.className = 'promo-btn gold-border';
            btn.innerHTML = `
                <div class="btn-left">
                    <span class="btn-icon" style="color:gold">${u.i}</span>
                    <span class="btn-title" style="color:gold">${u.n} II</span>
                </div>
                <div class="btn-right">
                    <div class="res-badge" style="border-color:gold; color:gold;">📄 <span class="res-val">5</span></div>
                </div>
            `;
            btn.onclick = () => finishAcademyRecruit(u.t + '_2', 5);
            t2Group.appendChild(btn);
        });
        content.appendChild(t2Group);
    }
    
    modal.classList.remove('hidden');
}

export function openProductionModal(type) {
    gameState.pendingInteraction.type = type; 
    const modal = document.getElementById('production-modal');
    const container = document.getElementById('prod-options');
    const title = document.getElementById('prod-title');
    container.innerHTML = '';

    if (type === 'jeweler') {
        title.innerText = "ЮВЕЛИРНАЯ";
        const statsHTML = renderModalStats([
            { key: 'gem', icon: '💎' },
            { key: 'mana_gem', icon: '🔮', isProduct: true }
        ]);

        container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="processProduction()">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div class="btn-left">
                    <span class="btn-title">СОЗДАТЬ</span>
                </div>
                <div class="btn-right">
                    <div class="res-badge">💎 <span class="res-val">2</span></div>
                    <span class="res-arrow">➔</span>
                    <div class="res-badge">🔮 <span class="res-val">1</span></div>
                </div>
            </div>
        </div>`;
    } 
    else if (type === 'papermill') {
        title.innerText = "ФАБРИКА БУМАГИ";
        const statsHTML = renderModalStats([
            { key: 'cedar', icon: '🍁' },
            { key: 'paper', icon: '📄', isProduct: true }
        ]);

        container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="processProduction()">
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div class="btn-left">
                    <span class="btn-title">ПЕРЕРАБОТКА</span>
                </div>
                <div class="btn-right">
                    <div class="res-badge">🍁 <span class="res-val">1</span></div>
                    <span class="res-arrow">➔</span>
                    <div class="res-badge">📄 <span class="res-val">1</span></div>
                </div>
            </div>
        </div>`;
    } 

    modal.classList.remove('hidden');
}

export function openMageTowerModal(fr, fc, tr, tc) {
    gameState.pendingInteraction = { from: {r:fr, c:fc}, target: {r:tr, c:tc} };
    const modal = document.getElementById('magetower-modal');
    
    let realModal = document.getElementById('magetower-modal');
    let container;
    
    if(!realModal) {
        realModal = document.getElementById('production-modal');
        document.getElementById('prod-title').innerText = "БАШНЯ МАГА";
        container = document.getElementById('prod-options');
    } else {
        container = document.getElementById('magetower-options');
    }
    
    const statsHTML = renderModalStats([
        { key: 'mana_gem', icon: '🔮' }
    ]);

    container.innerHTML = statsHTML + `
        <div class="promo-btn" onclick="activateMageTowerMode()">
            <div class="btn-left">
                <span class="btn-icon">⚡</span>
                <span class="btn-title">ЗАРЯДИТЬ</span>
            </div>
            <div class="btn-right">
                <div class="res-badge">🔮 <span class="res-val">1</span></div>
            </div>
        </div>
    `;

    realModal.classList.remove('hidden');
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
        btn.style.justifyContent = 'center'; 
        btn.innerHTML = `<span style="font-size:2em;">${opt.i}</span>`;
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
    
    // ИСПРАВЛЕНИЕ ЛОГИКИ ОПРЕДЕЛЕНИЯ КООРДИНАТ:
    const rangeR = gameState.myColor === 'b' ? [...Array(gameState.rows).keys()].reverse() : [...Array(gameState.rows).keys()];
    const r = rangeR[visualRow];
    
    return { r, c };
}