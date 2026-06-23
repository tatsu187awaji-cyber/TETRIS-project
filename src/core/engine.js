//engine.js
//テトリスのルールについて
// --- ゲームのコアロジック関数 ---
// --- プレイヤーのミノをアリーナ（ゲームボード）に固定する ---
import { INITIAL_DROP_INTERVAL , COLUMNS} from '../core/constants.js';
export function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) arena[y + player.pos.y][x + player.pos.x] = player.type;
        });
    });
}

export function arenaSweep(arena) {
    let linesCleared = 0;

    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        linesCleared++;
    }

    return linesCleared;
}


// --- ミノの着地点を計算する ---
export function getGhostPosition(arena, player, collide) {
    const ghostPlayer = {
        pos: { x: player.pos.x, y: player.pos.y },
        matrix: player.matrix,
    };

    while (!collide(arena, ghostPlayer)) {
        ghostPlayer.pos.y++;
    }
    ghostPlayer.pos.y--;

    return ghostPlayer.pos;
}

// --- レベルアップの処理 ---
export function applyLevelUp(gameState, linesCleared) {
    gameState.lineCount += linesCleared;
    const newLevel = Math.floor(gameState.lineCount / 10) + 1;

    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.dropInterval = Math.max(100, INITIAL_DROP_INTERVAL - (gameState.level - 1) * 100);

        // --- 🎉 ご褒美演出1: レベルアップ専用フラッシュメッセージ ---
        gameState.flashMessage = {
            text: `LEVEL UP: LV.${gameState.level}!!`,
            timer: 180,
            color: '#ffeb3b' // 輝くゴールドイエロー
        };

        // --- 🎉 ご褒美演出2: 画面全体に降り注ぐ虹色のセレブレーション・パーティクル ---
        // 1マス（1ブロック）あたりのサイズを考慮し、画面の横幅全体に散らします
        for (let i = 0; i < 120; i++) {
            // HSL色空間を使って、0〜360度の鮮やかな虹色をランダムに生成
            const hue = Math.random() * 360;

            gameState.particles.push({
                x: Math.random() * COLUMNS, // 0 から COLUMNS(12マス分) の間にランダム配置
                y: -1,                      // 画面の一番上（場外）から降らせる
                vx: (Math.random() - 0.5) * 0.4,  // 左右に少し揺れる
                vy: Math.random() * 0.2 + 0.1,    // ゆっくり下に落ちていく速度
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01, // 画面下部まで長く残るように寿命は長め
                color: `hsl(${hue}, 100%, 60%)`,
                size: 0.15 + Math.random() * 0.15
            });
        }

        console.log(`LEVEL UP!: ${gameState.level} (落下速度: ${gameState.dropInterval}ms)`);
    }
}