// src/effects/shakeEffect.js

// ライン消去数に応じたシェイクの強さと持続時間の設定
const SHAKE_LEVELS = {
    1: { intensity: 0.08, duration: 8 },
    2: { intensity: 0.14, duration: 10 },
    3: { intensity: 0.22, duration: 14 },
    4: { intensity: 0.35, duration: 20 } // テトリス！一番激しく
};

/**
 * ライン消去数に応じてシェイクを発生させる
 * @param {Object} gameState
 * @param {number} linesCleared - 1〜4
 */
export function triggerShake(gameState, linesCleared) {
    const level = SHAKE_LEVELS[linesCleared];
    if (!level) return; // 0ラインなら何もしない

    // 既存のシェイクより強い場合のみ上書き（弱い揺れで上書きされないように）
    if (!gameState.shake || level.intensity >= gameState.shake.intensity) {
        gameState.shake = {
            intensity: level.intensity,
            duration: level.duration,
            timer: level.duration
        };
    }
}

/**
 * 現在のシェイクオフセットを計算し、タイマーを進める
 * @param {Object} gameState
 * @returns {{x: number, y: number}} 描画時に加えるオフセット
 */
export function updateShake(gameState) {
    if (!gameState.shake || gameState.shake.timer <= 0) {
        gameState.shake = null;
        return { x: 0, y: 0 };
    }

    const { intensity, timer, duration } = gameState.shake;

    // 時間が経つほど揺れを小さくする（減衰）
    const progress = timer / duration;
    const currentIntensity = intensity * progress;

    const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
    const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

    gameState.shake.timer--;
    if (gameState.shake.timer <= 0) {
        gameState.shake = null;
    }

    return { x: offsetX, y: offsetY };
}