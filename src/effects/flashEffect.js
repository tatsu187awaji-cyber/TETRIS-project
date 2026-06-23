// ../effects/flashEffect.js

/**
 * ライン消去後の全体フラッシュ
 */
export function triggerFlash(gameState) {
    gameState.flashEffect = {
        type: 'clear',  // ← 種類を追加
        timer: 8,
        maxTimer: 8
    };
}

/**
 * ミノ設置時のフラッシュ（設置したブロックだけ光らせる）
 * @param {Object} gameState
 * @param {Object} player - 設置直前の player（pos と matrix を参照）
 */
export function triggerPlacementFlash(gameState, player) {
    // 設置したブロックの座標リストを作成
    const cells = [];
    player.matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) {
                cells.push({
                    x: x + player.pos.x,
                    y: y + player.pos.y
                });
            }
        });
    });

    gameState.flashEffect = {
        type: 'placement',  // 種類
        timer: 30,
        maxTimer: 30,
        cells              // 光らせる座標リスト
    };
}