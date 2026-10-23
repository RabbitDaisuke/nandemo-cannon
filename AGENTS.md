# 開発時の指示

このリポジトリは「なんでもキャノン」のGodotプロジェクトをルートに置く。依頼済みの実装、修正、検証を完了まで進める。このファイルを根拠に新しい承認段階を作らず、ユーザーが既に示した依頼と許可を引き継ぐ。

## 構成とビルド入口

- `project.godot`、`main.tscn`、`export_presets.cfg`はルートのGodot設定。
- `src/`はGDScriptによるゲーム実装、`data/`は物体とステージの定義、`assets/`はSVG原稿と生成素材。
- `tools/`はビルドと検証の補助実装、`tests/`はGodotのheadless試験、`web/`はWeb起動用のファイル。
- `docs/`は仕様と引き継ぎ、`previews/`は検証結果とNode.jsで作った確認画像。
- `out/standalone/`は自己完結するWeb出力とActions成果物の結合先、`out/engine/`と`out/game/`は並列jobの成果物、`out/packages/`は配布ZIP、`dist/`はPages公開対象。`.github/workflows/pages.yml`はmainへのpushと手動実行で起動する。

人とCIのビルド入口はルートの`./build.sh`へ統一する。サブコマンドは`bundle`（省略時）、`check`、`preview`、`pages`、`runtime`、`source`、`deploy`。依存の導入、Godotの取得、Export Templatesの準備、素材生成、Web出力はこの入口から行う。GitHub Actions側へ`npm install`、Godotのダウンロード、個別のビルド処理を重複して追加しない。

```sh
./build.sh
./build.sh check
./build.sh preview
./build.sh pages
./build.sh runtime
./build.sh source
./build.sh deploy
```

`pages`は`bundle`→`deploy`を実行する。`deploy`は結合済み成果物をGitHubへ保存する公開用の処理で、実行対象の`GITHUB_REPOSITORY`と、そのステップへ渡す`GITHUB_TOKEN`を使う。外部ランタイムURLの入力・repository variableは不要。対象が公開リポジトリでない場合は失敗させ、公開設定を自動変更しない。

ビルド入口はNode.js 22以上を確認し、`sharp`を解決できない場合に`npm ci`で依存を用意する。`GODOT_BIN`の指定がないLinux x86_64環境では、公式バイナリのダウンロード、SHA検証、同版テンプレートの配置を行う。ダウンロードキャッシュは`.cache/godot/`へ置く。

## エンジンとアート

Godotは**4.7.2 stable**へ固定し、エディタとExport Templatesの版を一致させる。対象はブラウザのWebAssemblyとWebGL 2、単一スレッド。JavaScriptで別のゲームエンジンを作ってGodot実装の代わりにしない。CIはUbuntu 24.04とNode.js 24を使う。

小物、文字、アニメーション原稿は16bit風のSVGを直接編集する。表示倍率を透明余白でごまかさず、SVGのviewBox、原点、物理形状と描画位置の対応を保つ。大砲の砲身は台座から独立した回転軸を持つ。ラスタライズや画像生成・確認の処理は`.mjs`から実行し、必要な`sharp`依存はビルド入口で準備する。

**ローカルブラウザを起動しない。** Playwright等によるブラウザ起動を視覚確認の代わりに追加しない。物理やゲーム状態はGodotのheadless実行、画像の確認はNode.jsで行う。確認画像が状態JSONとSVGからの再構成なら、その由来を明記する。

## 変更と検証

ユーザーの最新要件と既存データを読み、必要な範囲だけ変更する。ファイル検索は`rg`を優先し、UTF-8で読み書きする。`./build.sh check`で変更に関係する検証を行い、失敗した場合は原因を直す。火、水、氷、爆発、車輪、靴底、荷重破損などの実装では、見た目だけで成功と判定しない。

物体は1ステージ15投。ステージ1〜16がプレイ対象で、17〜20は地形・アートのプレビュー段階。未確定の投射順、攻略条件、ゲームルールを完成済みとして追加・説明しない。物体100種類は目標値であり、種類数の上限ではない。

同時に動かすサブエージェントは**最大2体**。各担当の編集ファイルを分け、同じファイルを同時に編集しない。Godotのインポートは担当間で調整し、同じプロジェクトに対して同時実行しない。

検証結果は実行した環境と範囲に合わせて報告する。Godotのheadless成功、WebAssemblyの生成・ロード、Node.jsの確認画像を、Safari・Chrome・Firefoxでの実機QA成功と言い換えない。未確認の描画、入力、端末差、難易度調整は未確認と記載する。

## StaticallyとGitHub Pages

ゲーム本体はGitHub Pagesへ公開し、StaticallyはGodotエンジンの配信に使う。対象は公開リポジトリ`RabbitDaisuke/nandemo-cannon`。`Deploy Pages`はmainへのpushと、入力項目のない`workflow_dispatch`で起動する。

runtime/sourceの2jobを並列に実行する。`./build.sh runtime`は公式Webテンプレートを抽出し、`./build.sh source`は検証と公式Web exportを行ってエンジンファイルを成果物から除く。upload-artifactの名前は`web-runtime`と`web-game`。両jobを`needs`に持つdeploy jobで、download-artifactの`pattern: web-*`、`merge-multiple: true`により`out/standalone/`へ結合し、`GITHUB_TOKEN`を渡して`./build.sh deploy`を実行する。
deployはZIP32のstore方式で`out/packages/nandemo-cannon-web-4.7.2.zip`を作り、`unzip -t`を通す。同じリポジトリの生成物専用`cdn-assets`ブランチ1つへ、Web全体をルートから保存し、`downloads/nandemo-cannon-web-4.7.2.zip`も置く。元の`LICENSE`と`web/licenses/godot/`の公式原本4文書・元URLをバイト改変せず同梱する。通常のGitファイルを使い、Git LFSは使わない。`main`やソースのブランチをこの処理からpushしない。

エンジンの配信先は`https://cdn.statically.io/gh/OWNER/REPO@SHA/runtime/godot/4.7.2/`とし、`SHA`には生成物の実コミットSHAを入れる。Web全体を同じブランチで更新するため、ゲーム側の変更でもランタイムURLは変わる。移動するブランチ名で配信先を固定した扱いにしない。Staticallyから実際に取得し、CORS、内容のハッシュ、MIMEを検証した後で`dist/`を生成する。取得失敗や内容不一致を成功と扱わず、Pages側のエンジン同梱へ切り替えて配信失敗を隠さない。小さなテキストの取得成功を、大きなgzipエンジンの配信確認として扱わない。

deploy jobは生成物ブランチ保存用の`contents: write`と、Pages公開用の`pages: write`、`id-token: write`を持ち、`github-pages`環境を使う。書き込み先の限定は公開スクリプトで維持する。ZIPをupload-artifactへ保存した後、`dist/`をupload-pages-artifactへ渡し、deploy-pagesでゲームをGitHub Pagesへ公開する。公式Actionは完全なコミットSHAで固定する。
