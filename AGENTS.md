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

小物、マップ、アニメーション原稿は16bit風のSVGを直接編集する。最新の依頼により、大砲・ロゴ・HUD文字は画像生成した原稿を`assets/generated/`へ保存し、`tools/prepare-generated-art.mjs`で分割・切り詰め・lossless WebP化する。CIでは保存済み原稿を使い、画像生成APIを呼ばない。表示倍率を透明余白でごまかさず、原点、物理形状と描画位置の対応を保つ。大砲の砲身は台座から独立した回転軸を持つ。必要な`sharp`依存はビルド入口で準備する。

UIは日本語にする。157物体・20ステージ・案内文のかな表示は`data/ui-ja.json`、正式名称は既存の`nameJa`を使う。生成フォントはひらがな全86字と反復記号、カタカナ、HUD文字・記号を収録し、現在246字。正確な文字集合は`assets/font/generated-coverage.json`を基準にし、新しい表示文字の欠落を確認する。英語表示へ戻して欠字を回避しない。

**ローカルブラウザを起動しない。** Playwright等によるブラウザ起動を視覚確認の代わりに追加しない。物理やゲーム状態はGodotのheadless実行、画像の確認はNode.jsで行う。確認画像が状態JSONとSVGからの再構成なら、その由来を明記する。

## 変更と検証

ユーザーの最新要件と既存データを読み、必要な範囲だけ変更する。ファイル検索は`rg`を優先し、UTF-8で読み書きする。`./build.sh check`で変更に関係する検証を行い、失敗した場合は原因を直す。火、水、氷、爆発、車輪、靴底、荷重破損などの実装では、見た目だけで成功と判定しない。

物体は1ステージ15投。16はレストラン、17は整備工場、19はお祭り、20は「なんでも実験室」。18はユーザー未指定のため既存の氷床を暫定配置し、ユーザー確定事項として扱わない。物体100種類は目標値であり、種類数の上限ではない。最新指示に従い、上下ドラッグで角度、左右ドラッグで火力を変える操作を使う。第1面は十字矢印で案内する。装填物は大砲に重ね、「つぎ」にはその次の物体を表示する。

結果の共有画像は、確定スコアを更新してから結果オーバーレイを出す前にゲーム画面をJPEG化し、メモリで保持する。黒い横長のX投稿ボタンはintentを開き、画像保存と対応環境のWeb Shareを別に用意する。X intentへ画像を直接添付できると説明しない。撮影失敗時に前の結果画像を再利用しない。発射音はOtoLogicのCC BY 4.0音源を25%で再生し、原本MP3とWeb上部の出典表記を維持する。

同時に動かすサブエージェントは**最大2体**。各担当の編集ファイルを分け、同じファイルを同時に編集しない。Godotのインポートは担当間で調整し、同じプロジェクトに対して同時実行しない。

検証結果は実行した環境と範囲に合わせて報告する。Godotのheadless成功、WebAssemblyの生成・ロード、Node.jsの確認画像を、Safari・Chrome・Firefoxでの実機QA成功と言い換えない。未確認の描画、入力、端末差、難易度調整は未確認と記載する。

## ZIP配布とGitHub Pages

ゲーム本体と合計約290KBの未改変の公式JS・音声workletはGitHub Pagesへ公開する。重いWASMは完全版ZIPから取り出す。対象は公開リポジトリ`RabbitDaisuke/nandemo-cannon`。`Deploy Pages`はmainへのpushと、入力項目のない`workflow_dispatch`で起動する。

runtime/sourceの2jobを並列に実行する。`./build.sh runtime`は公式Webテンプレートを抽出し、`./build.sh source`は検証と公式Web exportを行ってエンジンファイルを成果物から除く。upload-artifactの名前は`web-runtime`と`web-game`。両jobを`needs`に持つdeploy jobで、download-artifactの`pattern: web-*`、`merge-multiple: true`により`out/standalone/`へ結合し、`GITHUB_TOKEN`を渡して`./build.sh deploy`を実行する。
deployはZIP32のstore方式で`out/packages/nandemo-cannon-web-4.7.2.zip`を作り、`unzip -t`と必要な内容の検査を通す。ZIPにはエンジンを含む自己完結Web一式を収め、同じZIPを`dist/downloads/`へコピーする。`tools/publish-archive.mjs`は同じリポジトリの保管・配布用`cdn-assets`ブランチへZIP、ルートの`LICENSE`、`licenses/godot/`の公式原本、管理用README・マーカーだけを保存する。展開済みWeb一式は置かない。公式原本の文書はバイト改変せず同梱する。通常のGitファイルを使い、Git LFSは使わない。`main`、ソースのブランチ、指定ミラー側のリポジトリをこの処理から変更しない。

配信providerはGitHub Pages。`runtime.json`の`archives`は`{url, bytes?, sha256?}`の配列で、`./downloads/nandemo-cannon-web-4.7.2.zip`と`https://daisukedaisuketeam.github.io/nanndemo/downloads/nandemo-cannon-web-4.7.2.zip`を設定する。JS・workletはPagesの`runtime/godot/4.7.2/`へ置く。クライアントは起動ごとに50%ずつで片方を選び、通常1回のZIP取得でWASMを取り出す。同時要求はPromiseを共有する。HTTP・通信・整合性エラー時だけ他方を1回試す。自前ZIPには全体のサイズ・SHA256を設定し、指定ミラーの旧ZIPは取り出した公式WASMのSHA256で互換性を確認する。

配信先への事前プローブや指定ミラーへの再アップロードを追加しない。ローカル検査後に`dist/`を作って公開する。ブラウザで両ミラーからの取得に失敗したら起動エラーを表示する。実配信先からのZIP取得を確認していない場合は未確認と記載する。

deploy jobは生成物ブランチ保存用の`contents: write`と、Pages公開用の`pages: write`、`id-token: write`を持ち、`github-pages`環境を使う。書き込み先の限定は公開スクリプトで維持する。ZIPをupload-artifactへ保存した後、`dist/`をupload-pages-artifactへ渡し、deploy-pagesでゲームをGitHub Pagesへ公開する。公式Actionは完全なコミットSHAで固定する。
