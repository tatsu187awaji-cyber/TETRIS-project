// ui.js
export function updateScoreElement(gameState) {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}

export function initCanvas(id, scale = 20) {
    const canvas = document.getElementById(id) || document.querySelector(`.${id}`);
    const context = canvas.getContext('2d');
    context.scale(scale, scale);
    return { canvas, context };
}

export function updatePauseButton(isPaused, buttonElement) {
    buttonElement.textContent = isPaused ? 'RESTART' : 'PAUSE';
}