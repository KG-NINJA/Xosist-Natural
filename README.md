# Xosist-Natural

**APIを消費せず、質問から高品質なX検索クエリを複数生成し、集めた投稿を自然な文章として出力する** 軽量ツール。

| | |
|---|---|
| **Live demo** | (GitHub Pages予定) |
| **Repository** | https://github.com/KG-NINJA/Xosist-Natural |
| **Version** | 0.1.0-alpha |
| **License** | MIT |

> 日本語の要点: X公式検索用の高度なクエリを質問から自動生成し、ユーザーが集めた投稿を自然なレポート文章にまとめます。スクレイピングなし・APIキー不要のコア機能。

## コンセプト

```
質問（Intent）
  → 複数角度の検索クエリ自動生成（ノイズ低減付き）
  → 公式 x.com/search URL を提示
  → ユーザーが投稿をコピー＆ペースト
  → 自然な文章（要約・洞察・レポート）として出力
```

- **検索実行時にX APIを一切使わない**
- クエリ生成は完全無料・クライアントサイド可能
- 投稿本文の取得は人間が行う（または将来のブラウザ拡張）
- 静的デプロイ可能（GitHub Pages）

## 主な機能

### 1. クエリ・コンポーザー
- 自然言語の質問から複数の高度な検索クエリを生成
- OR展開・除外語・from:/since:/min_faves などの巧妙な組み合わせ
- ノイズ低減プリセット（Low / Medium / High）
- 「最新」「話題」両方のURLを生成

### 2. 自然文シンセサイザー
- 貼り付けた投稿群を整理
- テーマ抽出 + 代表的な声の引用
- 自然な日本語（または英語）レポートを生成
- エージェント向けには高品質な合成プロンプトも出力可能

### 3. 人間向けUI
- ダークテーマのシンプルな画面
- クエリ生成 → URL一括表示 → 投稿貼り付け → 文章化

### 4. エージェント向け（準備中）
- `planFromIntent(intent)`
- `synthesizeFromPosts(posts, intent, style)`
- MCP / tool schema 対応予定

## クイックスタート（人間）

1. `index.html` を開く（または `npm run serve`）
2. 質問を入力して「クエリ生成」
3. 表示されたURLを開いて投稿を集める
4. 投稿を貼り付けて「自然な文章にまとめる」

```bash
git clone https://github.com/KG-NINJA/Xosist-Natural.git
cd Xosist-Natural
# 単純に index.html をブラウザで開くか
npx serve .   # 任意
```

## ディレクトリ構成

```
Xosist-Natural/
├── index.html              # 人間向けUI
├── style.css
├── app.js                  # UIロジック
├── lib/
│   ├── query-composer.js   # Intent → 複数クエリ生成
│   ├── noise.js            # ノイズ低減
│   ├── synthesizer.js      # 投稿 → 自然文
│   └── utils.js
├── agent/                  # エージェント向け（将来）
├── data/
│   ├── missions.json
│   ├── noise-catalog.json
│   └── synthesis-templates.json
├── docs/
├── llms.txt
├── AGENTS.md
├── README.md
└── examples/
```

## 設計思想

- HyperXosist-Agent の「計画は無料」思想を継承
- クエリ生成とナラティブ合成に特化
- スクレイピング・公式API依存を避け、長く使える設計
- 日本語を第一言語とする

## 現状（v0.1.0-alpha）

- [x] リポジトリ骨格
- [ ] query-composer.js 詳細実装
- [ ] synthesizer テンプレート
- [ ] UI実装
- [ ] エージェントAPI
- [ ] MCP

## License

MIT
