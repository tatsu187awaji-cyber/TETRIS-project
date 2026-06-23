// actions.js
import { collide, getTSpinType } from '../core/logic.js';
import { createPiece, getPieceType, COLUMNS, ROWS, SCORES } from '../core/constants.js';
import { merge, arenaSweep, applyLevelUp } from '../core/engine.js';
import { player, playerReset } from '../entities/player.js';
import { triggerShake } from '../effects/shakeEffect.js';
import { triggerFlash, triggerPlacementFlash} from '../effects/flashEffect.js';

function spawnParticles(gameState, linesCleared, tSpinType, arenaY, isB2B = false) {
    // 基本の発生個数
    let count = tSpinType ? 40 : linesCleared === 4 ? 60 : 20 * linesCleared;

    // 特殊消去（Tスピンやテトリス）なら、レベルに応じてさらに個数にボーナス
    if (tSpinType || linesCleared === 4) {
        count += (gameState.level - 1) * 5;
    }
    // ★B2B継続中なら、さらにお祝いとして白（シルバー）のパーティクルを30個増量
    if (isB2B) {
        count += 30;
    }
    // 色の設定
    const mainColor = tSpinType === 'full' ? '#ff4400'
        : tSpinType === 'mini' ? '#ffaa00'
            : linesCleared === 4 ? '#00eeff'
                : '#ffffff';

    for (let i = 0; i < count; i++) {
        // ★ご褒美演出3: レベルに応じてパーティクルの「最大サイズ」が成長する
        // レベル1なら等倍、レベル5なら最大約1.4倍の大きさに
        const levelSizeMultiplier = 1 + (gameState.level - 1) * 0.1;
        const baseSize = 0.15 + Math.random() * 0.15;

        // B2B継続中で、なおかつ後半のループ（増量した分などランダム）であれば、
        // 指定した色にすり替える
        let particleColor = mainColor;
        if (isB2B && Math.random() > 0.4) {
            particleColor = Math.random() > 0.5 ? '#67f5ff' : '#e9e10a';
        }
        gameState.particles.push({
            x: Math.random() * 12, // ※お使いの座標系（10マス分など）に合わせてください
            y: arenaY,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.1,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            color: particleColor,
            size: baseSize * levelSizeMultiplier // レベルによるサイズ補正
        });
    }
}

function applyScore(gameState, lines, tSpinType) {
    const lv = gameState.level;

    if (tSpinType === 'full') {
        if (lines === 0) gameState.score += 400 * lv;
        else if (lines === 1) gameState.score += 800 * lv;
        else if (lines === 2) gameState.score += 1200 * lv;
        else if (lines === 3) gameState.score += 1600 * lv;
        return;
    }
    if (tSpinType === 'mini') {
        if (lines === 0) gameState.score += 100 * lv;
        else if (lines === 1) gameState.score += 200 * lv;
        else gameState.score += 100 * lv;
        return;
    }
    if (lines === 1) gameState.score += 100 * lv;
    else if (lines === 2) gameState.score += 300 * lv;
    else if (lines === 3) gameState.score += 500 * lv;
    else if (lines === 4) gameState.score += 800 * lv;
}

function getBaseScore(lines, tSpinType, level = 1) {
    const lv = level;

    if (tSpinType === 'full') {
        return ([400, 800, 1200, 1600][lines] ?? 0) * lv;
    }
    if (tSpinType === 'mini') {
        return lines === 0 ? 100 * lv : lines === 1 ? 200 * lv : 100 * lv;
    }
    return ([0, 100, 300, 500, 800][lines] ?? 0) * lv;
}

function applyPostClear(arena, gameState, linesCleared, tSpinType) {
    const isSpecial = linesCleared === 4 || (tSpinType && linesCleared >= 0 && tSpinType === 'full') || (tSpinType === 'mini' && linesCleared > 0);
    const wasB2B = gameState.b2b;
    // ★B2B継続が確定したかどうかのフラグ
    const isB2BContinuous = isSpecial && wasB2B;

    if (isSpecial) {
        if (wasB2B) {
            const base = getBaseScore(linesCleared, tSpinType, gameState.level);
            const b2bBonus = Math.floor(base * 0.5);
            gameState.score += b2bBonus;
            // B2Bが継続したらカウントアップ！
            gameState.b2bCount++;
            console.log(`🔥 B2B! ボーナス+${b2bBonus}`);
        }
        else {
            // 初回のB2B始動時は1にする
            gameState.b2bCount = 1;
        }
        gameState.b2b = true;
        console.log('✅ B2B継続中');
    } else if (linesCleared > 0) {
        gameState.b2b = false;
        //普通の消去を挟んだらB2Bカウントをリセット！
        gameState.b2bCount = 0;
        console.log('❌ B2B切れ（普通の消去）');
    }

    // REN処理
    if (linesCleared > 0) {
        const renBonus = gameState.combo * 50;
        if (renBonus > 0) gameState.score += renBonus;
        gameState.combo++;
    } else {
        gameState.combo = 0;
    }

    // Perfect Clear判定
    const isPerfectClear = linesCleared > 0 && arena.every(row => row.every(cell => cell === 0));

    // フラッシュメッセージ
    if (!gameState.flashMessage || !gameState.flashMessage.text.includes('LEVEL UP')) {
        if (isPerfectClear) {
            gameState.score += 3000;
            gameState.flashMessage = { text: 'PERFECT CLEAR!', timer: 180, color: '#ffffff' };
            spawnParticles(gameState, 4, null, ROWS / 4);
            spawnParticles(gameState, 4, null, ROWS / 2);
            spawnParticles(gameState, 4, null, ROWS * 3 / 4);
        } else if (tSpinType === 'full') {
            gameState.flashMessage = { text: wasB2B && isSpecial ? 'B2B T-SPIN!' : 'T-SPIN', timer: 120, color: '#ff4400' };
        } else if (tSpinType === 'mini') {
            gameState.flashMessage = { text: 'MINI T-SPIN', timer: 120, color: '#ffaa00' };
        } else if (linesCleared === 4) {
            gameState.flashMessage = { text: wasB2B && isSpecial ? 'B2B TETRIS!' : 'TETRIS!', timer: 120, color: '#00eeff' };
        } else if (gameState.combo > 1) {
            gameState.flashMessage = { text: `${gameState.combo} REN!`, timer: 120, color: '#ffff00' };
        }
    }
    // パーティクル
    if (!isPerfectClear && (linesCleared > 0 || tSpinType)) {
        spawnParticles(gameState, linesCleared, tSpinType, ROWS / 2, isB2BContinuous);
    }

}


export function handlePlayerDrop(arena, gameState, pieceBag, updateScore, isManual = false) {
    player.pos.y++;

    if (collide(arena, player)) {
        player.pos.y--;

        const tSpinType = getTSpinType(player, arena);
        if (tSpinType === 'full') console.log('🔥 T-SPIN!');
        if (tSpinType === 'mini') console.log('✨ MINI T-SPIN');

        triggerPlacementFlash(gameState, player);
        merge(arena, player);

        const linesCleared = arenaSweep(arena);
        // ★ご褒美演出2: ライン消去のあった行を光らせるエフェクトを発動
        if (linesCleared > 0) {
            triggerFlash(gameState);
        }
        applyScore(gameState, linesCleared, tSpinType);
        applyLevelUp(gameState, linesCleared);
        applyPostClear(arena, gameState, linesCleared, tSpinType);
        triggerShake(gameState, linesCleared);

        playerReset(arena, pieceBag, gameState);
        updateScore();
        return true;
    }

    if (isManual) {
        gameState.score += SCORES.SOFT_DROP;
        updateScore();
    }

    return false;
}

export function handleHardDrop(arena, gameState, pieceBag, updateScore) {
    const originalY = player.pos.y;

    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;

    const droppedDistance = player.pos.y - originalY;
    if (droppedDistance > 0) {
        gameState.score += droppedDistance * SCORES.HARD_DROP_PER_STEP;
    }

    const tSpinType = getTSpinType(player, arena);
    if (tSpinType === 'full') console.log('🔥 T-SPIN!');
    if (tSpinType === 'mini') console.log('✨ MINI T-SPIN');

    triggerPlacementFlash(gameState, player);
    merge(arena, player);

    const linesCleared = arenaSweep(arena);
    // ★ご褒美演出2: ライン消去のあった行を光らせるエフェクトを発動
    if (linesCleared > 0) {
            triggerFlash(gameState);
        }
    applyScore(gameState, linesCleared, tSpinType);
    applyLevelUp(gameState, linesCleared);
    applyPostClear(arena, gameState, linesCleared, tSpinType);
    triggerShake(gameState, linesCleared);

    playerReset(arena, pieceBag, gameState);
    player.lastAction = null;
    updateScore();
}

export function handleHold(arena, gameState, pieceBag) {
    if (!gameState.canHold) return;

    const currentType = player.type;

    if (!gameState.holdType) {
        gameState.holdType = currentType;
        playerReset(arena, pieceBag, gameState);
    } else {
        const temp = gameState.holdType;
        gameState.holdType = currentType;
        player.type = temp;
        player.matrix = createPiece(player.type);
        player.rotation = 0; // ← 追加：回転状態をリセット
        player.pos.y = 0;
        player.pos.x = ((COLUMNS / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    }

    gameState.canHold = false;
}