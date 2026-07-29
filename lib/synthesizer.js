/**
 * synthesizer.js
 * 集めた投稿群を「ある程度自然な文章」にまとめる。
 *
 * 方針:
 * - 完全なLLMなしでも動くテンプレートベースのナラティブ生成
 * - 将来的に外部LLM用の高品質プロンプトも生成できるようにする
 * - 日本語を第一言語とする
 */

/**
 * メイン合成関数
 * @param {string[]} posts - 投稿テキストの配列
 * @param {string} intent - 元の質問
 * @param {object} options
 * @param {'report'|'conversation'|'bullet'} options.style
 * @returns {string}
 */
export function synthesize(posts, intent = '', options = {}) {
  const style = options.style || 'report';

  if (!posts || posts.length === 0) {
    return '投稿がありません。公式検索結果から投稿をコピーして貼り付けてください。';
  }

  // 簡易前処理
  const cleaned = posts
    .map(p => p.trim())
    .filter(p => p.length > 10);

  if (cleaned.length === 0) {
    return '有効な投稿テキストが見つかりませんでした。';
  }

  // 統計
  const count = cleaned.length;
  const sample = cleaned.slice(0, 5); // 代表例

  if (style === 'report') {
    return buildReport(intent, count, sample, cleaned);
  }

  if (style === 'conversation') {
    return buildConversationStyle(intent, count, sample);
  }

  // default bullet
  return buildBulletSummary(intent, count, sample);
}

/**
 * レポート調（最も自然でおすすめ）
 */
function buildReport(intent, count, sample, all) {
  const lines = [];

  lines.push(`【調査テーマ】`);
  lines.push(intent || '（テーマ未指定）');
  lines.push('');
  lines.push(`収集した投稿数: ${count}件`);
  lines.push('');

  lines.push(`■ 全体の雰囲気`);
  lines.push(guessTone(all));
  lines.push('');

  lines.push(`■ 代表的な声（抜粋）`);
  sample.forEach((p, i) => {
    const short = p.length > 140 ? p.slice(0, 140) + '…' : p;
    lines.push(`${i + 1}. 「${short}」`);
  });
  lines.push('');

  lines.push(`■ まとめ`);
  lines.push(buildClosing(intent, count));

  return lines.join('\n');
}

/**
 * 会話調
 */
function buildConversationStyle(intent, count, sample) {
  const lines = [];
  lines.push(`「${intent || 'このテーマ'}」についてXを見てみました。`);
  lines.push('');
  lines.push(`全体で${count}件ほど目を通した感じでは、こんな声が目立ちます：`);
  lines.push('');

  sample.forEach((p, i) => {
    const short = p.length > 100 ? p.slice(0, 100) + '…' : p;
    lines.push(`・「${short}」`);
  });

  lines.push('');
  lines.push(`全体的には${guessToneShort(sample)}という印象です。`);
  return lines.join('\n');
}

/**
 * 箇条書き要約
 */
function buildBulletSummary(intent, count, sample) {
  const lines = [];
  lines.push(`テーマ: ${intent || '未指定'}`);
  lines.push(`投稿数: ${count}`);
  lines.push('');
  lines.push('主な声:');
  sample.forEach(p => {
    const short = p.length > 90 ? p.slice(0, 90) + '…' : p;
    lines.push(`- ${short}`);
  });
  return lines.join('\n');
}

/**
 * 簡易トーン推定（キーワードベース）
 */
function guessTone(posts) {
  const text = posts.join(' ').toLowerCase();

  const positive = (text.match(/good|great|love|amazing|素晴らしい|いいね|便利|最高|期待/g) || []).length;
  const negative = (text.match(/problem|issue|bug|slow|bad|最悪|問題|遅い|高い|使えない|失望/g) || []).length;
  const neutral = (text.match(/think|maybe|perhaps|思う|かも|検討|様子見/g) || []).length;

  if (negative > positive + 2) {
    return '批判や課題指摘が比較的多く見られます。実装の難しさやコスト、信頼性に関する声が目立ちます。';
  }
  if (positive > negative + 2) {
    return '前向きな評価や期待の声が多めです。新しい可能性を感じている人が一定数いる印象です。';
  }
  return '賛否が入り混じった、または様子見の空気が強いです。まだ情報が揃っていない段階という声もあります。';
}

function guessToneShort(posts) {
  const text = posts.join(' ').toLowerCase();
  const negative = (text.match(/problem|issue|bug|遅い|問題|高い/g) || []).length;
  const positive = (text.match(/good|great|便利|期待|素晴らしい/g) || []).length;

  if (negative > positive) return '課題意識の方が強め';
  if (positive > negative) return '前向きな反応が多め';
  return 'まだ様子見の空気が強い';
}

function buildClosing(intent, count) {
  return `以上が、収集した${count}件の投稿から読み取れる大まかな傾向です。より深く知りたい場合は、特定の角度（実装者視点・批判視点など）で再検索することをおすすめします。`;
}

/**
 * エージェント向け: 外部LLMに渡す高品質プロンプトを生成
 */
export function buildSynthesisPrompt(posts, intent, style = 'report') {
  const postBlock = posts.map((p, i) => `${i + 1}. ${p}`).join('\n\n');

  return `以下はX（Twitter）から収集した投稿です。元の質問は「${intent}」です。

これらの投稿を踏まえて、${style === 'report' ? '読みやすいレポート形式' : '自然な会話調'}でまとめてください。

ルール:
- 事実に基づき、誇張しない
- 代表的な声を自然に引用する
- 全体の温度感や主な論点を簡潔に述べる
- 日本語で出力する

--- 投稿 ---
${postBlock}
--- ここまで ---`;
}
