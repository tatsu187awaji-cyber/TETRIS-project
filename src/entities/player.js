import {
  COLUMNS,
  INITIAL_DROP_INTERVAL,
  LOCK_DELAY,
  createPiece,
  getPieceType,
} from "../core/constants.js";
import { collide } from "../core/logic.js"; //rotate のインポートは不要になったので削除
import { KICK_TABLES, PIECE_STATES } from "../core/kickTables.js";

// プレイヤーの状態を保持するオブジェクト
export const player = {
  pos: { x: 0, y: 0 },
  matrix: [],
  type: "",
  rotation: 0,
  lastAction: null,
};

// プレイヤーのミノを回転させ、壁との衝突を回避
export function playerRotate(arena, resetLockDelay, dir = 1) {
  // ❌ 古い `cloned` の作成と `rotate(cloned, dir)` は完全に削除！
  const currentRotation = player.rotation;
  const nextRotation = (currentRotation + dir + 4) % 4;

  // テーブルから「次のあるべき正確なミノの形」を取得
  const nextMatrix = PIECE_STATES[player.type]?.[nextRotation];
  if (!nextMatrix) return false; // 安全策

  // 検索キーを作成 (例: "0->1")
  const transitionKey = `${currentRotation}->${nextRotation}`;
  const kicks = KICK_TABLES[player.type]?.[transitionKey] || [[0, 0]];

  // キック位置のテスト
  for (const [dx, dy] of kicks) {
    const testPos = {
      x: player.pos.x + dx,
      y: player.pos.y + dy,
    };

    // 🌟 修正：cloned ではなく、テーブルから引いた正確な `nextMatrix` で判定する！
    if (!collide(arena, { pos: testPos, matrix: nextMatrix })) {
      // 🌟 修正：プレイヤーの matrix にも `nextMatrix` をそのまま代入する！
      player.matrix = nextMatrix;
      player.pos.x = testPos.x;
      player.pos.y = testPos.y;
      player.rotation = nextRotation;

      player.lastAction = "rotate";
      resetLockDelay();
      return true;
    }
  }
  return false;
}

// 新しいミノを生成し、ゲームをリセット
export function playerReset(arena, pieceBag, gameState) {
  const pieces = "IJLOSTZ"; // 通常の7種類のミノ（デバッグ用にXは除外）
  // const pieces = 'IJLOSTZX'; // デバッグ用にXブロックも追加

  const replenishBag = () => {
    if (pieceBag.length === 0) {
      const newBag = pieces.split("");
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }
      pieceBag.push(...newBag);
    }
    const rawType = pieceBag.shift(); // バッグから出てきた本来の種類
    const type = getPieceType(rawType); // デバッグ強制があればそちらを優先
    return {
      type: type,
      matrix: createPiece(type),
    };
  };

  while (gameState.nextPieces.length < 3) {
    gameState.nextPieces.push(replenishBag());
  }

  const nextPiece = gameState.nextPieces.shift();
  player.type = nextPiece.type;
  player.matrix = nextPiece.matrix;
  player.rotation = 0;

  gameState.nextPieces.push(replenishBag());

  player.pos.y = 0;
  let targetX = gameState.mouseCol - ((player.matrix[0].length / 2) | 0);
  console.log("mouseCol:", gameState.mouseCol, "targetX:", targetX);

  const minX = 0;
  const maxX = arena[0].length - player.matrix[0].length;
  player.pos.x = Math.max(minX, Math.min(targetX, maxX));

  // 衝突判定を行い、衝突している場合はゲームオーバー
  if (collide(arena, player)) {
    console.log("ゲームオーバー判定 pos:", player.pos.x, player.pos.y);
    console.log("arena状態:", arena.map((row) => row.join("")).join("\n"));
    return true;
  }

  gameState.canHold = true;
  player.lastAction = null;
  return false;
}

/* 新規追加：マウスの現在列に向かって、衝突しない範囲で安全にミノを引き寄せる */
export function playerMove(arena, dir, resetLockDelay, autoRotate = false) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;

    // 障害物にぶつかったとき、自動回転を試みる
    if (autoRotate) {
      playerRotate(arena, resetLockDelay, dir);
    }
  } else {
    resetLockDelay();
    player.lastAction = "move";
  }
}
/* 新規追加：マウスの現在列に向かって、衝突しない範囲で安全にミノを引き寄せる */
export function playerMoveToMouse(
  arena,
  gameState,
  resetLockDelay,
  autoRotate = false,
) {
  let targetX = gameState.mouseCol - ((player.matrix[0].length / 2) | 0);
  let maxIterations = 20; // 無限ループ防止のための安全策
  while (player.pos.x < targetX) {
    player.pos.x++;
    if (collide(arena, player)) {
      player.pos.x--;
      if (autoRotate && playerRotate(arena, resetLockDelay, 1)) {
        targetX = gameState.mouseCol - ((player.matrix[0].length / 2) | 0);
        continue;
      }
      break;
    }
    resetLockDelay();
    player.lastAction = "move";
  }

  while (player.pos.x > targetX) {
    player.pos.x--;
    if (collide(arena, player)) {
      player.pos.x++;
      if (autoRotate && playerRotate(arena, resetLockDelay, -1)) {
        targetX = gameState.mouseCol - ((player.matrix[0].length / 2) | 0);
        continue;
      }
      break;
    }
    resetLockDelay();
    player.lastAction = "move";
  }
}
