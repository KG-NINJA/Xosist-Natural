/**
 * Xosist-Natural - Single-file bundle (no ES modules)
 * file:// でも動作するようにしたもの
 * v0.1.1
 */

(function () {
  'use strict';

  // ========== utils ==========
  function safeJoin(parts, sep = ' ') {
    return parts.filter(Boolean).join(sep).replace(/\s+/g, ' ').trim();
  }
  function unique(arr) {
    return [...new Set(arr)];
  }

  // ========== noise ==========
  const NOISE_CATALOG = {
    common: ['giveaway', 'airdrop', 'follow', 'retweet', 'rt', 'like', 'subscribe', 'click', 'link in bio', 'dm me', 'free nft', 'whitelisting'],
    promo_en: ['check out', 'link below', 'new drop', 'mint now', 'join now', 'limited time', "don't miss"],
    promo_ja: ['フォロー', 'リツイート', 'いいね', '拡散希望', ' inda', ' inda希望', 'プレゼント企画', '抽選', '応募'],
    low_signal: ['this', 'lol', 'lmao', 'omg', 'wow', 'nice', 'cool', 'based', 'gm', 'gn', 'wagmi', 'ngmi']
  };

  function getNoiseExcludes(level = 'medium') {
    const list = [];
    if (level === 'low') {
      list.push(...NOISE_CATALOG.common.slice(0, 4));
    } else if (level === 'medium') {
      list.push(...NOISE_CATALOG.common);
      list.push(...NOISE_CATALOG.promo_en.slice(0, 4));
      list.push(...NOISE_CATALOG.promo_ja.slice(0, 4));
    } else {
      list.push(...NOISE_CATALOG.common, ...NOISE_CATALOG.promo_en, ...NOISE_CATALOG.promo_ja, ...NOISE_CATALOG.low_signal);
    }
    return [...new Set(list)];
  }

  // ========== query-composer ==========
  function isBroadJapaneseQuestion(text) {
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
    let t = text
      .replace(/[？?！!。、．，]/g, ' ')
      .replace(/(について|を|が|は|に|の|と|で|や|など|知りたい|教えて|ください|ほしい|欲しい|最新|情報|内容)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = [];
    const parts = t.split(/\s+/);
    for (const p of parts) {
      if (p.length <= 1) continue;
      tokens.push(p);
    }

    const stop = new Set(['the', 'a', 'an', 'of', 'to', 'for', 'in', 'on', 'and', 'or', 'what', 'how', '一番', '日本', 'で']);
    return unique(tokens.filter(t => !stop.has(t.toLowerCase()) && t.length > 1));
  }

  function buildCoreOrGroup(keywords) {
    if (keywords.length === 0) return 'lang:ja';
    const parts = keywords.map(k => {
      if (k.includes(' ') || (k.length > 8 && /[^\x00-\x7F]/.test(k))) return `"${k}"`;
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
    excludes.slice(0, 8).forEach(ex => parts.push(`-${ex}`));
    return safeJoin(parts);
  }

  function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function composeQueries(intent, options = {}) {
    const noiseLevel = options.noiseLevel || 'medium';
    const cleaned = intent.trim().replace(/\s+/g, ' ');
    const keywords = extractKeywords(cleaned);
    const isBroadJP = isBroadJapaneseQuestion(cleaned);
    const excludes = getNoiseExcludes(noiseLevel);
    const queries = [];

    if (isBroadJP) {
      queries.push({
        label: 'メイン（日本語トレンド）',
        angle: 'primary',
        query: buildQuery({
          core: 'lang:ja',
          extras: ['min_faves:50'],
          excludes: excludes.slice(0, 5),
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
      const coreGroup = buildCoreOrGroup(keywords);
      queries.push({
        label: 'メイン（バランス）',
        angle: 'primary',
        query: buildQuery({
          core: coreGroup,
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
          excludes
        })
      });
      queries.push({
        label: '課題・批判視点',
        angle: 'critical',
        query: buildQuery({
          core: coreGroup,
          extras: ['(problem OR issue OR bug OR slow OR expensive OR "not working" OR 課題 OR 問題 OR 遅い OR 高い OR 批判)'],
          excludes
        })
      });
      queries.push({
        label: '話題・高反応',
        angle: 'trending',
        query: buildQuery({
          core: coreGroup,
          excludes: excludes.slice(0, 6),
          engagement: 'min_faves:20 OR min_retweets:10'
        })
      });
    }

    return { intent: cleaned, keywords, isBroadJP, queries };
  }

  // ========== synthesizer ==========
  function guessTone(posts) {
    const text = posts.join(' ').toLowerCase();
    const positive = (text.match(/good|great|love|amazing|素晴らしい|いいね|便利|最高|期待/g) || []).length;
    const negative = (text.match(/problem|issue|bug|slow|bad|最悪|問題|遅い|高い|使えない|失望/g) || []).length;
    if (negative > positive + 2) {
      return '批判や課題指摘が比較的多く見られます。実装の難しさやコスト、信頼性に関する声が目立ちます。';
    }
    if (positive > negative + 2) {
      return '前向きな評価や期待の声が多めです。新しい可能性を感じている人が一定数いる印象です。';
    }
    return '賛否が入り混じった、または様子見の空気が強いです。まだ情報が揃っていない段階という声もあります。';
  }

  function synthesize(posts, intent = '', options = {}) {
    if (!posts || posts.length === 0) {
      return '投稿がありません。公式検索結果から投稿をコピーして貼り付けてください。';
    }
    const cleaned = posts.map(p => p.trim()).filter(p => p.length > 10);
    if (cleaned.length === 0) return '有効な投稿テキストが見つかりませんでした。';

    const count = cleaned.length;
    const sample = cleaned.slice(0, 5);
    const lines = [];

    lines.push('【調査テーマ】');
    lines.push(intent || '（テーマ未指定）');
    lines.push('');
    lines.push(`収集した投稿数: ${count}件`);
    lines.push('');
    lines.push('■ 全体の雰囲気');
    lines.push(guessTone(cleaned));
    lines.push('');
    lines.push('■ 代表的な声（抜粋）');
    sample.forEach((p, i) => {
      const short = p.length > 140 ? p.slice(0, 140) + '…' : p;
      lines.push(`${i + 1}. 「${short}」`);
    });
    lines.push('');
    lines.push('■ まとめ');
    lines.push(`以上が、収集した${count}件の投稿から読み取れる大まかな傾向です。より深く知りたい場合は、特定の角度で再検索することをおすすめします。`);

    return lines.join('\n');
  }

  // ========== UI ==========
  function $(sel) { return document.querySelector(sel); }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderQueries(plan) {
    const queriesOutput = $('#queries-output');
    queriesOutput.innerHTML = '';

    plan.queries.forEach((q, i) => {
      const item = document.createElement('div');
      item.className = 'query-item';

      const latestUrl = `https://x.com/search?q=${encodeURIComponent(q.query)}&src=typed_query&f=live`;
      const topUrl = `https://x.com/search?q=${encodeURIComponent(q.query)}&src=typed_query`;

      item.innerHTML = `
        <div class="label">${escapeHtml(q.label || 'クエリ ' + (i + 1))}</div>
        <div class="query-text">${escapeHtml(q.query)}</div>
        <div class="actions">
          <a class="btn-link" href="${latestUrl}" target="_blank" rel="noopener">最新で開く</a>
          <a class="btn-link" href="${topUrl}" target="_blank" rel="noopener">話題で開く</a>
          <button type="button" class="copy-query">クエリをコピー</button>
        </div>
      `;
      queriesOutput.appendChild(item);

      item.querySelector('.copy-query').addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(q.query);
          this.textContent = 'コピー済み';
          const btn = this;
          setTimeout(() => { btn.textContent = 'クエリをコピー'; }, 1200);
        } catch (e) {
          alert('コピーに失敗しました');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const intentInput = $('#intent-input');
    const noiseLevel = $('#noise-level');
    const btnGenerate = $('#btn-generate');
    const queriesSection = $('#queries-section');
    const postsInput = $('#posts-input');
    const btnSynthesize = $('#btn-synthesize');
    const synthSection = $('#synth-section');
    const synthOutput = $('#synth-output');
    const btnCopySynth = $('#btn-copy-synth');

    if (!btnGenerate) {
      console.error('UI elements not found');
      return;
    }

    btnGenerate.addEventListener('click', function () {
      const intent = intentInput.value.trim();
      if (!intent) {
        alert('質問を入力してください');
        return;
      }
      try {
        const plan = composeQueries(intent, { noiseLevel: noiseLevel.value });
        renderQueries(plan);
        queriesSection.classList.remove('hidden');
        console.log('Generated plan:', plan);
      } catch (e) {
        console.error(e);
        alert('クエリ生成中にエラーが発生しました: ' + e.message);
      }
    });

    btnSynthesize.addEventListener('click', function () {
      const postsText = postsInput.value.trim();
      const intent = intentInput.value.trim();
      if (!postsText) {
        alert('投稿を貼り付けてください');
        return;
      }
      const posts = postsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const result = synthesize(posts, intent, { style: 'report' });
      synthOutput.textContent = result;
      synthSection.classList.remove('hidden');
    });

    if (btnCopySynth) {
      btnCopySynth.addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(synthOutput.textContent);
          this.textContent = 'コピーしました';
          const btn = this;
          setTimeout(() => { btn.textContent = 'コピー'; }, 1500);
        } catch (e) {
          alert('コピーに失敗しました');
        }
      });
    }
  });
})();
