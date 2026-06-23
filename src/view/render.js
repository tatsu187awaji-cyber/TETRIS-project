// --- 描画関連の関数をまとめたモジュール ---
import { updateShake } from '../effects/shakeEffect.js';
// --- 描画関数群 ---
// 指定された行列とオフセットで描画

export function drawArena(context, arena, colors) {
    arena.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x, y, 1, 1);

                // ブロックの枠線
                context.strokeStyle = '#000';
                context.lineWidth = 0.05;
                context.strokeRect(x, y, 1, 1);
            }
        });
    });
}
export function renderScene(ctxs, data) {
    const { context, holdCtx, nextCtxs } = ctxs;
    const {
        arena, player, ghostPos, gameState,
        colors, ROWS, COLUMNS, createPiece, holdCanvas, nextCanvases
    } = data;

    // --- シェイク開始 ---
    const shakeOffset = updateShake(gameState);
    context.save();
    context.translate(shakeOffset.x, shakeOffset.y);

    // 1. メインキャンバスのリセットと描画
    context.fillStyle = '#111';
    // シェイクで隙間が見えないよう少し広めに塗る
    context.fillRect(-1, -1, context.canvas.width + 2, context.canvas.height + 2);

    drawArena(context, arena, colors);
    drawMatrix(player.matrix, ghostPos, context, colors[player.type] + '40');
    drawMatrix(player.matrix, player.pos, context, colors[player.type]);
    drawGrid(context, ROWS, COLUMNS);

    // ★ご褒美演出2: ライン消去のあった行を光らせるエフェクトの描画
    if (gameState.flashEffect && gameState.flashEffect.timer > 0) {
        // 残りフレーム数に応じてだんだん薄くする（不透明度 alpha の計算）
        const { type, timer, maxTimer, cells } = gameState.flashEffect;
        const alpha = timer / maxTimer;

        // パッと白く光らせる設定（好みに合わせて 0.8 を 1.0 にするともっと眩しくなる）
        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;

        if (type === 'clear') {
            // 盤面（arena）をループして、ブロックが残っている場所だけを白く塗りつぶす
            arena.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        context.fillRect(x, y, 1, 1);
                    }
                });
            });
        } else if (type === 'placement' && cells) {
            // ミノ設置時：設置したブロックだけ光らせる
            cells.forEach(({ x, y }) => {
                context.fillRect(x, y, 1, 1);
            });
        }

        // 毎フレームタイマーを1ずつ減らす
        gameState.flashEffect.timer--;
    }
    // パーティクルの更新と描画
    updateAndDrawParticles(context, gameState.particles);
    drawFlashMessage(context, gameState, COLUMNS, ROWS);

    // --- シェイク終了 ---
    context.restore();

    // 2. UI（HOLD/NEXT）の描画 ※シェイクの影響を受けないようtranslateの外側に
    drawHold(holdCtx, holdCanvas, gameState.holdType, createPiece, colors);
    if (gameState.nextPieces && nextCtxs && nextCanvases) {
        gameState.nextPieces.forEach((piece, index) => {
            const ctx = nextCtxs[index];
            const canvas = nextCanvases[index];
            if (ctx && canvas) {
                drawNext(ctx, canvas, piece.matrix, piece.type, colors);
            }
        });
    }
}
export function drawFlashMessage(ctx, gameState, COLUMNS, ROWS) {
    if (!gameState.flashMessage) return;

    const msg = gameState.flashMessage;
    msg.timer--;

    if (msg.timer <= 0) {
        gameState.flashMessage = null;
        return;
    }

    const alpha = Math.min(1, msg.timer / 30);  // 最後の30フレームでフェードアウト
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = msg.color;
    ctx.font = `bold ${1.2}px 'Doto', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(msg.text, COLUMNS / 2, ROWS / 2);
    ctx.restore();
}
export function drawMatrix(matrix, offset, ctx, color) {
    matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) {
                const drawX = x + offset.x;
                const drawY = y + offset.y;

                // 1. ブロックの塗りつぶし
                ctx.fillStyle = color;
                ctx.fillRect(drawX, drawY, 1, 1);

                // 2. 内側のブロック同士の線を黒で描画
                ctx.strokeStyle = '#000000ff'; // 黒色
                ctx.lineWidth = 0.05;
                ctx.strokeRect(drawX, drawY, 1, 1);
            }
        });
    });
}

// HOLDエリアのミノを描画
// 引数名はシンプルに 'hold' (または 'holdType') とだけ書きます
export function drawHold(ctx, canvas, hold, createPiece, colors) {
    ctx.fillStyle = '#111'; // 背景を黒く塗りつぶし
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 引数で受け取った 'hold' が空でなければ描画
    if (hold) {
        const shape = createPiece(hold);
        drawMatrix(shape, { x: 1, y: 1 }, ctx, colors[hold]);
    }
}

// NEXTエリアのミノを描画
export function drawNext(ctx, canvas, matrix, type, colors) {
    ctx.fillStyle = '#111'; // 背景を黒く塗りつぶし
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (matrix) {
        drawMatrix(matrix, { x: 1, y: 1 }, ctx, colors[type]); // 次のミノを描画
    }
}

// ゲームボードのグリッド線を描画
export function drawGrid(ctx, ROWS, COLUMNS) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.05;

    for (let x = 0; x <= COLUMNS; x++) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROWS);
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(COLUMNS, y);
        ctx.stroke();
    }
}


export function updateAndDrawParticles(ctx, particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;  // 必ずリセット
}

