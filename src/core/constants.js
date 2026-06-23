//constants.js
// --- ゲームボードの定数と変数の設定 ---
// ゲームボードの行数と列数を定義
export const ROWS = 20;
export const COLUMNS = 12;
// 初期落下速度の定数定義
export const INITIAL_DROP_INTERVAL = 1000; // 1000ms = 1秒
// 500ミリ秒の猶予
export const LOCK_DELAY = 500;

export const SCORES = {
    SOFT_DROP: 10,        // 下キーでの落下
    HARD_DROP_PER_STEP: 20, // ハードドロップ1マスにつき
    SINGLE_LINE: 100,      // 1ライン消去
    DOUBLE_LINE: 300,      // 2ライン消去
    TRIPLE_LINE: 500,      // 3ライン消去
    TETRIS: 800            // 4ライン消去
};

// --- ミノの色を定義するオブジェクト ---
// 各ミノのタイプ（I, O, T, S, Z, J, L）に対応する色を定義
export const colors = {
    'I': '#00FFFF', // シアン（水色）
    'O': '#FFFF00', // 黄色
    'T': '#800080', // 紫
    'S': '#008000', // 緑
    'Z': '#FF0000', // 赤
    'J': '#0000FF', // 青
    'L': '#FFA500', // オレンジ
    'X': '#f2a7d5'  // 追加ブロック（ピンク）
};

// --- ミノの形状を定義する関数とデバッグ用の強制型 ---
const DEBUG_FORCE_TYPE = null; // null の場合は通常のランダム生成。
// const DEBUG_FORCE_TYPE = 'I'; // すべてIミノ（棒）になります！
// const DEBUG_FORCE_TYPE = 'O'; // すべてOミノ（正方形）になります！
// const DEBUG_FORCE_TYPE = 'T'; // すべてTミノ（T字）になります！
// const DEBUG_FORCE_TYPE = 'S'; // すべてSミノになります！
// const DEBUG_FORCE_TYPE = 'Z'; // すべてZミノになります！
// const DEBUG_FORCE_TYPE = 'J'; // すべてJミノになります！
// const DEBUG_FORCE_TYPE = 'L'; // すべてLミノになります！
// const DEBUG_FORCE_TYPE = 'X'; // すべてXミノ（追加ブロック）になります！


// --- 各ミノの形状を定義する関数 ---
// 指定されたタイプのミノの形状（行列）を返す
export function createPiece(type) {


    const pieces = {
        'I': [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        'O': [
            [1, 1],
            [1, 1]
        ],
        'T': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'X': [
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
    };
    return pieces[type];
}

// デバッグ用に型自体を決定する関数を追加
export function getPieceType(originalType) {
    return DEBUG_FORCE_TYPE ?? originalType;
}