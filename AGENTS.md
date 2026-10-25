# 開発時の指示
自由選択専用61種を追加し、現在338物体・45ステージ。`selectionOnly: true`は一覧と手動検索で選べるが、`randomCatalog`の抽選には入らない。`catalogSelectable: false`とは別の設定で、従来の非表示物の抽選可否は変えない。既存45面のキュー・抽選シード・15投制限を保持する。追加原稿は`tools/selection-food.mjs`と`tools/selection-tools.mjs`、再生成は`./build.sh selection-items`。新規名称はかな表記、検索タグは引き続き手書き。注射器は撤回。「モルセット」は誤記憶と訂正され、金色の脚を持つ`eight-bit-cpu`（はちビットシーピーユー）を追加した。釣り竿の糸・機械の作動・ガラスレンズの屈折は追加せず、通常剛体と既存挙動を使う。魚雷は既存の耐水爆発物、氷山は既存の融解する氷として扱う。
モノの追加・改名・削除では最初に[追加手順](docs/ADDING_ITEMS.md)を読む。`data/item-search-index.json`は全モノに個別タグを手書きする検索専用索引。ゲーム分類・材質・挙動・抽選・得点に絶対に接続せず、生成スクリプトから再生成・自動補完しない。
照準の開始範囲は中央プレイ領域（論理座標 x=0〜960、y=128〜470）。UIを除き、PCの左・中ボタンと1本指で共通のドラッグ調整、短いクリック／タップのリリースで発射する。押下時の全画面発射へ戻さない。2本指抑止と第36面の火力制限を維持する。スポンジ24単位・タオル12単位は実形状に触れた水だけを吸収し、満杯後は吸わない。第38面は`finite:true`の静水で、吸水量に応じて水面が下がる。背景へ前景の水を焼き込まない。流水は第11面などの明示したregionに限る。水の力は水中割合を用いた連続処理にし、濡れるたびのsleep解除や定周期インパルスを入れない。
最新構成は277物体・45ステージ。36〜45面と追加小物・ロゴ物体の生成は`tools/extend-late-content.mjs`。第41面「ひとざと」は森と木造家屋を動的な得点物として初期配置し、22候補から15種類を抽選する。建物・山・道路は通常の投げ物に近い模型サイズで自由選択から除外しない。`queue`が15件超なら異なるIDから15種類を重複なし抽選し、`shuffleQueue`で通常キューの順番もシード付きで混ぜられる。候補数22を共通処理へ固定しない。第40面はオフィス。初期配置は共通の`preplaced[].scoring: true`で得点対象にし、通常の全体包含・存命・高さ加算を使う。省略時は従来どおり得点対象外、`scorePenalty`は負点・高さなしを優先する。第36面の火力抽選と半分の軌道表示は`cannonControls`で一般化し、他のステージの角度・火力操作を変えない。アイテム選択ページはステージ内メモリだけに保持し、終了・再挑戦・移動時に忘れる。BGMは実ポーズ・リザルトで1秒フェードアウト後にプレーヤーを停止し、実際のゲーム再開だけでフェードインする。単なるタブ表示復帰で再開しない。曲のメモリキャッシュを捨てない。 第42面はCPU・メモリ3枚・OSなどを投げる基板、第43面は本と可動棚・奈落、第44面は既存30候補から15種類と水・局所氷床・火・負点障害物、第45面は「なんでもキャノン2」。最後の15投目に既存の大砲パーツを原寸で合成した`cannon-object`を投げるが、発射台は固定したまま。カウンターと大砲は`catalogSelectable: false`で自由選択一覧・検索結果だけから除外し、元の大きさ・得点・検索タグを保持する。ステージの指定キューと全カタログ抽選には残す。第45面の説明は最新のユーザー文を2行で保持し、長い説明は共通の横幅を広げたHUDへ配置する。シード画面の2つのボタンは横並びで、別シードでは現在の面を新しく始める。

このリポジトリは「なんでもキャノン」のGodotプロジェクトをルートに置く。依頼済みの実装、修正、検証を完了まで進める。このファイルを根拠に新しい承認段階を作らず、ユーザーが既に示した依頼と許可を引き継ぐ。

## 構成とビルド入口

- `project.godot`、`main.tscn`、`export_presets.cfg`はルートのGodot設定。
- `src/`はGDScriptによるゲーム実装、`data/`は物体とステージの定義、`assets/`はSVG原稿と生成素材。
- `tools/`はビルドと検証の補助実装、`tests/`はGodotのheadless試験、`web/`はWeb起動用のファイル。
- `docs/`は仕様と引き継ぎ、`previews/`は検証結果とNode.jsで作った確認画像。
- `out/standalone/`は自己完結するWeb出力とActions成果物の結合先、`out/engine/`と`out/game/`は並列jobの成果物、`out/packages/`は配布ZIP、`dist/`はPages公開対象。`.github/workflows/pages.yml`はmainへのpushと手動実行で起動する。

人とCIのビルド入口はルートの`./build.sh`へ統一する。サブコマンドは`bundle`（省略時）、`check`、`preview`、`pages`、`runtime`、`source`、`deploy`、`standalone`、`bgm`。依存の導入、Godotの取得、Export Templatesの準備、素材生成、Web出力はこの入口から行う。GitHub Actions側へ`npm install`、Godotのダウンロード、個別のビルド処理を重複して追加しない。

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

UIは日本語にする。228物体・35ステージ・案内文のかな表示は`data/ui-ja.json`、正式名称は既存の`nameJa`を使う。生成フォントはひらがな全86字と反復記号、カタカナ、HUD文字・記号を収録し、現在246字。アの単独リテイクは`assets/generated/katakana-a.webp`。正確な文字集合は`assets/font/generated-coverage.json`を基準にする。英語表示へ戻して欠字を回避しない。

**ローカルブラウザを起動しない。** Playwright等によるブラウザ起動を視覚確認の代わりに追加しない。物理やゲーム状態はGodotのheadless実行、画像の確認はNode.jsで行う。確認画像が状態JSONとSVGからの再構成なら、その由来を明記する。

## 変更と検証

ユーザーの最新要件と既存データを読み、必要な範囲だけ変更する。ファイル検索は`rg`を優先し、UTF-8で読み書きする。`./build.sh check`で変更に関係する検証を行い、失敗した場合は原因を直す。火、水、氷、爆発、車輪、靴底、荷重破損などの実装では、見た目だけで成功と判定しない。

物体は1ステージ15投。16はレストラン、17は整備工場、19はお祭り、20は「なんでも実験室」。18はユーザー未指定のため既存の氷床を暫定配置し、ユーザー確定事項として扱わない。物体100種類は目標値であり、種類数の上限ではない。最新指示に従い、上下ドラッグで角度、左右ドラッグで火力を変える操作を使う。第1面は十字矢印で案内する。装填物は大砲に重ね、「つぎ」にはその次の物体を表示する。

結果の共有画像は、確定スコアを更新してから結果オーバーレイを出す前にゲーム画面をJPEG化し、メモリで保持する。黒い横長のX投稿ボタンはintentを開き、画像保存と対応環境のWeb Shareを別に用意する。X intentへ画像を直接添付できると説明しない。撮影失敗時に前の結果画像を再利用しない。発射音はOtoLogicのCC BY 4.0音源を25%で再生し、原本MP3と起動画面の大きな出典表記を維持する。プレイ中のクレジット常設には戻さない。
得点は有効な全体包含物だけを0.5実秒ごとに再計算する。高さは基準床から縦方向だけを測り、時間経過による累積加点や横距離加点をしない。負点物には高さを加算しない。抽選は`queueSlots`に定義したサイズ・性質別の候補を使い、導入投射と総数15を保つ。砂場となんでも実験室は自由選択でき、未選択なら既定順を維持する。装填表示は投射物と1:1、大砲の選択輪郭は結合後の外周だけ、調整UIは下端へ置く。

ステージ番号は1〜35を連番にする。21は全カタログ抽選、22はおもちゃうりば、32は爆発実験室、33は地下のきゅうきょくじっけんしつ（抽選＋自由選択）、34はおとしあな、35はゲーム。マップ選択は15件ずつのページ切替を使う。手動のもの・マップ・シード画面で物理、火、水、時計を止めず、開閉時に速度、回転、力、時間倍率を変更しない。入力だけを遮断する。残り0では物体選択とプレイ中のマップを開かずグレーアウトし、結果画面のマップ移動は残す。非表示タブの自動停止と結果確定後の停止は手動メニューと分離する。

BGMerの3曲はタイトルでは無音、ゲーム開始後だけ遅延読込する。初期音量2.5%、オン・オフと音量をlocalStorageへ保存し、iOSでもGainNodeで音量調整する。クレジットはトップに大きく置く。音源は`web/audio/bgm/`にあり、PCK・初回取得ZIPには入れずPagesへ別配信する。`web/licenses/bgmer.txt`の出典を保つ。水中で通常爆発物を起爆させず、実形状の半分以上が浸かると不発・得点物にする。`waterproofExplosive`の2種だけは水中でも起爆できる。薄膜水の蒸発量は水量収支へ計上し、凍結水を蒸発させない。

音源は3曲を一巡ごとにランダム再生し、周回の境目でも同じ曲を連続させない。各曲の初回だけ自前Pagesと`https://daisukedaisuketeam.github.io/nanndemo/audio/bgm/`を50%ずつ選んでfetchし、取得Promise・圧縮MP3のBlob・blob URLをページの起動中ずっと保持する。再生・オンオフ・ステージ変更・トップ復帰で再ダウンロードやキャッシュ破棄をしない。音声要素にはblob URLのみを設定する。HTTP・通信・CORS・本文取得失敗時だけ他方を1回試し、両方失敗したPromiseも保持して再取得ループを防ぐ。自動再生拒否・中断・デコード失敗では再取得しない。先読みや事前プローブはしない。音源ZIPは`./build.sh bgm`で作り、ユーザーが展開した`audio/`と`licenses/`をミラー公開ルートへ置く。ZIP自体をゲームに取得させない。

2本以上のタッチは全画面の位置を基準にした1〜2.5倍のピンチへ使う。物理座標は変えず、GUIと大砲の入力座標を表示変換へ対応させる。開始時に保留中の押下を取り消し、全指が離れるまで発射・調整・UI操作を抑止する。ゴムは凍結中だけ脆くし、グリップ靴も重力・回転・有限摩擦の通常剛体とする。物体や足場を固定して問題を回避しない。

同時に動かすサブエージェントは**最大2体**。各担当の編集ファイルを分け、同じファイルを同時に編集しない。Godotのインポートは担当間で調整し、同じプロジェクトに対して同時実行しない。

検証結果は実行した環境と範囲に合わせて報告する。Godotのheadless成功、WebAssemblyの生成・ロード、Node.jsの確認画像を、Safari・Chrome・Firefoxでの実機QA成功と言い換えない。未確認の描画、入力、端末差、難易度調整は未確認と記載する。

## ZIP配布とGitHub Pages

PLiCyの保存はlocalStorageに統一する。`web/progress-store.mjs`をエンジンより先に初期化し、html5.plicy.netだけ`config.persistentPaths=[]`でIDBFS初期化を無効にする。得点はNandemoProgress bridge、BGMは従来localStorage。失敗時にuser://へfallbackしない。Pagesなどの既存保存は維持する。画像・音源・検索・ページ位置などセッション限定のものを勝手に永続化しない。Godotの保存経路はtests/progress_checks.gd、JSはtests/web-progress.mjs、公式FSのIndexedDB非接触は投稿ZIPのHTTP検証で確認する。

投稿版だけの入力案内は`web/input-hint.mjs`の`STANDALONE_INPUT_HINT`を使う。ソースはfalse、Actionsのstandaloneステップの環境変数1で出力コピーだけtrueへ置換する。黒の半透明86%で初期画面を残し、カーソル検知・ポインター押下・キー入力で永久に（そのページ内だけ）消す。入力を消費せず、物理を止めない。Openclipartの原本・出典はdocs/third-party/openclipartに保存し、ゲームのクレジットは増やさない。

GitHub Pagesは広告なし版のまま維持する。投稿用は`./build.sh standalone`で結合済み`out/standalone/`を変更せず`out/portal/`へ加工し、`out/packages/nandemo-cannon-standalone-4.7.2.zip`を別artifactとして保存する。新規ジョブやGodotの再ビルドは不要。ZIP直下のindex.html、未圧縮の公式WASM・JS・worklet、PCK、画像、BGM3曲、元のライセンスを同梱する。BGMは`mirrorBase: null`でローカルだけから取得し、1起動1曲1取得・ランダム再生を維持する。共有先URLは公開ゲームのURLを明示する。Pages側は従来のミラー設定を維持し、投稿ZIPをdistやcdn-assetsへ置かない。`tests/web-standalone.mjs`は実ZIPを展開して深いHTTPパスの起動シェルを描画スタブで実行する。ブラウザ実機QAではない。通常Web ZIPはBGMを除く配信用なので投稿用と取り違えない。

ゲーム本体と合計約290KBの未改変の公式JS・音声workletはGitHub Pagesへ公開する。重いWASMは完全版ZIPから取り出す。対象は公開リポジトリ`RabbitDaisuke/nandemo-cannon`。`Deploy Pages`はmainへのpushと、入力項目のない`workflow_dispatch`で起動する。

runtime/sourceの2jobを並列に実行する。`./build.sh runtime`は公式Webテンプレートを抽出し、`./build.sh source`は検証と公式Web exportを行ってエンジンファイルを成果物から除く。upload-artifactの名前は`web-runtime`と`web-game`。両jobを`needs`に持つdeploy jobで、download-artifactの`pattern: web-*`、`merge-multiple: true`により`out/standalone/`へ結合し、`GITHUB_TOKEN`を渡して`./build.sh deploy`を実行する。
deployはZIP32のstore方式で`out/packages/nandemo-cannon-web-4.7.2.zip`を作り、`unzip -t`と必要な内容の検査を通す。ZIPにはエンジンを含む自己完結Web一式を収め、同じZIPを`dist/downloads/`へコピーする。`tools/publish-archive.mjs`は同じリポジトリの保管・配布用`cdn-assets`ブランチへZIP、ルートの`LICENSE`、`licenses/godot/`の公式原本、管理用README・マーカーだけを保存する。展開済みWeb一式は置かない。公式原本の文書はバイト改変せず同梱する。通常のGitファイルを使い、Git LFSは使わない。`main`、ソースのブランチ、指定ミラー側のリポジトリをこの処理から変更しない。

配信providerはGitHub Pages。`runtime.json`の`archives`は`{url, bytes?, sha256?}`の配列で、`./downloads/nandemo-cannon-web-4.7.2.zip`と`https://daisukedaisuketeam.github.io/nanndemo/downloads/nandemo-cannon-web-4.7.2.zip`を設定する。JS・workletはPagesの`runtime/godot/4.7.2/`へ置く。クライアントは起動ごとに50%ずつで片方を選び、通常1回のZIP取得でWASMを取り出す。同時要求はPromiseを共有する。HTTP・通信・整合性エラー時だけ他方を1回試す。自前ZIPには全体のサイズ・SHA256を設定し、指定ミラーの旧ZIPは取り出した公式WASMのSHA256で互換性を確認する。

配信先への事前プローブや指定ミラーへの再アップロードを追加しない。ローカル検査後に`dist/`を作って公開する。ブラウザで両ミラーからの取得に失敗したら起動エラーを表示する。実配信先からのZIP取得を確認していない場合は未確認と記載する。

deploy jobは生成物ブランチ保存用の`contents: write`と、Pages公開用の`pages: write`、`id-token: write`を持ち、`github-pages`環境を使う。書き込み先の限定は公開スクリプトで維持する。ZIPをupload-artifactへ保存した後、`dist/`をupload-pages-artifactへ渡し、deploy-pagesでゲームをGitHub Pagesへ公開する。公式Actionは完全なコミットSHAで固定する。
