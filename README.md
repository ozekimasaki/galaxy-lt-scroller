# Galaxy LT Scroller

Markdownで原稿を書くと、スター・ウォーズ風の3DクロールLT（ライトニングトーク）に変換するViteアプリです。ブラウザだけで動作し、`Enter` キーで発表者のペースに合わせて進行できます。

## 主な機能

- **Markdown原稿の3Dクロール化**: `src/slides.md` の原稿を、奥行きのある3Dクロール演出でレンダリングします。
- **独自ディレクティブ**: `@kicker` / `@caption` / `@duration` でLT向けの表現を追加できます。
- **ホログラム風画像**: `![alt](/assets/...)` で画像をSF風の透過エフェクト付きで表示します。
- **段階進行の操作系**: `Enter` で開始・スクロール・急加速して次へ、と段階的に進みます。
- **Auto再生**: `A` キーで自動再生のオン/オフを切り替えられます。
- **動的な星空背景**: `main.js` の `createStars()` が奥行き3層（near / mid / far）のパララックスな星を毎回ランダムに生成します。
- **HUD表示切替**: `H` キーで右下プロンプトとHUDの表示/非表示を切り替えます。
- **アクセシビリティ配慮**: `aria-live` などのARIA属性、`prefers-reduced-motion` による星アニメーション無効化に対応しています。
- **依存ゼロのランタイム**: ビルドツールのVite以外にランタイム依存はありません。

## 要件

- Node.js（Vite 8 の要件により 20.19+ または 22.12+）
- npm

## インストール

```bash
npm install
```

## 使い方

```bash
npm run dev
```

表示されたローカルURL（`http://127.0.0.1:5173` など）を開き、`Enter` で進行します。

### 操作・キーボードショートカット

- `Enter`: 開始、スクロール開始、スクロール中は次のセクションへ移動
- `A`: Auto再生のオン/オフ
- `H`: HUDと右下プロンプトの表示/非表示
- `Reset` ボタン: 最初から再生

## 原稿の書き方

編集対象は `src/slides.md` です。`---`（単独行）でセクションを区切ります。

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

対応している記法（`src/main.js` の簡易パーサーによる）:

- `#` / `##`: セクション見出し（`#` はレベル1の大タイトル、`##` はレベル2）
- 通常段落: クロール本文（空行区切りで段落にまとまる）
- `![alt](src)`: ホログラム風画像
- `@kicker テキスト`: 小さな章ラベル
- `@caption テキスト`: 画像下キャプション
- `@duration 15000`: そのセクションの通常スクロール時間をミリ秒で指定

未指定の場合、スクロール時間は文字数から自動計算されます（`min(21000, max(12000, 文字数 * 78))` ミリ秒）。リスト・テーブルなどの複雑なMarkdown記法には対応していません。

画像は `public/assets` に置き、Markdownでは `/assets/file.svg` のように参照します。

## 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバーを起動（`127.0.0.1`） |
| `npm run build` | 本番ビルド（`dist/` に出力） |
| `npm run preview` | ビルド成果物をローカルでプレビュー（`127.0.0.1`） |

## プロジェクト構成

```
.
├── index.html          # エントリーポイント（ステージ、HUD、プロンプトのDOM）
├── src/
│   ├── main.js         # アプリケーションロジック（パース、レンダリング、アニメーション制御）
│   ├── styles.css      # 3DクロールのCSS（perspective, transform-style 等）
│   └── slides.md       # LT原稿（Markdown + 独自ディレクティブ）
├── public/assets/      # 画像素材（SVG）
├── dist/               # ビルド成果物（vite build）
├── wrangler.jsonc      # Cloudflare Workers Static Assets のデプロイ設定
└── package.json
```

## デプロイ

`wrangler`（devDependency）を使い、Cloudflare Workers の Static Assets としてデプロイできます。

```bash
npm run build
npx wrangler deploy
```

`wrangler.jsonc` で `dist/` を配信ディレクトリに指定し、`not_found_handling: "single-page-application"` によりSPAとしてフォールバックします。詳細は [`AGENTS.md`](./AGENTS.md) を参照してください。

## ライセンス

`package.json` は `private` 指定で、ライセンスファイルは同梱されていません。
