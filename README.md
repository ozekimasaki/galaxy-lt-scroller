# Galaxy LT Scroller

Markdownで原稿を書くと、スター・ウォーズ風の3DクロールLTに変換するViteアプリです。

## 使い方

```bash
npm install
npm run dev
```

表示されたローカルURLを開き、`Enter` で進行します。

## 操作

- `Enter`: 開始、進行、スクロール中は次のセクションへ移動
- `A`: Auto再生のオン/オフ
- `H`: HUDと右下プロンプトの表示/非表示
- `Reset`: 最初から再生

## 原稿の書き方

編集対象は `src/slides.md` です。`---` でセクションを区切ります。

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

対応している記法:

- `#` / `##`: セクション見出し
- 通常段落: クロール本文
- `![alt](src)`: ホログラム風画像
- `@kicker テキスト`: 小さな章ラベル
- `@caption テキスト`: 画像下キャプション
- `@duration 15000`: そのセクションの通常スクロール時間をミリ秒で指定

画像は `public/assets` に置き、Markdownでは `/assets/file.svg` のように参照します。
