# 開発時の指示

このリポジトリは「なんでもキャノン」のGodotプロジェクトをルートに置く。依頼済みの実装、修正、検証を完了まで進める。このファイルを根拠に新しい承認段階を作らず、ユーザーが既に示した依頼と許可を引き継ぐ。

## 構成とビルド入口

- `project.godot`、`main.tscn`、`export_presets.cfg`はルートのGodot設定。
- `src/`はGDScriptによるゲーム実装、`data/`は物体とステージの定義、`assets/`はSVG原稿と生成素材。
- `tools/`はビルドと検証の補助実装、`tests/`はGodotのheadless試験、`web/`はWeb起動用のファイル。
- `docs/`は仕様と引き継ぎ、`previews/`は検証結果とNode.jsで作った確認画像。
- `out/standalone/`は自己完結するWeb出力、`out/runtime/godot/4.7.2/`は別配布するランタイム、`dist/`はPages公開対象の生成物。`.github/workflows/pages.yml`は手動のGitHub Pages公開ワークフロー。

人とCIのビルド入口はルートの`./build.sh`へ統一する。サブコマンドは`bundle`（省略時）、`check`、`preview`、`pages`。依存の導入、Godotの取得、Export Templatesの準備、素材生成、Web出力はこの入口から行う。GitHub Actions側へ`npm install`、Godotのダウンロード、個別のビルド処理を重複して追加しない。

```sh
./build.sh
./build.sh check
./build.sh preview
./build.sh pages
```

`pages`はGitHubへの生成物保存を伴う公開用の処理。GitHub Actionsでは実行対象の`GITHUB_REPOSITORY`と、ビルドステップへ渡す`GITHUB_TOKEN`を使う。外部ランタイムURLの入力・repository variableは不要。対象が公開リポジトリでない場合は失敗させ、公開設定を自動変更しない。

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

公開は入力項目のない`Deploy Pages`の`workflow_dispatch`で手動実行する。ワークフローのビルドコマンドは`./build.sh pages`だけとし、`GITHUB_TOKEN`をそのステップの環境変数へ渡す。

`pages`の内部で試験とWeb出力を行い、`out/runtime/godot/4.7.2/`にある実際の`.wasm.gz`とエンジンJSなどを、同じリポジトリの`cdn-assets`ブランチへ通常のGitファイルとして保存する。Git LFSは使わない。生成ランタイムに変更がなければ既存コミットを再利用する。`main`やソースのブランチをこの処理からpushしない。

配信先は`https://cdn.statically.io/gh/OWNER/REPO@SHA/runtime/godot/4.7.2/`とし、`SHA`には生成物の実コミットSHAを入れる。移動するブランチ名で配信先を固定した扱いにしない。Staticallyから実際に取得し、CORS、内容のハッシュ、MIMEを検証した後で`dist/`を生成する。取得失敗や内容不一致を成功と扱わず、Pages側のエンジン同梱へ切り替えて配信失敗を隠さない。小さなテキストの取得成功を、大きなgzipエンジンの配信確認として扱わない。

ワークフローがPagesへアップロードするのは`dist/`だけ。ビルドジョブは生成物ブランチへの保存に必要な`contents: write`と`pages: read`を持つ。これはトークン自体をブランチ限定にする設定ではないため、書き込み先の限定は公開スクリプトで維持する。公開ジョブは`github-pages`環境と`pages: write`、`id-token: write`を使う。公式Actionは完全なコミットSHAで固定する。
