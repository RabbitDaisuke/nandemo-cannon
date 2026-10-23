# 実装引き継ぎ

SVG素材からGodotの実ゲームへ接続した版。ユーザーの指定に従い、Godot 4.7.2 stable、WebAssembly、WebGL 2、単一スレッドを使う。エディタとExport Templatesは同じ4.7.2に固定し、エンジンのソースクローンは不要。npmの`godot@0.7.10`は別のNodeイベント処理パッケージなので使用しない。ローカルブラウザ禁止を維持し、物理・進行はGodot headless、画像はNode.jsとsharpで確認する。アートの原稿はSVGで、Nodeは読み込み・配置・ラスタライズを担当する。

## 実装状態

小物は117種類。100は上限ではない。20マップのうち1〜16が15投のゲームで、17〜20はアートと地形のプレビュー。地下、クレーター、ビルの奈落、橋、洗面台の水源、コンロの火、城の空洞台座、氷床まで実際の地形・状態を持つ。15投は初期配置とは別。砂場では全カタログから選べる。大砲は台座を固定し、砲身だけを動かす。角度5〜85度、火力15〜100%、砲口へ追従する発射、反動、ドラッグとタップの分離を実装した。

火炎放射器は6秒で燃料切れになり、空のSVGへ変わる。焚火とランタンも有限燃料を持つ。水は火を消し、氷は水を凍らせ、熱で融ける。傘は天蓋だけでなく軸と持ち手を含む全fixtureで水滴を反射する。車輪系は正しい向きで車輪が接触しているときに滑走し、反転すると通常の固体になる。靴は靴底が接触したときだけ摩擦を追加する。割れ物は衝撃と継続荷重で壊れる。爆発は通常物の確率判定と船の箱の有効爆風3回保証を分けた。水量上限や消滅処理を設け、エフェクトを採点物に含めない。

15投後は静止判定または最大12秒で得点を確定する。MAPなどのモーダルと非表示タブの一時停止は、物理とゲーム時計を止める。第4・5面は軽いチュートリアル品が飛びすぎないよう初期照準を35度・34%にし、火炎瓶の着火と新聞の燃焼消滅を検証した。

## ビルド入口と出力

ユーザー向け・CI向けの入口はルートの`./build.sh`一本。Node.js 22以上とBashを使う。Godotの自動セットアップはLinux x86_64のみ。WindowsやほかのOSで既存エンジンを使う場合は`GODOT_BIN`を指定し、公式4.7.2と同じ版のExport Templatesを用意する。WindowsからもGit Bashなどで同じ入口を呼ぶ。

|操作|意味|
|---|---|
|`./build.sh` / `./build.sh bundle`|物理4suite→Node画像→公式Web export→開発用出力とCDN用ランタイムを作成|
|`./build.sh check`|4suiteを再検証し、実ゲームの状態JSONを更新|
|`./build.sh preview`|保存済み状態JSONとSVGからNodeだけでプレビュー生成|
|`./build.sh pages`|ActionsからCDN用ブランチへ保存し、実Statically取得の検証後に軽量Pages版を生成|

`out/standalone/`は圧縮ランタイムを同梱したローカル開発用の自己完結版。`out/runtime/godot/4.7.2/`には公式JS3ファイル、`godot.wasm.gz`、manifest、ライセンスを作る。復号後のWASMは未改変の公式原本と同一。`dist/`は約0.92MBの軽量Pages版で、GodotのJS・WASM・音声workletを含めず、起動設定がStaticallyを指す。生WASMと分割ファイルは配布しない。

## 配信方針

単体の公開GitHubリポジトリ→GitHub Actions→GitHub Pagesで公開する。Sitesは使わない。ソースをコミットし、SettingsのPages公開元をGitHub Actionsへ変更して、Actionsの`Deploy Pages`からRun workflowを実行する。workflowも同じ`./build.sh pages`を使う。外部URLの手入力や追加のCDN資格情報は不要。

Actionsは標準の`GITHUB_TOKEN`と`GITHUB_REPOSITORY`を使用し、同じリポジトリの`cdn-assets`ブランチへランタイムを通常のGitファイルとして保存する。ビルドjobの`contents: write`はこのために必要。mainやソースブランチは変更しない。管理対象でない既存ブランチは上書きせず止める。

配信URLは`https://cdn.statically.io/gh/OWNER/REPO@SHA/runtime/godot/4.7.2/`。実コミットSHAを固定し、ランタイムが同一ならコミットを再利用してキャッシュを維持する。CDNからの実取得、CORS、JavaScriptのMIME、サイズ・SHA256照合に通った後だけ`dist/`を作り、Pagesへ渡す。CDNが失敗したら公開を止め、10MB級のエンジンをPagesへfallbackしない。

`wasm-loader.mjs`は対象WASMのfetchだけを捕捉して`godot.wasm.gz`を取得し、SHA256を照合して`DecompressionStream`で復号する。公式Godotへは`application/wasm`のResponseを返す。HTTP側で解凍済みなら公式原本のSHA256を確認し、二重解凍しない。起動処理後にfetchを復元する。gzip展開に未対応のブラウザには更新を促すメッセージを出す。拡張子の偽装や分割配信は使わない。詳細は`BROWSER.md`を参照。

## 検証と残作業

Godot 4.7.2でgame 103、body 12、hazard 37、cannon 26の計178項目を確認した。初期冷蔵庫の得点、既存得点物、20マップ読み込み、砂場の117種類選択、15投の終了、有限燃料、水・氷・爆発、接地摩擦、大砲入力を含む。公式Web exportと出力PCKのheadless起動も成功した。圧縮ローダー3経路（gzip、HTTP解凍済み、不正データ拒否）はNodeで検証した。`previews/game-*.png`は実Godot状態をNodeで再構成した画像で、実ブラウザのスクリーンショットではない。

この会話ではリポジトリURLが未提供。残作業はソースのGitHubへの配置、Deploy Pagesの実行、実Statically取得の検証、Pages版の生成・公開、許可された環境でのSafari・Chrome・Firefox実機確認。ローカル出力の成功でこれらの完了を代替しない。実機結果から最低ブラウザバージョン、GPU性能、音声、保存、スマートフォンの文字サイズ・ドラッグ量を調整する。全ステージの攻略バランスにも実プレイでの調整余地がある。

ステージ17以降のルールはユーザーが後から考える意向を尊重して未設定。既存117個の原稿を余白付き画像へ置き換えたり、滑走物を速度固定の疑似物理へ戻したり、炎を静止画だけに戻したりしない。
