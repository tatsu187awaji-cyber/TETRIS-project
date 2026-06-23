// src/effects/b2bEffect.js
import { COLUMNS, ROWS } from '../core/constants.js';

// --- B2Bの段階ごとの演出設定テーブル ---
// 段階が上がるほど、粒子の量・速度・大きさ・消えにくさがインフレしていく
const B2B_AURA_LEVELS = {
    1: {
        // 【1回目：白】 確率で1個。下層にうっすら漂う
        getSpawnCount: () => (Math.random() < 0.3 ? 1 : 0),
        colors: ['#ffffff', '#e0e0e0'],
        baseDecay: 0.045,      // すぐ消える
        speedMultiplier: 0.8,  // ゆっくり上昇
        sizeBonus: 0
    },
    2: {
        // 【2回目：青】 毎フレーム確実に1個湧く。中層まで上昇
        getSpawnCount: () => 1,
        colors: ['#171fbe', '#0b9bde'],
        baseDecay: 0.032,
        speedMultiplier: 1.1,
        sizeBonus: 0.02
    },
    3: {
        // 【3回目：緑】 毎フレーム確実に1個湧く。さらに勢いを増して上昇
        getSpawnCount: () => 1,
        colors: ['#1b870d', '#07e637'],
        baseDecay: 0.024,
        speedMultiplier: 1.3,
        sizeBonus: 0.04
    },
    4: {
        // 【4回目：赤】 毎フレーム1〜2個爆湧き。高速で上層まで届く
        getSpawnCount: () => (Math.random() < 0.5 ? 1 : 2),
        colors: ['#ff0000', '#ff6600'],
        baseDecay: 0.012,
        speedMultiplier: 1.7,
        sizeBonus: 0.09 // 粒がデカくなる
    },
    5: {
        // 【5回目：黄】 高確率で2個湧く。勢いは4回目と同等
        getSpawnCount: () => (Math.random() < 0.3 ? 1 : 2),
        colors: ['#ffff00', '#ffd700'],
        baseDecay: 0.012,
        speedMultiplier: 1.7,
        sizeBonus: 0.09
    },
    6: {
        // 【6回目：紫】 常に2個爆湧き。ほぼ天井（画面最上部付近）まで高速で這い上がる
        getSpawnCount: () => 2,
        colors: ['#6808de', '#e800ec'],
        baseDecay: 0.008,
        speedMultiplier: 1.9,
        sizeBonus: 0.12
    }
};

// 【7回目以降：虹色】 1フレームに3〜5個が超高速で湧き上がる
// 画面が虹色の光の弾丸で埋め尽くされる
const RAINBOW_LEVEL = {
    getSpawnCount: () => Math.floor(Math.random() * 3) + 3, // 3〜5個
    baseDecay: 0.004,      // 天井を突き抜けて消えない
    speedMultiplier: 2.2,  // ロケット並みの超高速上昇
    sizeBonus: 0.15        // 圧倒的存在感のデカさ
};

/**
 * B2B継続中の常時オーラエフェクトを生成する（限界突破派手版）
 * @param {Object} gameState - ゲームの状態オブジェクト
 */
export function spawnB2BAura(gameState) {
    if (!gameState.b2b) return;

    const count = gameState.b2bCount;
    const isRainbow = count >= 7;
    const level = isRainbow ? RAINBOW_LEVEL : B2B_AURA_LEVELS[count];

    // 想定外のb2bCount（0や未定義など）の場合は何も出さない
    if (!level) return;

    const spawnCount = level.getSpawnCount();
    const { baseDecay, speedMultiplier, sizeBonus } = level;

    // B2Bが高くなるほど、横方向への飛び散り（拡散）も激しくする
    const spread = 0.08 * count;

    // 決定した「spawnCount」の分だけ、この1フレームで一気に粒子を生成する！
    for (let i = 0; i < spawnCount; i++) {
        // 虹色は粒ごとにリアルタイムで違う色をあてる。それ以外はテーブルの色から選択
        const particleColor = isRainbow
            ? `hsl(${Math.random() * 360}, 100%, 45%)`
            : level.colors[Math.random() > 0.5 ? 0 : 1];

        gameState.particles.push({
            x: Math.random() * COLUMNS,
            y: ROWS, // 画面下から湧き上がる
            // 高段階ほど激しく左右にシェイクしながら広がる
            vx: (Math.random() - 0.5) * spread,
            // 高段階ほど激しい上昇波動になる
            vy: (-Math.random() * 0.1 - 0.05) * speedMultiplier,
            life: 1.0,
            decay: baseDecay + Math.random() * 0.01,
            color: particleColor,
            size: (0.1 + Math.random() * 0.1) + sizeBonus
        });
    }
}