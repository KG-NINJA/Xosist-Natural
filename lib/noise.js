/**
 * noise.js
 * ノイズ低減用の除外語カタログ
 *
 * 優先度順に並べ、クエリ長制限を意識して上位から適用する。
 */

const NOISE_CATALOG = {
  // 汎用スパム・エンゲバイト
  common: [
    'giveaway', 'airdrop', 'follow', 'retweet', 'rt', 'like', 'subscribe',
    'click', 'link in bio', 'dm me', 'free nft', 'whitelisting'
  ],

  // 英語の定型プロモ
  promo_en: [
    'check out', 'link below', 'new drop', 'mint now', 'join now',
    'limited time', 'don\'t miss'
  ],

  // 日本語の定型
  promo_ja: [
    'フォロー', 'リツイート', 'いいね', '拡散希望', ' inda', ' inda希望',
    'プレゼント企画', '抽選', '応募'
  ],

  // 低品質な反応
  low_signal: [
    'this', 'lol', 'lmao', 'omg', 'wow', 'nice', 'cool', 'based',
    'gm', 'gn', 'wagmi', 'ngmi'
  ]
};

/**
 * ノイズレベルに応じた除外語リストを返す
 * @param {'low'|'medium'|'high'} level
 * @returns {string[]}
 */
export function getNoiseExcludes(level = 'medium') {
  const list = [];

  if (level === 'low') {
    // 最小限
    list.push(...NOISE_CATALOG.common.slice(0, 4));
  } else if (level === 'medium') {
    list.push(...NOISE_CATALOG.common);
    list.push(...NOISE_CATALOG.promo_en.slice(0, 4));
    list.push(...NOISE_CATALOG.promo_ja.slice(0, 4));
  } else {
    // high
    list.push(...NOISE_CATALOG.common);
    list.push(...NOISE_CATALOG.promo_en);
    list.push(...NOISE_CATALOG.promo_ja);
    list.push(...NOISE_CATALOG.low_signal);
  }

  // 重複除去
  return [...new Set(list)];
}

/**
 * カタログ全体をエクスポート（UIやエージェント用）
 */
export function exportNoiseCatalog() {
  return { ...NOISE_CATALOG };
}
