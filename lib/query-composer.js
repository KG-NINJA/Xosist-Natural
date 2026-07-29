/**
 * query-composer.js
 * Intent（自然言語の質問）から複数の高品質なX検索クエリを生成する。
 * 日本語対応を強化した版
 */

import { safeJoin, unique } from './utils.js';
import { getNoiseExcludes } from './noise.js';

/**
 * メインエントリ
 */
export function composeQueries(intent, options = {}) {
  const noiseLevel = options.noiseLevel || 'medium';
  const cleaned = intent.trim().replace(/\s+/g, ' ');

  const keywords = extractKeywords(cleaned);
  const isBroadJP = isBroadJapaneseQuestion(cleaned);

  const excludes = getNoiseExcludes(noiseLevel);
  const queries = [];

  if (isBroadJP) {
    // 広い質問（「一番議論されている内容は？」など）の場合は
    // トレンド寄り・言語指定のクエリを優先する
    queries.push({
      label: 'メイン（日本語トレンド）',
      angle: 'primary',
      query: buildQuery({
        core: 'lang:ja',
        extras: ['min_faves:50'],
        excludes: excludes.slice(0, 5),
        engagement: null,
        extraFilters: ['-filter:replies', '-filter:retweets']
      })
    });

    queries.push({
      label: '議論・炎上寄り',
      angle: 'critical',
      query: buildQuery({
        core: 'lang:ja',
        extras: ['(議論 OR 炎上 OR 批判 OR 問題 OR 反対 OR 賛否)'],
        excludes: excludes.slice(0, 4),
        engagement: 'min_faves:20',
        extraFilters: ['-filter:replies']
      })
    });

    queries.push({
      label: 'ニュース・話題',
      angle: 'trending',
      query: buildQuery({
        core: 'lang:ja',
        extras: ['(速報 OR ニュース OR 話題 OR トレンド)'],
        excludes: excludes.slice(0, 4),
        engagement: 'min_faves:100',
        extraFilters: []
      })
    });

    queries.push({
      label: '最近24時間（高反応）',
      angle: 'recent',
      query: buildQuery({
        core: 'lang:ja',
        extras: [],
        excludes: excludes.slice(0, 3),
        engagement: 'min_faves:30',
        extraFilters: ['-filter:replies']
      }) + ' since:' + getYesterday()
    });
  } else {
    // 通常のキーワードベース
    const coreGroup = buildCoreOrGroup(keywords);

    queries.push({
      label: 'メイン（バランス）',
      angle: 'primary',
      query: buildQuery({
        core: coreGroup,
        extras: [],
        excludes,
        engagement: 'min_faves:3',
        extraFilters: ['-filter:replies']
      })
    });

    queries.push({
      label: '実装・技術視点',
      angle: 'implementer',
      query: buildQuery({
        core: coreGroup,
        extras: ['(SDK OR implement OR implementation OR code OR github OR docs OR facilitator OR "how to" OR 実装 OR 導入)'],
        excludes,
        engagement: null,
        extraFilters: []
      })
    });

    queries.push({
      label: '課題・批判視点',
      angle: 'critical',
      query: buildQuery({
        core: coreGroup,
        extras: ['(problem OR issue OR bug OR slow OR expensive OR "not working" OR 課題 OR 問題 OR 遅い OR 高い OR 批判)'],
        excludes,
        engagement: null,
        extraFilters: []
      })
    });

    queries.push({
      label: '話題・高反応',
      angle: 'trending',
      query: buildQuery({
        core: coreGroup,
        extras: [],
        excludes: excludes.slice(0, 6),
        engagement: 'min_faves:20 OR min_retweets:10',
        extraFilters: []
      })
    });
  }

  return {
    intent: cleaned,
    keywords,
    isBroadJP,
    queries
  };
}

function isBroadJapaneseQuestion(text) {
  // 「一番〜は？」「何が話題」「議論されている」などの広い質問を検出
  const patterns = [
    /一番.*?(内容|話題|議論|ニュース|こと)/,
    /(何が|なにが).*(話題|議論|トレンド)/,
    /議論されて(いる|る)/,
    /今.*話題/,
    /トレンド/,
    /今の日本/
  ];
  return patterns.some(p => p.test(text));
}

function extractKeywords(text) {
  // 日本語対応: 助詞や疑問詞を除去して意味のある塊を残す
  let t = text
    .replace(/[？?！!。、．，]/g, ' ')
    .replace(/(について|を|が|は|に|の|と|で|や|など|知りたい|教えて|ください|ほしい|欲しい|最新|情報|内容)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 英語っぽい単語と日本語の塊を分ける
  const tokens = [];
  const parts = t.split(/\s+/);

  for (const p of parts) {
    if (p.length <= 1) continue;
    // 英単語
    if (/^[a-zA-Z0-9\-_\.]+$/.test(p)) {
      tokens.push(p);
    } else if (p.length >= 2) {
      tokens.push(p);
    }
  }

  // ストップワード除去
  const stop = new Set([
    'the', 'a', 'an', 'of', 'to', 'for', 'in', 'on', 'and', 'or', 'what', 'how',
    '一番', '日本', 'で'
  ]);

  return unique(tokens.filter(t => !stop.has(t.toLowerCase()) && t.length > 1));
}

function buildCoreOrGroup(keywords) {
  if (keywords.length === 0) return 'lang:ja';

  const parts = keywords.map(k => {
    if (k.includes(' ') || (k.length > 8 && /[^\x00-\x7F]/.test(k))) {
      return `"${k}"`;
    }
    return k;
  });

  if (parts.length === 1) return parts[0];
  return `(${parts.join(' OR ')})`;
}

function buildQuery({ core, extras = [], excludes = [], engagement = null, extraFilters = [] }) {
  const parts = [];
  if (core) parts.push(core);
  extras.forEach(e => parts.push(e));
  if (engagement) parts.push(`(${engagement})`);
  extraFilters.forEach(f => parts.push(f));

  const maxExcludes = 8;
  excludes.slice(0, maxExcludes).forEach(ex => {
    parts.push(`-${ex}`);
  });

  return safeJoin(parts);
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function withDateRange(query, since, until) {
  let q = query;
  if (since) q += ` since:${since}`;
  if (until) q += ` until:${until}`;
  return q.trim();
}
