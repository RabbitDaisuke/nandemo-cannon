# なんでもキャノン — Godot 4.7.2

大砲から物を投げ、火・水・氷・爆発を使って置き場を作り、青いエリアへ積むブラウザ向け物理ゲーム。ゲーム本体はGDScriptとGodotの2D物理で実装し、**Godot 4.7.2 stable / WebAssembly / WebGL 2 / 単一スレッド**へ固定した。エンジンのソースコードをクローンしなくても、公式エディタと同じ版のExport Templatesで開発・出力できる。

## 収録内容

- 117種類の小物。100種類を上限にせず、テニスラケット、砂時計、傘、リュック、燃料ランタン、焚火、丸太、ティーポット、花瓶、懐中時計、巻物、カメラ、氷系まで収録。
- 20種類のマップ。ステージ1〜16は15投のプレイ対象。17〜20は地形とアートのプレビューで、投射順や攻略ルールは未設定。
- 独立した砲身の回転軸、砲口に追従する射出位置、反動、選択輪郭。台座は回転しない。
- 個別の当たり判定、燃焼と消火、有限燃料、耐爆確率、衝突と継続荷重による破損、水流と反射、氷床、車輪の接地、靴底の摩擦。
- SVG直書きの16bit風アートと自作SVG文字。マップとフォントアトラスは`.mjs`でラスタライズ。小物を拡大するために透明余白を増やさない。

## 遊び方

起動画面のSTARTを押す。大砲を上へドラッグすると仰角、左へドラッグすると火力が上がる。調整後、大砲を短くクリック／タップすると発射する。画面上部のスライダーでも調整できる。

キーボードは上下で角度、左右で火力、Spaceで発射、Rで再挑戦、MまたはEscでマップを開く。MAPはステージ選択、RETRYは同じステージのやり直し、SEEDは16桁の再現用乱数設定。ステージ15だけITEMから117種類を選べるが、合計15投は変わらない。

採点は物体の当たり判定全体が青いエリア内にあるかで決まる。破壊・燃焼消滅・奈落落下した物や消耗品のエフェクトは得点しない。15投後、落ち着いたら確定する。水や氷で動き続ける場合も12秒で確定する。マップ画面などを開いている間は物理と燃料の時間を止める。Webの非表示タブから戻ったときもRESUMEで再開する。

## ステージ

|番号|舞台|主なルール|
|---|---|---|
|1|POC平地|基本の発射、全体包含による採点|
|2|地下|地形の当たり判定を実際に開けた穴へ積み上げる|
|3|月面|クレーター、重力160。通常980より弱い|
|4|路地裏|箱とゴミを燃やす。床への延焼を水で消す|
|5|火山|最初の新聞束で燃焼を見せ、水系へ進む|
|6|高層ビル|大砲は屋上。左端・中央・後方の奈落で物体消滅|
|7|家|既存の得点物、射線を妨げる洗濯機|
|8|船|最初の爆弾3個。チュートリアル箱は有効爆風3回で壊れる|
|9|忍者|鐘、手裏剣は円形判定|
|10|ボーリング場|配置済みピンと重い球|
|11|川|水の抵抗・流れ・浮力、橋の天板と支柱|
|12|洗面台|有限水源、歯ブラシ、歯磨き粉、傘の全判定反射|
|13|ガスコンロ|水なし。消えない火源を金属の鍋で遮る|
|14|帝国城|空洞台座と堀、火・水・氷・車輪を併用|
|15|砂場|117種類の自由選択、15投制限|
|16|氷床|低摩擦。靴底の接地部分だけ滑り止め|
|17〜20|空洞台座・地下鉄跡・水道橋・古城|現行マップのプレビュー。最新の追加要望は`docs/HANDOFF.md`へ記録し、未実装|

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

2026-10-23の[Actions実行39950881028](https://github.com/RabbitDaisuke/nandemo-cannon/actions/runs/39950881028)は全jobが成功し、GitHub Pagesへの公開まで完了した。今回の2ミラー構成を反映する次の実行結果は未確認。

## 確認した範囲

Godot 4.7.2でgame 103項目、body 12項目、hazard 37項目、cannon 26項目の計178項目が成功した。20マップ読み込み、15投の進行、初期照準の着弾・着火、得点、奈落、有限燃料、水・氷・爆発、車輪と靴底、大砲の入力を含む。

公式Web export、出力PCKのheadless起動、WASMのコンパイル、圧縮ローダー3経路（gzip、HTTP解凍済み、不正データ拒否）もローカルで確認した。実配信先からのZIP取得の確認を代替するものではない。

画像生成はNode.jsと`sharp` 0.35.5を使用し、ブラウザを開かない。`previews/game-*.png`は実Godotの状態JSONとSVG素材から再構成した確認画像。`preview`だけでは物理を再実行しないため、最新状態が必要な場合は先に`check`を実行する。

Safari・Chrome・Firefoxの実機起動、操作感、GPU描画、音声、保存、全ステージの難易度調整は未確認。headless検証やWeb export成功を、実ブラウザでの成功として扱わない。プレイヤーにNode.jsやGodotのインストールは不要だが、`file://`直開きではなくHTTP(S)配信が必要。

詳細は`docs/IMPLEMENTATION.md`、`docs/CANNON.md`、`docs/BODIES.md`、`docs/INTERACTIONS.md`、`docs/GAMEPLAY.md`。引き継ぎは`docs/HANDOFF.md`。ライセンスは元の`LICENSE`と`web/licenses/godot/`をそのままWeb・ZIPへ同梱する。Godotの原本は`LICENSE.txt`、`COPYRIGHT.txt`、`AUTHORS.md`、`thirdparty/README.md`で、元URLは`SOURCES.txt`を参照。
