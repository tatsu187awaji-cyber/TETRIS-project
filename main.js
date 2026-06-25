import {
  ROWS,
  COLUMNS,
  colors,
  INITIAL_DROP_INTERVAL,
  createPiece,
} from "./src/core/constants.js";
import { createMatrix, collide } from "./src/core/logic.js";
import { renderScene } from "./src/view/render.js";
import {
  player,
  playerMove,
  playerReset,
  playerRotate,
  playerMoveToMouse,
} from "./src/entities/player.js";
import { getGhostPosition } from "./src/core/engine.js";
import {
  initCanvas,
  updateScoreElement,
  updatePauseButton,
} from "./src/view/ui.js";
import { setupControls } from "./src/systems/controller.js";
import {
  handlePlayerDrop,
  handleHardDrop,
  handleHold,
} from "./src/systems/actions.js";
import { spawnB2BAura } from "./src/effects/b2bEffect.js";

// --- 1. 初期化 (Contexts) ---
const { canvas, context } = initCanvas("game");
const { canvas: holdCanvas, context: holdCtx } = initCanvas("hold");
// NEXT用のCanvasを3つ取得
const nextCanvases = [
  initCanvas("next-1"),
  initCanvas("next-2"),
  initCanvas("next-3"),
];

// Contextsをまとめておく（nextCtxsとして配列で持つ）
const ctxs = {
  context,
  holdCtx,
  nextCtxs: nextCanvases.map((c) => c.context),
};

// --- 2. ゲームの状態管理 ---
const gameState = {
  score: 0,
  level: 1,
  lineCount: 0,
  dropInterval: INITIAL_DROP_INTERVAL,
  nextPieces: [],
  holdType: null,
  canHold: true,
  mouseCol: 5,
  particles: [],
  flashMessage: null,
  combo: 0,
  b2b: false,
  b2bCount: 0,
};

const arena = createMatrix(COLUMNS, ROWS);
const pieceBag = [];
let isPaused = true; // 最初はポーズ（待機）状態にしておく
let gameStarted = false; // スタートボタンが押されたかどうかのフラグ
let lastTime = 0;
let dropCounter = 0;
let animationId = null;

// ヘルパー
const updateScore = () => updateScoreElement(gameState);
const resetLock = () => {};

// --- スコア保存・読み込み ---
function saveScore(score) {
  const scores = JSON.parse(localStorage.getItem("tetrisScores") || "[]");
  scores.push({ score, date: new Date().toLocaleDateString("ja-JP") });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("tetrisScores", JSON.stringify(scores.slice(0, 10)));
}

// --- 3. ゲームオーバー表示 ---
function showGameOver() {
  isPaused = true;
  gameStarted = false;

  saveScore(gameState.score);

  document.getElementById("finalScore").textContent = gameState.score;

  const scores = JSON.parse(localStorage.getItem("tetrisScores") || "[]");
  document.getElementById("scoreList").innerHTML = scores
    .map(
      (s, i) =>
        `<li style="${i === 0 ? "color:#FFD700;font-weight:bold;" : ""}">${s.score}点　${s.date}</li>`,
    )
    .join("");

  document.getElementById("scoreBoard").style.display = "block";
}

// --- 4. コントローラー設定 ---
setupControls({
  onMove: (dir) => !isPaused && playerMove(arena, dir, resetLock),
  onRotate: () => !isPaused && playerRotate(arena, resetLock),
  onRotateCCW: () => playerRotate(arena, resetLock, -1),
  onDrop: () => {
    if (!isPaused) {
      const isGameOver = handlePlayerDrop(
        arena,
        gameState,
        pieceBag,
        updateScore,
        true,
      );
      if (isGameOver) showGameOver();
    }
  },
  onHardDrop: () => {
    if (!isPaused) {
      const isGameOver = handleHardDrop(
        arena,
        gameState,
        pieceBag,
        updateScore,
      );
      if (isGameOver) showGameOver();
    }
  },
  onHold: () => !isPaused && handleHold(arena, gameState, pieceBag),
  onPause: () => {
    if (!gameStarted) return;
    isPaused = !isPaused;
    updatePauseButton(isPaused, document.getElementById("pauseButton"));

    if (!isPaused) {
      startLoop();
    }
  },
  onTitle: () => {
    if (!gameStarted) return;
    isPaused = true;
    updatePauseButton(isPaused, document.getElementById("pauseButton"));

    const startScreen = document.getElementById("startScreen");
    startScreen.classList.remove("hidden");
  },
  onReset: () => {
    // 盤面と gameState をリセット
    arena.forEach((row) => row.fill(0));
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
    pieceBag.length = 0;
    playerReset(arena, pieceBag, gameState);
    updateScore();

    // ポーズ中だった場合はゲームを再開
    if (isPaused) {
      isPaused = false;
      updatePauseButton(false, document.getElementById("pauseButton"));
      lastTime = performance.now();
      startLoop();
    }
  },
  onMouseMove: (dir) =>
    !isPaused && playerMoveToMouse(arena, gameState, resetLock, true),
  onMoveContinuous: (val) => {
    gameState.score += val;
    updateScore();
  },
  gameState: gameState,
});

// --- 5. 描画の実行 (司令塔の仕事) ---
function draw() {
  const renderData = {
    arena,
    player,
    ghostPos: getGhostPosition(arena, player, collide),
    gameState,
    colors,
    ROWS,
    COLUMNS,
    createPiece,
    holdCanvas,
    nextCanvases: nextCanvases.map((c) => c.canvas),
  };

  renderScene(ctxs, renderData);
}

// --- 6. メインループ ---

function startLoop() {
  if (animationId) cancelAnimationFrame(animationId); // 既存ループをキャンセル
  lastTime = performance.now();
  animationId = requestAnimationFrame(update);
}

function update(time = 0) {
  if (isPaused) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (dropCounter > gameState.dropInterval) {
    const isGameOver = handlePlayerDrop(
      arena,
      gameState,
      pieceBag,
      updateScore,
    );
    dropCounter = 0;
    if (isGameOver) {
      showGameOver();
      return;
    }
  }
  spawnB2BAura(gameState);

  draw();
  animationId = requestAnimationFrame(update);
}

// --- 7. スタートボタンの処理 ---
document.getElementById("startButton").addEventListener("click", () => {
  // 1. ホーム画面に .hidden クラスをつけてフェードアウトさせる
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.classList.add("hidden");
  }

  document.getElementById("scoreBoard").style.display = "none";
  // PAUSEボタンをリセット
  document.getElementById("pauseButton").textContent = "PAUSE";

  // ゲーム中断からの復帰なら盤面リセットしない
  if (gameStarted) {
    isPaused = false;
    startLoop();
    return;
  }

  // 2. 盤面をリセット
  arena.forEach((row) => row.fill(0));
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
  pieceBag.length = 0;
  playerReset(arena, pieceBag, gameState);
  updateScore();

  // 3. フラグを更新してゲーム開始
  gameStarted = true;
  isPaused = false;
  startLoop();
});

// Enterキーでスタートボタンを押せるようにする
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const startScreen = document.getElementById("startScreen");
    if (startScreen && !startScreen.classList.contains("hidden")) {
      document.getElementById("startButton").click();
    }
  }
});

// --- 8. リトライ・タイトルボタンの処理 ---
document.getElementById("retryButton").addEventListener("click", () => {
  document.getElementById("scoreBoard").style.display = "none";
  document.getElementById("resetButton").click(); // 既存のRESET処理をそのまま使う
});

document.getElementById("titleFromScore").addEventListener("click", () => {
  document.getElementById("scoreBoard").style.display = "none";
  document.getElementById("titleButton").click(); // 既存のTITLE処理をそのまま使う
});
