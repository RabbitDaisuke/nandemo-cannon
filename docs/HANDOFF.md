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
|`./build.sh runtime`|公式テンプレートから`out/engine/`にランタイムを抽出|
|`./build.sh source`|検証・画像生成・公式Web exportを行い、エンジンを除いた`out/game/`を作成|
|`./build.sh deploy`|結合済みWeb出力をZIP化し、ローカル検証後にZIP公開とPages版生成を行う|
|`./build.sh pages`|`bundle`→`deploy`を順に実行|

`out/standalone/`は圧縮ランタイムを同梱した自己完結版で、Actionsの成果物結合先でもある。`bundle`の`out/runtime/godot/4.7.2/`と`runtime`の`out/engine/runtime/godot/4.7.2/`には公式JS3ファイル、`godot.wasm.gz`、manifest、原本ライセンスを作る。展開後のWASMは未改変の公式原本と同一。ZIPは`out/packages/nandemo-cannon-web-4.7.2.zip`で、エンジンを含む完全な自己完結Web版。`dist/`はゲーム本体と公式JS・音声worklet約290KBをGitHub Pagesで配信し、WASMだけをStaticallyのZIPから取得する。生WASMと分割ファイルは配布しない。

## 配信方針

公開リポジトリ`RabbitDaisuke/nandemo-cannon`からGitHub Actionsでゲーム本体と小さな公式JSをGitHub Pagesへ公開する。Staticallyは完全版ZIPを配信し、ブラウザがZIP内のWASMのgzipを取り出す。Sitesは使わない。SettingsのPages公開元をGitHub Actionsにし、mainへpushするか、Actionsの`Deploy Pages`からRun workflowを実行する。外部URLの手入力や追加のCDN資格情報は不要。

Actionsはruntime/sourceの2jobを並列実行し、`./build.sh runtime`と`./build.sh source`の結果を`web-runtime`、`web-game`としてupload-artifactへ渡す。deploy jobは両方を待ち、download-artifactの`pattern: web-*`、`merge-multiple: true`で`out/standalone/`へ結合して`./build.sh deploy`を実行する。
deployはstore方式で完全版ZIPを作り、`unzip -t`と内容の整合性をローカルで確認する。標準の`GITHUB_TOKEN`と`GITHUB_REPOSITORY`を使い、同じリポジトリの`cdn-assets`へ`downloads/nandemo-cannon-web-4.7.2.zip`、ルートの`LICENSE`、`licenses/godot/`の原本4文書・元URL、管理用README・マーカーだけを置く。展開済みWeb一式は重複保存しない。deploy jobに`contents: write`が必要。mainやソースブランチは変更せず、管理対象でない既存ブランチは上書きせず止める。

配信URLは`https://cdn.statically.io/gh/OWNER/REPO@SHA/downloads/nandemo-cannon-web-4.7.2.zip`。生成物の実コミットSHAを固定し、Pagesの`runtime.json`へ`archiveURL`とZIPのSHA256を記録する。ローカルのZIP・内容検証後に`dist/`を作り、upload-pages-artifactとdeploy-pagesで公開する。CDNからの事前取得は公開条件にせず、一時的なタイムアウトで公開を止めない。

Pagesの`runtime/godot/4.7.2/`には未改変の公式JSと音声workletを置く。`wasm-loader.mjs`は対象WASMのfetchを捕捉し、Staticallyから完全版ZIPを1回取得してSHA256を照合し、中の`runtime/godot/4.7.2/godot.wasm.gz`を取り出す。gzipの整合性も確認して`DecompressionStream`で展開し、公式Godotへ`application/wasm`のResponseを返す。自己完結版では同梱gzipを読む。起動処理後にfetchを復元する。CDN取得失敗時は起動エラーとし、重いWASMをPagesへfallbackしない。詳細は`BROWSER.md`を参照。

## 検証と残作業

Godot 4.7.2でgame 103、body 12、hazard 37、cannon 26の計178項目を確認した。初期冷蔵庫の得点、既存得点物、20マップ読み込み、砂場の117種類選択、15投の終了、有限燃料、水・氷・爆発、接地摩擦、大砲入力を含む。公式Web exportと出力PCKのheadless起動も成功した。圧縮ローダー3経路（gzip、HTTP解凍済み、不正データ拒否）はNodeで検証した。`previews/game-*.png`は実Godot状態をNodeで再構成した画像で、実ブラウザのスクリーンショットではない。

2026-10-23の[初回Actions実行](https://github.com/RabbitDaisuke/nandemo-cannon/actions/runs/39948450309)ではruntime/sourceの両jobと178項目の検証が成功し、成果物結合、ZIP検査、`cdn-assets`への保存まで完了した。この実行は旧構成で、公開条件にしていたStaticallyのGETが60秒でタイムアウトし、再実行を含め2回ともPages公開に到達しなかった。新構成でのPages公開と実CDNからの完全版ZIP取得は未確認。HEADや小さなテキストの成功をZIP全体の取得成功と扱わない。

許可された環境でのSafari・Chrome・Firefox実機確認も残る。ローカル出力の成功でこれらの完了を代替しない。実機結果から最低ブラウザバージョン、GPU性能、音声、保存、スマートフォンの文字サイズ・ドラッグ量を調整する。全ステージの攻略バランスにも実プレイでの調整余地がある。

ステージ17以降のルールはユーザーが後から考える意向を尊重して未設定。既存117個の原稿を余白付き画像へ置き換えたり、滑走物を速度固定の疑似物理へ戻したり、炎を静止画だけに戻したりしない。
