/**
 * Xosist-Natural - Main UI logic
 * v0.1.0-alpha
 */

import { composeQueries } from './lib/query-composer.js';
import { synthesize } from './lib/synthesizer.js';

const $ = (sel) => document.querySelector(sel);

const intentInput = $('#intent-input');
const noiseLevel = $('#noise-level');
const btnGenerate = $('#btn-generate');
const queriesSection = $('#queries-section');
const queriesOutput = $('#queries-output');
const postsInput = $('#posts-input');
const btnSynthesize = $('#btn-synthesize');
const synthSection = $('#synth-section');
const synthOutput = $('#synth-output');
const btnCopySynth = $('#btn-copy-synth');

btnGenerate.addEventListener('click', () => {
  const intent = intentInput.value.trim();
  if (!intent) {
    alert('質問を入力してください');
    return;
  }

  const level = noiseLevel.value;
  const plan = composeQueries(intent, { noiseLevel: level });

  renderQueries(plan);
  queriesSection.classList.remove('hidden');
});

btnSynthesize.addEventListener('click', () => {
  const postsText = postsInput.value.trim();
  const intent = intentInput.value.trim();

  if (!postsText) {
    alert('投稿を貼り付けてください');
    return;
  }

  const posts = postsText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const result = synthesize(posts, intent, { style: 'report' });
  synthOutput.textContent = result;
  synthSection.classList.remove('hidden');
});

btnCopySynth.addEventListener('click', async () => {
  const text = synthOutput.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btnCopySynth.textContent = 'コピーしました';
    setTimeout(() => { btnCopySynth.textContent = 'コピー'; }, 1500);
  } catch (e) {
    alert('コピーに失敗しました');
  }
});

function renderQueries(plan) {
  queriesOutput.innerHTML = '';

  plan.queries.forEach((q, i) => {
    const item = document.createElement('div');
    item.className = 'query-item';

    const latestUrl = `https://x.com/search?q=${encodeURIComponent(q.query)}&src=typed_query&f=live`;
    const topUrl = `https://x.com/search?q=${encodeURIComponent(q.query)}&src=typed_query`;

    item.innerHTML = `
      <div class="label">${q.label || `クエリ ${i + 1}`}</div>
      <div class="query-text">${escapeHtml(q.query)}</div>
      <div class="actions">
        <a class="btn-link" href="${latestUrl}" target="_blank" rel="noopener">最新で開く</a>
        <a class="btn-link" href="${topUrl}" target="_blank" rel="noopener">話題で開く</a>
        <button class="copy-query" data-query="${escapeAttr(q.query)}">クエリをコピー</button>
      </div>
    `;
    queriesOutput.appendChild(item);
  });

  // copy buttons
  queriesOutput.querySelectorAll('.copy-query').forEach(btn => {
    btn.addEventListener('click', async () => {
      const q = btn.getAttribute('data-query');
      await navigator.clipboard.writeText(q);
      btn.textContent = 'コピー済み';
      setTimeout(() => { btn.textContent = 'クエリをコピー'; }, 1200);
    });
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}
