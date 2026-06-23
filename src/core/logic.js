// --- ゲームボードの作成と初期化 ---
// 指定された幅と高さの行列（マトリックス）を作成
export function createMatrix(w, h) {
    const matrix = [];
    // h回繰り返して、幅wの配列（すべて0で初期化）を行列に追加
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

// プレイヤーのミノがアリーナのブロックや壁と衝突するかを判定
export function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            // 1. ミノ側にブロックがあるか確認
            if (m[y][x] !== 0) {
                // 2. 盤面（arena）の「行」が存在するか確認
                const row = arena[y + o.y];
                // 行がない（上下にはみ出した）、または
                // 列がない（左右にはみ出した）、または
                // 既にブロックがある
                if (!row || row[x + o.x] === undefined || row[x + o.x] !== 0) {
                    return true; // 衝突！
                }
            }
        }
    }
    return false; // 衝突なし
}
// --- ミノの操作関数 ---
// ミノを回転させる
export function rotate(matrix, dir = 1) {
    // 転置
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    // 向きを逆にする
    if (dir > 0) {
        matrix.reverse(); // ←ここを入れ替える
    } else {
        matrix.forEach(row => row.reverse());
    }
}

//Tスピン/miniTスピンの判定関数
export function getTSpinType(player, arena) {
    if (player.type !== 'T') return null;
    if (player.lastAction !== 'rotate') return null;

    const cx = player.pos.x + 1;
    const cy = player.pos.y + 1;

    const corners = [
        [cx - 1, cy - 1],
        [cx + 1, cy - 1],
        [cx - 1, cy + 1],
        [cx + 1, cy + 1],
    ];

    let filled = 0;

    for (const [x, y] of corners) {
        if (!arena[y] || !arena[y][x] || arena[y][x] !== 0) {
            filled++;
        }
    }

    if (filled >= 3) return 'full';
    if (filled === 2) return 'mini';

    return null;
}
