# なんでもキャノン — Godot 4.7.2

大砲から物を投げ、火・水・氷・爆発を使って置き場を作り、青いエリアへ積むブラウザ向け物理ゲーム。ゲーム本体はGDScriptとGodotの2D物理で実装し、**Godot 4.7.2 stable / WebAssembly / WebGL 2 / 単一スレッド**へ固定した。エンジンのソースコードをクローンしなくても、公式エディタと同じ版のExport Templatesで開発・出力できる。

## 収録内容

- 213種類の小物。食品、おもちゃ、ゴム、冷凍銃、雷玉などを収録。100種類は上限にしない。
- 32種類のマップで各15投。番号は連番で、21はランダム実験室、22はおもちゃうりば、32は爆発実験室。
- 独立した砲身の回転軸、砲口に追従する射出位置、反動、選択輪郭。台座は回転しない。
- 発射音「オノマトペ 衝撃01」は[OtoLogic](https://otologic.jp/) / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原本MP3を再生音量25%で使用し、起動画面にクレジットを大きく表示。プレイ中は表示しない。詳細は`web/licenses/otologic.txt`。
- 個別の当たり判定、燃焼と消火、有限燃料、耐爆確率、衝突と継続荷重による破損、水流と反射、氷床、車輪の接地、凍結したゴムの脆化。
- 小物・マップは16bit風SVG。大砲2案・ロゴ・日本語フォントは画像生成し、`.mjs`でパーツ分割・切り詰め・lossless WebP化。フォントはひらがな全86字と反復記号、カタカナ、HUD文字・記号を含む246字。小物を拡大するために透明余白を増やさない。

## 遊び方

起動画面の「はじめる」を押す。大砲を上下へドラッグすると角度、左右へドラッグすると火力が変わる。第1面の十字矢印で操作を案内する。短いクリック／タップで発射し、ドラッグを離しただけでは発射しない。大砲に重なる絵が装填中の物体で、「つぎ」はその次の物体。

画面下のスライダーでも調整できる。キーボードは上下で角度、左右で火力、Spaceで発射、Rで再挑戦、MまたはEscでマップを開く。マウスはゲーム面の左クリックと中クリックでも発射できる。メニュー操作では発射しない。装填物は実際の投射物と1:1で表示する。砂場となんでも実験室は全213種類から自由選択でき、選ばなければ既定の順番で進む。合計15投は変わらず、残り0個では選択を開けない。

タッチは2本以上の指で全ゲームを1〜2.5倍へ拡大でき、指の中心にある場所を基準に移動する。2本指になった時点で大砲のドラッグやUIの押下を取り消し、全指を離すまでゲーム操作を抑止する。拡大中も物理演算は続く。マップは15件ずつ3ページに分かれ、「まえのページ」「つぎのページ」で切り替える。

「とくてん」は0.5秒ごとに現在の配置から計算する。有効な物体の全当たり判定が青いエリアに入った場合だけ基本点と高さボーナスを付ける。高さは基準床から物体中心までの縦方向の距離で、16pxごとに10点。放置時間や横方向の距離では増えない。ボーリングの初期配置ピンはエリア内に残ると1本−100点で、高さボーナスは付かない。抽選枠があるステージではサイズ・高さ・性質を合わせた候補から選び、導入道具は固定する。第21面は全カタログから15個を抽選する。同じシードでは同じ投射リストになる。もの・マップ・シードを開いても飛行、火、水、時計は進み、開閉で速度や時間倍率を変えない。15投後の確定時は、開いていたメニューを結果画面へ置き換える。結果確定後と非表示タブの自動停止は別扱い。

結果画面を重ねる前に、確定スコア入りのゲーム画面をJPEGとして撮影し、メモリへ保持する。黒い横長の「X でポスト」で文章・スコア・ゲームURL入りの投稿画面を開き、「がぞうをほぞん」でJPEGを保存できる。Xの投稿画面へ画像は直接添付できないため、保存した画像を自分で添付する。ファイル共有に対応する環境では「がぞうつきでシェア」も使える。

## ステージ

|番号|舞台|主なルール|
|---|---|---|
|1|なんでもキャノン|左右端の壁、基本の発射と高さボーナス|
|2|ちかしつ|実際に開いた地下へ積み、底の床から高さを計測|
|3|月面|クレーター、重力160。通常980より弱い|
|4|ろじうら|山積みの箱とゴミを燃やし、床への延焼を水で消す|
|5|かざん|中央に火口がある山へ積む。頂部の炎を消す|
|6|高層ビル|大砲は屋上。左端・中央・後方の奈落で物体消滅|
|7|家|既存の得点物、射線を妨げる洗濯機|
|8|船|最初の爆弾3個。チュートリアル箱は有効爆風3回で壊れる|
|9|忍者|鐘、手裏剣は円形判定|
|10|ボーリング場|球の次に強力爆弾。残った初期ピンは減点|
|11|川|流れと橋、有限容量のスポンジ2個|
|12|洗面台|一定量の水がたまると蛇口が止まる|
|13|ガスコンロ|水なし。消えない火源を金属の鍋で遮る|
|14|帝国城|空洞台座と堀、火・水・氷・車輪を併用|
|15|砂場|全カタログから自由選択、15投制限|
|16|レストラン|くぼみを持つ皿へ食品と食器15個を投げる|
|17|整備工場|タイヤ、車のドア、助手席など指定の15個|
|18|氷床（暫定移設）|低摩擦。靴も通常の剛体として滑る。番号はユーザー未指定|
|19|お祭り|紅白の台の箱やゴミを時間差で炸裂する花火で片付ける|
|20|なんでも実験室|水・火・爆発・氷の既定15投、または自由選択|
|21|ランダム実験室|全213種類からシードで15個を抽選|
|22|おもちゃうりば|浮いた棚へおもちゃを積む|
|23|じゃまもの|大きな木の壁を炎や爆弾で片づける|
|24|3じのおやつ|菓子と食器を積む|
|25|ゴムとれいとうじゅう|弾むゴムを凍らせると脆くなる|
|26|かみなり実験|時間差の落雷、爆風、床への着火|
|27|れいとうこ|氷の床と棚、冷気と滑走|
|28|たんじょうびパーティー|ケーキ、ろうそく、贈り物|
|29|いざかやさん|衝突する吊り下げライトが揺れる|
|30|こわれものちゅうい|ガラスや陶器、爆弾、火|
|31|やっかいなばしょ|横・縦に動く足場へ投げる|
|32|ばくはつ実験室|狭い足場と溝、強力な爆風|

## ビルド

入口はリポジトリ直下の`./build.sh`に統一した。Node.js 22以上とBashを用意し、リポジトリのルートで実行する。

```sh
./build.sh
```

引数なしは`bundle`。4種類の物理・進行検証、Node画像生成、公式Godot 4.7.2によるWeb exportを順に実行する。

|コマンド|用途・出力|
|---|---|
|`./build.sh` または `./build.sh bundle`|検証とWeb export。`out/standalone/`と`out/runtime/godot/4.7.2/`を作る|
|`./build.sh check`|Godot headlessで4つの検証suiteを実行する|
|`./build.sh preview`|NodeだけでSVG素材と保存済みゲーム状態から確認画像を生成する|
|`./build.sh runtime`|公式テンプレートからランタイムを抽出し、`out/engine/`を作る|
|`./build.sh source`|検証と公式Web exportを行い、エンジンを除いた`out/game/`を作る|
|`./build.sh deploy`|結合済み`out/standalone/`をZIP化してローカル検証し、ZIPを公開して`dist/`を作る|
|`./build.sh pages`|`bundle`→`deploy`を順に実行する|

Godotの自動セットアップはLinux x86_64のみ対応する。ほかのOS、または既存エディタを使う場合は、公式4.7.2の実行ファイルを`GODOT_BIN`で指定する。同じ版のExport Templatesも必要。WindowsではGit BashなどのBash環境から実行する。

```sh
GODOT_BIN=/absolute/path/to/godot ./build.sh
```

Godotエディタで編集する場合は`project.godot`を開き、F5でゲーム全体を実行する。npmの`godot@0.7.10`は別のNodeイベント処理パッケージなので使用しない。エンジン本体のソースクローンも不要。

## GitHub ActionsとPages

ゲーム本体と小さな公式JS・音声workletはGitHub Pagesで配信する。重いWASMは完全版ZIPから取り出す。公開リポジトリは[RabbitDaisuke/nandemo-cannon](https://github.com/RabbitDaisuke/nandemo-cannon)。`Deploy Pages` workflowはmainへのpushと手動実行で起動する。Sitesは使用しない。

1. ソースを`RabbitDaisuke/nandemo-cannon`のmainへpushする。
2. リポジトリの **Settings → Pages → Source** を **GitHub Actions** にする。
3. mainへのpushで起動した**Deploy Pages**を確認する。手動では**Actions → Deploy Pages → Run workflow**を実行する。

`runtime`と`source`の2jobが並列に`./build.sh runtime`と`./build.sh source`を実行し、`web-runtime`と`web-game`をupload-artifactへ渡す。両方の完了後、deploy jobがdownload-artifactの`pattern: web-*`、`merge-multiple: true`で`out/standalone/`へ結合し、`./build.sh deploy`を実行する。

deployはエンジンを含むWeb全体をZIPのstore方式でまとめ、`unzip -t`と内容の整合性をローカルで確認し、同じZIPを`dist/downloads/`へ置く。`tools/publish-archive.mjs`は標準の`GITHUB_TOKEN`で、同じリポジトリの`cdn-assets`ブランチへZIP、ルートの`LICENSE`、Godotの原本ライセンス、管理用README・マーカーだけを保管する。展開済みWeb一式はブランチへ重複保存しない。deploy jobに`contents: write`が必要で、mainのソースと指定ミラー側のリポジトリは変更しない。

`runtime.json`の`archives`には`./downloads/nandemo-cannon-web-4.7.2.zip`と、ユーザー指定の`https://daisukedaisuketeam.github.io/nanndemo/downloads/nandemo-cannon-web-4.7.2.zip`を設定する。起動ごとに50%ずつの確率で片方を選び、通常はZIPを1回だけ取得する。HTTP・通信・整合性エラー時だけ、もう片方を1回試す。同時要求は同じPromiseを共有する。自前ZIPはサイズとSHA256を照合し、指定ミラーの旧ZIPは取り出した公式WASMのSHA256で互換性を確認する。配信先への事前プローブは行わない。

`out/standalone/`は圧縮ランタイムを同梱した自己完結出力。`bundle`の`out/runtime/godot/4.7.2/`と`runtime`の`out/engine/runtime/godot/4.7.2/`には、公式のJS3ファイル、`godot.wasm.gz`、manifest、原本ライセンスを生成する。ZIPは`out/packages/nandemo-cannon-web-4.7.2.zip`。復号後のWASMは公式原本と同一で、分割ファイルや生WASMは配布しない。

Pages側はゲーム資産に加え、未改変の公式JS・音声worklet約290KBを`runtime/godot/4.7.2/`で配信する。WASMは選ばれたZIPから取り出したgzipを`DecompressionStream`で展開してGodotへ渡す。自己完結版では同梱gzipを使う。詳しくは`docs/BROWSER.md`。

2ミラー構成は[Actions実行39953964261](https://github.com/RabbitDaisuke/nandemo-cannon/actions/runs/39953964261)で全job成功・Pages公開済み。以降の変更の公開結果は該当コミットのDeploy Pages実行を参照。

## 確認した範囲

従来の20面版ではGodot 4.7.2のheadless検証で、15投の進行、凹皿とドーナツの穴、花火の実衝突と時限爆発、火・水・氷、車輪と靴底、入力、装填表示、発射音設定などを扱った。最新の件数・結果は`previews/*-checks.json`を参照する。画像撮影やWeb Shareの実ブラウザ動作はheadless検証と区別する。

213種類・32面への拡張後、Godot headlessで470項目（剛体66・大砲39・相互作用65・ゲーム300）が成功。手動メニュー中の演算継続、残0選択禁止、位置基準ピンチ、凍結ゴム、卓上コンロ、雷、可動地形を含む。Nodeで実状態から21画面を再構成して確認した。ブラウザ実機でのタッチ・画像共有・描画は別途確認が必要。

公式Web export、出力PCKのheadless起動、WASMのコンパイル、圧縮ローダー3経路（gzip、HTTP解凍済み、不正データ拒否）もローカルで確認した。実配信先からのZIP取得の確認を代替するものではない。

大砲・ロゴ・フォント原稿は内蔵画像生成を使用し、プロンプトを`assets/generated/prompts.json`と`japanese-prompts.json`に保存した。Node.jsと`sharp` 0.35.5で分割・変換・確認し、ブラウザは開かない。`previews/game-*.png`は実Godotの状態JSONと実際に使うSVG/WebP素材から再構成した確認画像で、プレイヤーの結果JPEGとは別。フォントの正確な収録文字と件数は`assets/font/generated-coverage.json`に記録する。日本語全文字の汎用フォントではない。`preview`だけでは物理を再実行しないため、最新状態が必要な場合は先に`check`を実行する。

Safari・Chrome・Firefoxの実機起動、操作感、GPU描画、音声、保存、全ステージの難易度調整は未確認。headless検証やWeb export成功を、実ブラウザでの成功として扱わない。プレイヤーにNode.jsやGodotのインストールは不要だが、`file://`直開きではなくHTTP(S)配信が必要。

詳細は`docs/IMPLEMENTATION.md`、`docs/CANNON.md`、`docs/BODIES.md`、`docs/INTERACTIONS.md`、`docs/GAMEPLAY.md`。引き継ぎは`docs/HANDOFF.md`。ライセンスは元の`LICENSE`と`web/licenses/godot/`をそのままWeb・ZIPへ同梱する。Godotの原本は`LICENSE.txt`、`COPYRIGHT.txt`、`AUTHORS.md`、`thirdparty/README.md`で、元URLは`SOURCES.txt`を参照。
