# Pocket Teleprompter

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-pocket-teleprompter/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-pocket-teleprompter/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-pocket-teleprompter/)

[English README](README.md)

原稿を貼り付けてすぐ使える、インストール不要・端末内処理のテレプロンプターです。動画撮影、スピーチ、プレゼン練習などで、原稿を外部へアップロードせず利用できます。

## 🚀 デモ

### [GitHub PagesでPocket Teleprompterを開く](https://ttomohisa.github.io/htmlapps-pocket-teleprompter/)

最初のHTMLを読み込んだ後、原稿編集・スクロール・保存・左右反転・時間計算などは端末内で処理されます。入力した原稿をアプリがサーバーへ送信することはありません。

[![Pocket Teleprompterの画面](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-pocket-teleprompter/)

## 主な機能

- スマートフォン向けのシンプルな本番画面
- 0.5×〜2.0×の自動スクロール
- **指定時間で原稿を読み切る「目標時間」モード**
- ハーフミラー式テレプロンプター向け左右反転
- 文字サイズ変更、左揃え・中央揃え
- カメラ付近へ視線を保ちやすいガイド線
- 3秒カウントダウン
- 中央タップで停止・再開
- 左端・右端タップで速度調整
- 経過時間、残り時間目安、進捗表示
- 対応環境で画面スリープ防止・全画面表示
- 原稿と設定をLocalStorageへ自動保存
- 日本語・英語切り替え
- 外部ライブラリ・ランタイム通信なし

## すぐに使う

1. Web版または `dist/index.html` を開きます。
2. 原稿を貼り付けます。
3. 必要に応じて速度・目標時間・文字サイズなどを調整します。
4. **テレプロンプターを開始** を押します。
5. 中央をタップすると停止・再開、左右の端をタップすると速度を調整できます。

基本機能は `file://` で直接開いた場合でも利用できます。画面起動ロックや全画面表示はブラウザー・開き方によって利用できない場合があります。

## 目標時間モード

スクロール速度を感覚で決める代わりに、「この原稿を **3:00** で最後まで表示する」のように時間を指定できます。

画面上で実際に描画された原稿の長さからスクロール速度を計算するため、スピーチや動画の尺を意識した練習に使えます。

実際の話し方や間をマイクで測定する機能ではありません。

## キーボード操作

| キー | 操作 |
| --- | --- |
| `Space` | 停止 / 再開 |
| `←` / `→` | 遅く / 速く |
| `R` | 最初から |
| `F` | 全画面表示を試す |
| `Esc` | ブラウザーの全画面処理中でなければ原稿画面へ戻る |

## GitHub Pagesで公開する

1. リポジトリ名を `htmlapps-pocket-teleprompter` としてGitHubへプッシュします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` へプッシュするか、Actionsからデプロイワークフローを手動実行します。
4. `https://ttomohisa.github.io/htmlapps-pocket-teleprompter/` で公開されます。

## 開発とビルド

```text
.
├─ src/index.template.html
├─ app.config.json
├─ dependencies.json
├─ build-standalone.bat
├─ build-standalone.ps1
├─ scripts/
└─ dist/
   ├─ index.html
   └─ index.self-extract.html
```

Windowsでは次を実行します。

```bat
build-standalone.bat
```

外部ランタイム依存ライブラリはありません。

## プライバシー

- 原稿をアプリが外部へアップロードすることはありません。
- 原稿と設定はLocalStorageが利用できる場合のみ端末内へ保存されます。
- CSPに `connect-src 'none'` を設定しています。
- 解析・テレメトリ・外部フォント・CDN・カメラ・マイク・位置情報を利用しません。

共有端末では利用後に原稿を消去するか、ブラウザーのサイトデータを削除してください。

## 制限事項

- Screen Wake LockとFullscreen APIはブラウザーや開き方によって利用できないことがあります。
- 目標時間はスクロール終了時間の目安であり、実際の話速を測定するものではありません。
- 非常に長い原稿ではブラウザーのメモリ使用量が増えます。
- プライベートブラウジング等ではLocalStorageが利用できない、または消去される場合があります。

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
