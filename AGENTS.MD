# Galaxy LT Scroller — Agent Guide

## 概要

Markdownで原稿を書くと、スター・ウォーズ風の3DクロールLTに変換するViteアプリです。ブラウザだけで動作し、Enterキーで進行する軽量プレゼンテーションシステムです。

## 技術スタック

- **ビルドツール**: Vite 8.x
- **言語**: Vanilla JavaScript (ES Modules)
- **スタイル**: CSS3 (Custom Properties, Keyframes, 3D Transforms)
- **依存**: なし（Viteのみ devDependency）

## プロジェクト構造

```
.
├── index.html          # エントリーポイント（ステージ、HUD、プロンプトのDOM）
├── src/
│   ├── main.js         # アプリケーションロジック（パース、レンダリング、アニメーション制御）
│   ├── styles.css      # スター・ウォーズ風3DクロールのCSS（perspective, transform-style等）
│   └── slides.md       # LT原稿（Markdown + 独自ディレクティブ）
├── public/assets/      # 画像素材（SVG等）
├── dist/               # ビルド成果物（vite build）
└── package.json
```

## ビルド・実行

```bash
# 依存インストール
npm install

# 開発サーバー起動（127.0.0.1）
npm run dev

# 本番ビルド
npm run build

# ビルド成果物のプレビュー
npm run preview
```

## デプロイ（Cloudflare Workers Static Assets）

このプロジェクトは `wrangler` を使って Cloudflare Workers の Static Assets としてデプロイできます。

### 必要なもの

- `wrangler` CLI（v4.x 以降）
- Cloudflare アカウントへのログイン（`npx wrangler login`）

### 設定ファイル

プロジェクトルートに `wrangler.jsonc` を配置しています：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "galaxy-lt-scroller",
  "compatibility_date": "2026-05-29",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

### デプロイ手順

```bash
# 1. 本番ビルド
npm run build

# 2. Cloudflare Workers Static Assets へデプロイ
npx wrangler deploy
```

デプロイ後、Wrangler が発行した Workers URL でアクセスできます。

### 注意事項

- `dist/` ディレクトリ内のファイルが全てアップロードされます
- `not_found_handling: "single-page-application"` を設定しているため、存在しないパスへのリクエストも `index.html` にフォールバックします（SPA として動作）
- Worker スクリプト（`main`）は不要です。Assets-only Worker として動作します

## 原稿の書き方（`src/slides.md`）

`---` でセクションを区切ります。

```md
@kicker EPISODE V2
# タイトル

本文をMarkdownとして書きます。

![画像の説明](/assets/example.svg)

@caption 画像キャプション

---

@kicker NEXT
## 次のセクション

本文です。
```

### 対応記法

| 記法 | 意味 |
|------|------|
| `# 見出し` | レベル1見出し（大タイトル） |
| `## 見出し` | レベル2見出し（セクションタイトル） |
| 通常段落 | クロール本文（改行区切りで段落にまとまる） |
| `![alt](src)` | ホログラム風画像（`public/assets/` 内のファイルを `/assets/...` で参照） |
| `@kicker テキスト` | 小さな章ラベル（EPISODE等） |
| `@caption テキスト` | 画像下キャプション |
| `@duration 15000` | そのセクションの通常スクロール時間（ミリ秒） |

## 操作・キーボードショートカット

- `Enter`: 開始 → スクロール開始 → 次のセクションへ進行
- `A`: Auto再生のオン/オフ
- `H`: HUDと右下プロンプトの表示/非表示
- `Reset`ボタン: 最初から再生

## アーキテクチャ・設計上の注意

### 状態マシン

`main.js` 内で以下の状態を管理しています。変更時は必ず `updateHud()` を呼んでUIを同期してください。

- `idle`: 待機中（次のセクションが画面下部で待機）
- `entering`: セクションが画面下から中央へ登場中
- `scrolling`: 3Dクロールスクロール中
- `complete`: 全セクション終了

### アニメーション制御

- **登場アニメーション**: `animateSectionIn()` — `below` → `idle` への linear 遷移
- **スクロールアニメーション**: `startScroll()` — `idle` → `far` への linear 遷移、opacity/filterも連動
- **タイマー管理**: `autoTimer`, `entryTimer`, `sectionExitTimer` を適切にクリアする必要があります。特に `prepareCurrent()` では全タイマーをクリアしてDOMをリセットします。

### セクションの自動スクロール時間

`durationForSection()` で自動計算されます。文字数に応じて `max(12000, min(21000, textLength * 78))` ミリ秒。`@duration` ディレクティブで上書き可能です。

### 3D CSSの重要プロパティ

`styles.css` で以下が全体の演出を決定しています。変更する場合は視覚的崩壊に注意してください。

- `.stage`: `perspective: 460px; perspective-origin: 50% 28%;`
- `.crawl-root`: `transform-style: preserve-3d;`
- `.crawl-section`: `transform-origin: 50% 100%;`（奥行き消失点を下部に合わせる）

### 背景の星（パララックス）

CSS の `radial-gradient` によるグリッド配置は廃止し、`main.js` の `createStars()` で個別の `<span>` 要素として生成しています。

- **個別性**：各星がランダムな位置・サイズ・速度・移動方向・明るさを持ちます。リロードするたびに配置が変わります。
- **奥行きレイヤー**：`star-near`（大・速・強光）・`star-mid`（標準）・`star-far`（小・遅・ぼかし）の3層でパララックス感を演出します。
- **総数**：3コンテナ合計で約360個。`will-change: transform, opacity` でGPUレイヤー化しています。
- **色**：白・シアン・ゴールドを混ぜ、コンテナごとに色の出やすさの偏りを設定しています。

### アクセシビリティ

- `aria-live="polite"` などのARIA属性が設定されています
- `prefers-reduced-motion: reduce` で星のアニメーションを無効化します
- キーボード操作中（input/textarea等）ではショートカットを無効化しています

## 変更時の注意事項

1. **画像パス**: Markdown内の画像パスは `public/` がルートとして解決されます。`public/assets/` に置いたファイルは `/assets/...` で参照してください。
2. **Markdownパース**: `parseSlides()` と `parseSection()` は独自の簡易パーサーです。複雑なMarkdown記法（リスト、テーブル等）は未対応です。必要なら構文を追加してください。
3. **トランジション定数**: `transition` オブジェクトの値（`crawlDistanceVh`, `entryDistanceVh`, `visibleExitRatio` 等）は演出のバランスを決定します。変更時は実際のブラウザで確認してください。
4. **CSS変数**: `--gold`, `--gold-soft`, `--cyan`, `--panel`, `--line` は一貫性のあるカラーリングの基盤です。新しい色を追加する場合は統一感を保ってください。
5. **星の生成**: 星は `createStars()` で動的に生成されます。個数やレイヤー設定を変更する場合はパフォーマンスに注意してください。色の偏り（`colorBias`）やレイヤー定数（`layers`）を変更すれば雰囲気を調整できます。

## 今後の拡張案（参考）

- 複数画像対応
- 動画埋め込み
- セクション内リスト対応
- 発表タイマー・残り時間表示
- リモート操作（WebSocket / QRコード）
