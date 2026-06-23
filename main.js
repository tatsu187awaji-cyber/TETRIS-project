import { ROWS, COLUMNS, colors, INITIAL_DROP_INTERVAL, createPiece } from './src/core/constants.js';
import { createMatrix, collide } from './src/core/logic.js';
import { renderScene } from './src/view/render.js';
import { player, playerMove, playerReset, playerRotate, playerMoveToMouse } from './src/entities/player.js';
import { getGhostPosition } from './src/core/engine.js';
import { initCanvas, updateScoreElement, updatePauseButton } from './src/view/ui.js';
import { setupControls } from './src/systems/controller.js';
import { handlePlayerDrop, handleHardDrop, handleHold } from './src/systems/actions.js';
import { spawnB2BAura } from './src/effects/b2bEffect.js';

// --- 1. 初期化 (Contexts) ---
const { canvas, context } = initCanvas('game');
const { canvas: holdCanvas, context: holdCtx } = initCanvas('hold');
// NEXT用のCanvasを3つ取得
const nextCanvases = [
    initCanvas('next-1'),
    initCanvas('next-2'),
    initCanvas('next-3')
];

// Contextsをまとめておく（nextCtxsとして配列で持つ）
const ctxs = {
    context,
    holdCtx,
    nextCtxs: nextCanvases.map(c => c.context)
};

// --- 2. ゲームの状態管理 ---
const gameState = {
    score: 0, level: 1, lineCount: 0,
    dropInterval: INITIAL_DROP_INTERVAL,
    nextPieces: [],
    holdType: null, canHold: true,
    mouseCol: 5,
    particles: [],
    flashMessage: null,
    combo: 0,
    b2b: false,
    b2bCount: 0,
};

const arena = createMatrix(COLUMNS, ROWS);
const pieceBag = [];
let isPaused = true;       // 最初はポーズ（待機）状態にしておく
let gameStarted = false;   // スタートボタンが押されたかどうかのフラグ
let lastTime = 0;
let dropCounter = 0;

// ヘルパー
const updateScore = () => updateScoreElement(gameState);
const resetLock = () => { };

// --- 3. コントローラー設定 ---
setupControls({
    onMove: (dir) => !isPaused && playerMove(arena, dir, resetLock),
    onRotate: () => !isPaused && playerRotate(arena, resetLock),
    onRotateCCW: () => playerRotate(arena, resetLock, -1),
    onDrop: () => {
        if (!isPaused) {
            // 第5引数に true を渡して「手動落下」であることを伝える
            handlePlayerDrop(arena, gameState, pieceBag, updateScore, true);
        }
    },
    onHardDrop: () => !isPaused && handleHardDrop(arena, gameState, pieceBag, updateScore),
    onHold: () => !isPaused && handleHold(arena, gameState, pieceBag),
    onPause: () => {
        // 💡 ★ゲームがまだ始まっていないなら、ポーズボタンを効かせない
        if (!gameStarted) return;
        isPaused = !isPaused;
        // UIモジュールの関数を呼んでボタンの見た目を変える
        updatePauseButton(isPaused, document.getElementById('pauseButton'));

        if (!isPaused) {
            // ポーズ解除時に、停止していた時間をリセットしてループを再開
            lastTime = performance.now();
            update();
        }
    },
    onTitle: () => {
        isPaused = true;
        gameStarted = false; // ← ゲーム未開始状態に戻す
        updatePauseButton(isPaused, document.getElementById('pauseButton'));

        const startScreen = document.getElementById('startScreen');
        startScreen.classList.remove('hidden'); // ← style.display ではなくクラスを外す
    },
    onReset: () => {
        // 盤面と gameState をリセット
        arena.forEach(row => row.fill(0));
        gameState.score = 0;
        gameState.level = 1;
        gameState.lineCount = 0;
        gameState.dropInterval = INITIAL_DROP_INTERVAL;
        gameState.nextPieces = [];
        gameState.holdType = null;
        gameState.canHold = true;
        gameState.particles = [];
        gameState.flashMessage = null;
        gameState.combo = 0;
        gameState.b2b = false;
        gameState.b2bCount = 0;
        gameState.shake = null;
        gameState.flashEffect = null;
        pieceBag.length = 0; // バッグも空に
        playerReset(arena, pieceBag, gameState);
        updateScore();

        // ポーズ中だった場合はゲームを再開
        if (isPaused) {
            isPaused = false;
            updatePauseButton(false, document.getElementById('pauseButton'));
            lastTime = performance.now();
            update();
        }
    },
    onMouseMove: (dir) => !isPaused && playerMoveToMouse(arena, gameState, resetLock, true),
    onMoveContinuous: (val) => {
        // 長押し移動時のスコア加算も、定数化したいならSCORES.SOFT_DROP等を使う
        gameState.score += val;
        updateScore();
    },
    gameState: gameState

});

// --- 4. 描画の実行 (司令塔の仕事) ---
function draw() {
    // 描画に必要なデータをひとまとめにする
    const renderData = {
        arena,
        player,
        ghostPos: getGhostPosition(arena, player, collide),
        gameState,
        colors,
        ROWS,
        COLUMNS,
        createPiece, // render.js側でミノの形状を作る場合
        holdCanvas,
        nextCanvases: nextCanvases.map(c => c.canvas)
    };

    // 実際の描画は render.js のプロに任せる
    renderScene(ctxs, renderData);
}

// --- 5. メインループ ---
function update(time = 0) {
    if (isPaused) return;

    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;

    if (dropCounter > gameState.dropInterval) {
        handlePlayerDrop(arena, gameState, pieceBag, updateScore);
        dropCounter = 0;
    }
    spawnB2BAura(gameState);

    // パーティクルの状態を更新（もし main.js 側で update する設計ならここに追記、
    // あるいは renderScene 内で自動で動いているなら不要です。環境に合わせて調整してください）
    // if (typeof particleSystem !== 'undefined') {
    //     particleSystem.update();
    // }

    draw(); // 内部で renderScene が呼ばれる
    requestAnimationFrame(update);
}
// --- 6. スタートボタンの処理 ---
document.getElementById('startButton').addEventListener('click', () => {
    // 1. ホーム画面に .hidden クラスをつけてフェードアウトさせる
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.classList.add('hidden');
    }

    // 2. フラグを更新してゲーム開始    
    gameStarted = true;
    isPaused = false; // ポーズを解除して動かせるようにする
    lastTime = performance.now(); // タイマーの基準時間をリセット
    update(); // ゲームループ始動！
    console.count("update");
});
// ゲーム開始
playerReset(arena, pieceBag, gameState);