// src/systems/controller.js
import { COLUMNS } from '../core/constants.js';
export function setupControls({
    onMove, onRotate, onRotateCCW, onDrop, onHardDrop,
     onHold, onPause, onTitle, onReset,
     onMoveContinuous, onMouseMove, gameState
}) {
    // --- 1. キーボード操作 ---
    document.addEventListener('keydown', e => {
        switch (e.key) {
            case 'ArrowLeft': onMove(-1); break;
            case 'ArrowRight': onMove(1); break;
            case 'ArrowDown': onDrop(); break;
            case 'ArrowUp': onRotate(); break;
            case 'w':
            case 'W': onRotateCCW(); break;
            case ' ': onHardDrop(); break;
            case 'c':
            case 'C': onHold(); break;
            case 'p':
            case 'P': onPause(); break;
        }
    });

    // --- 2. ボタン系 ---
    document.getElementById('pauseButton').addEventListener('click', onPause);
    document.getElementById('moveRotate').addEventListener('click', onRotate);
    document.getElementById('holdButton').addEventListener('click', onHold);

    const bindContinuous = (id, action, delay) => {
        const el = document.getElementById(id);
        if (!el) return; // 要素がない場合の安全策
        let interval = null;
        const start = () => { if (!interval) interval = setInterval(action, delay); action(); };
        const stop = () => { clearInterval(interval); interval = null; };
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', stop);
        el.addEventListener('mouseleave', stop);
    };

    bindContinuous('moveLeft', () => onMove(-1), 100);
    bindContinuous('moveRight', () => onMove(1), 100);
    bindContinuous('moveDown', () => { onDrop(); onMoveContinuous(10); }, 50);

    // src/systems/controller.js のマウス移動部分

    // --- 3. マウス操作 (Canvas) ---
    const gameCanvas = document.getElementById('game');

    // 左クリックで回転（ここはそのまま）
    gameCanvas.addEventListener('mousedown', e => {
        if (e.button === 0) {
            onRotate();
        }
    });

    // 右クリックメニュー禁止（ここはそのまま）
    gameCanvas.addEventListener('contextmenu', e => e.preventDefault());

    // 🌟 変更：マウス移動（これだけでOKになります！）
    gameCanvas.addEventListener('mousemove', e => {
        const mouseX = e.offsetX;
        const currentCol = Math.floor(mouseX / 20);

        // 常に現在のマウス列を gameState に保存（これに基づいて main.js 側が安全に引き寄せます）
        gameState.mouseCol = currentCol;
        onMouseMove();
    });

    // マウスが外れたらリセット（ここはそのまま）
    gameCanvas.addEventListener('mouseleave', () => {
        gameState.mouseCol = Math.floor(COLUMNS / 2);
    });

    // --- 4. TITLEボタン・RESETボタン ---
    document.getElementById('titleButton').addEventListener('click', () => {
        onTitle?.();
    });
    document.getElementById('resetButton').addEventListener('click', () => {
        onReset?.();
    });
}