# asakusasemao.github.io

AsakusaSemao の個人サイトです。

## 言語ごとのページ

トップページと、嵐のシリーズ4作の紹介ページは22の言語、Vollog の紹介ページは21の言語（マレー語なし。マレー語のトップからは英語のページへつなぐ）で作ってあります。日本語はサイトの頭（`/`・`/apps/storm-volley/`）、ほかの言語は `/<言語>/` の下（`/en/`・`/ko/apps/storm-tennis/` など）です。これらのページは `tools/build.mjs` が作るので、**手で直さない**でください。

```bash
npm run import   # 嵐のシリーズ（../storm-*）と Vollog（../ストア素材/04_文言・../volleyball-app）から、ストアの文言とアプリの文言を取りこむ（tools/data/）
npm run build    # 言語ごとのページを作り直す
```

- サイトだけの文（トップのカードの一言、「このゲームならでは」、広告の説明など）は `tools/text/<言語>.json`。元は `ja.json`。文を足すときは全部の言語に足す。
- 紹介ページの「どんなゲーム」とご注意は、ストアの説明文（■ の節）から作る。ストアの文を直したら `npm run import` → `npm run build`。節に付ける絵記号は `tools/config.mjs` の `icons`。
- アプリの公開の状態（App Store・Google Play の URL）は `tools/config.mjs` の `APPS`。公開したら URL を入れて `npm run build`。
- ストアのボタンの下に一時的なお知らせ（審査中のことなど）を出すときは、`tools/text/<言語>.json` の `apps.<アプリ>.storeNote` に書く。済んだら消して `npm run build`。
- 言語の決め方: `?lang=ko` が付いていれば、その言語のページへ移る（アプリの「ほかのアプリ」から開くとき）。日本語のページは、付いていなければ、覚えている言語（最後に見ていた言語ごとのページの言語）→ ブラウザの言語の順に見る。合う言語がなければ英語。利用規約などから `/` へ戻ったときも、最後に見ていた言語のトップになる。
- Vollog の紹介ページの名前・サブタイトル・頭の文はストアの文言（`../ストア素材/04_文言/`）、成績の項目名・プランの表・入力の形とテーマの名前はアプリの文言（`../volleyball-app/src/i18n/`）から取る。機能のカードなどサイトだけの文は `tools/text/<言語>.json` の `vollog`。
- プライバシーポリシー・規約・特定商取引法の表記は、言語ごとに作っていない（今までのページのまま）。

## ブラウザで使うアプリ

ゲームに限らず、ブラウザで使うアプリは `tools/config.mjs` の `APPS` に `web: true` で足します。紹介ページとトップの「ブラウザで使えるアプリ」に出ます。文言は `tools/text/<言語>.json` の `apps.<id>`、アイコンは `assets/images/<id>-icon.png`。紹介ページの見た目を変えるときは、`theme` に `<body>` の class（Asakusa Circuit は `race`）、`font` に足す Google Fonts の指定を書き、`assets/css/site.css` にその class の見た目を足します。

本体は `/web/<id>/` に置きます。元のソースはここに入れません（このリポジトリは公開です）。ブラウザで動くものなので、置いたファイル自体は誰でも取得できます。

- Asakusa Circuit: ソースは `../race-game`。`npm run build` → `npm run publish:site` で、`web/asakusa-circuit/` とアイコンが更新されます。ゲームのコードは難読化してあります（完全に隠せるものではありません）。
