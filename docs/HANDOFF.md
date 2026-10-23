# 実装引き継ぎ

ユーザーの指定に従い、Godot 4.7.2 stable、WebAssembly、WebGL 2、単一スレッドを使う。エディタとExport Templatesは同じ4.7.2に固定し、エンジンのソースクローンは不要。npmの`godot@0.7.10`は別のNodeイベント処理パッケージなので使用しない。ローカルブラウザ禁止を維持し、物理・進行はGodot headless、画像はNode.jsとsharpで確認する。小物・地形はSVG、大砲・ロゴ・HUD文字は内蔵画像生成による原稿を分割したlossless WebP。生成指示・切り出し方法は`GENERATED_ART.md`を参照。

## 実装状態

小物は158種類。100は上限ではない。20マップすべて15投で、初期配置は別枠。18面の`queueSlots`は同じ挙動・燃焼特性・役割を持ち、幅と高さが基準比1.4以内の候補からSEED抽選する。導入や火・水・爆弾は固定枠。第15面の砂場と第20面の実験室は全カタログから任意選択でき、選ばなければ既定の15個を元の順で使う。大砲は黒鉄のB案で、台座を固定して砲身だけを動かす。横ドラッグで火力15〜100%、縦ドラッグで角度5〜85度を調整し、第1面の十字矢印で案内する。下端スライダーとキー操作を残し、UI以外のゲーム面は左・中クリックで発射する。タッチも維持し、ドラッグ終了では発射しない。装填物は投射後と同じ実寸で大砲へ重ね、「つぎ」と区別する。選択輪郭は大砲の部品を合成した外周だけに付ける。

メニュー・ステージ・小物・レッスンは日本語表示とし、読みやすいかな名を`data/ui-ja.json`で管理する。投稿文には正式な`nameJa`を使う。画像生成フォントは246字で、ひらがなU+3041〜U+3096の全86字と反復記号「ゝ」「ゞ」、カタカナ、HUD用の文字・記号を含む。最終収録数と文字一覧は`assets/font/generated-coverage.json`を正とする。

火炎放射器は6秒で燃料切れになり、空のSVGへ変わる。水滴・セル水・川に触れた場合も燃料を0にして再点火しない。焚火とランタンも有限燃料を持つ。水は火を消し、氷は水を凍らせ、熱で融ける。傘は全fixtureで水滴を反射する。第11面はスポンジ2個を固定し、水滴・セル水・川から容量6まで吸う。飽和後は吸わず質量2倍になる。第12面の水源は落水を除く指定領域のセル在庫40で停止し、水が減っても再開しない。最大供給96は維持する。水面は矢印のない波模様にし、流力を残す。車輪系は接地した正しい姿勢だけ低摩擦、靴は靴底だけ追加摩擦。割れ物は衝撃と継続荷重で壊れる。爆発は通常物の確率判定と船の箱の有効爆風3回保証を分け、強力爆弾は別IDとして通常爆弾の性能を変えない。

得点は全fixtureを有効範囲に含む存命物体だけを対象に、`基本点 + 10 × floor(max(0, 基準床Y − bounds.center.y) / 16)`を0.5実秒ごとに再計算する。時間では累積しない。基準床は通常得点枠の下端、第2面500、第5面430。第10面の初期ピンは残存1個−100点で高さ点なし。15投後は静止判定または最大12秒で確定し、全15投が一度着弾した後だけ1.5倍速で待つ。モーダル・再開・ステージ変更・結果・終了では通常速度へ戻る。第1面は左右端を衝突壁と黄色い線で閉じ、第4面は2〜3層のゴミ山、第5面は頂部320・火口346・低地430の衝突地形と対応SVG、第19面は花火で掃除できる木箱・ごみを置く。

結果画面を重ねる前に、確定スコアを含むゲームプレイ画面をJPEGで撮り、メモリに保持する。黒い横長の「X でポスト」はステージ名・スコア入りの投稿文をX intentで開く。X intentには画像を直接添付できないため、JPEGを保存して投稿画面で添付する。ファイル共有に対応する環境ではWeb Shareも使える。撮影に失敗したときは前回の画像を使い回さない。

## ビルド入口と出力

ユーザー向け・CI向けの入口はルートの`./build.sh`一本。Node.js 22以上とBashを使う。Godotの自動セットアップはLinux x86_64のみ。WindowsやほかのOSで既存エンジンを使う場合は`GODOT_BIN`を指定し、公式4.7.2と同じ版のExport Templatesを用意する。WindowsからもGit Bashなどで同じ入口を呼ぶ。

|操作|意味|
|---|---|
|`./build.sh` / `./build.sh bundle`|物理4suite→Node画像→公式Web export→自己完結出力とランタイムを作成|
|`./build.sh check`|4suiteを再検証し、実ゲームの状態JSONを更新|
|`./build.sh preview`|保存済み状態JSONとSVG・WebPからNodeだけでプレビュー生成|
|`./build.sh runtime`|公式テンプレートから`out/engine/`にランタイムを抽出|
|`./build.sh source`|検証・画像生成・公式Web exportを行い、エンジンを除いた`out/game/`を作成|
|`./build.sh deploy`|結合済みWeb出力をZIP化し、ローカル検証後にZIP公開とPages版生成を行う|
|`./build.sh pages`|`bundle`→`deploy`を順に実行|

`out/standalone/`は圧縮ランタイムを同梱した自己完結版で、Actionsの成果物結合先でもある。`bundle`の`out/runtime/godot/4.7.2/`と`runtime`の`out/engine/runtime/godot/4.7.2/`には公式JS3ファイル、`godot.wasm.gz`、manifest、原本ライセンスを作る。展開後のWASMは未改変の公式原本と同一。ZIPは`out/packages/nandemo-cannon-web-4.7.2.zip`で、エンジンを含む完全な自己完結Web版。同じZIPを`dist/downloads/`へ置き、ゲーム本体と公式JS・音声worklet約290KBとともにGitHub Pagesで配信する。生WASMと分割ファイルは配布しない。

## 配信方針

公開リポジトリ`RabbitDaisuke/nandemo-cannon`からGitHub Actionsでゲーム本体、小さな公式JS、完全版ZIPをGitHub Pagesへ公開する。ブラウザはZIP内のWASMのgzipを取り出す。Sitesは使わない。SettingsのPages公開元をGitHub Actionsにし、mainへpushするか、Actionsの`Deploy Pages`からRun workflowを実行する。

Actionsはruntime/sourceの2jobを並列実行し、`./build.sh runtime`と`./build.sh source`の結果を`web-runtime`、`web-game`としてupload-artifactへ渡す。deploy jobは両方を待ち、download-artifactの`pattern: web-*`、`merge-multiple: true`で`out/standalone/`へ結合して`./build.sh deploy`を実行する。
deployはstore方式で完全版ZIPを作り、`unzip -t`と内容の整合性をローカルで確認する。`tools/publish-archive.mjs`は標準の`GITHUB_TOKEN`と`GITHUB_REPOSITORY`を使い、同じリポジトリの`cdn-assets`へZIP、ルートの`LICENSE`、`licenses/godot/`の原本4文書・元URL、管理用README・マーカーだけを保管する。展開済みWeb一式は重複保存しない。deploy jobに`contents: write`が必要。main、ソースブランチ、指定ミラーのリポジトリは変更せず、管理対象でない既存ブランチは上書きせず止める。

配信providerはGitHub Pages。`runtime.json`の`archives`配列に`{url, bytes?, sha256?}`を設定する。URLは`./downloads/nandemo-cannon-web-4.7.2.zip`と、ユーザー指定の`https://daisukedaisuketeam.github.io/nanndemo/downloads/nandemo-cannon-web-4.7.2.zip`。ローカル検査後に`dist/`を作り、upload-pages-artifactとdeploy-pagesで公開する。配信先への事前プローブは行わない。

Pagesの`runtime/godot/4.7.2/`には未改変の公式JSと音声workletを置く。起動ごとに2ミラーを50%ずつで選び、通常はZIPを1回取得する。同時要求はPromiseを共有し、HTTP・通信・整合性エラー時だけ他方を1回試す。自前ZIPは全体のサイズとSHA256を照合し、指定ミラーの旧ZIPは取り出した公式WASMのSHA256で互換性を確認する。`wasm-loader.mjs`がgzipを展開して公式Godotへ渡す。両方に失敗したら起動エラーを表示する。自己完結版は同梱gzipを使う。詳細は`BROWSER.md`を参照。

## 検証と残作業

Godot 4.7.2の検証は、20マップ・158物体、抽選、採点、15投の終了、地形、火・水・氷、接地摩擦、大砲の照準と実寸装填表示などを対象にする。最新の件数と結果は`previews/*-checks.json`を参照し、過去版の成功を今回の変更の成功に読み替えない。`previews/game-*.png`は実Godot状態をNodeで再構成した画像で、実ブラウザのスクリーンショットや共有JPEGではない。headlessではJPEG撮影を省略するため、画像保存・Web Share・X投稿画面は実機確認が必要。

発射音は添付のOtoLogic「オノマトペ 衝撃01」を25%で再生し、原本MP3を改変せず保存。起動画面でのみOtoLogic / CC BY 4.0を大きく表示し、`web/licenses/otologic.txt`をPagesとZIPに含める。

2ミラー構成は[Actions実行39953964261](https://github.com/RabbitDaisuke/nandemo-cannon/actions/runs/39953964261)で全job成功・Pages公開済み。これは今回の採点・抽選・操作・地形・水処理の更新完了を示す実績ではない。最新変更の公開状況は該当コミットのDeploy Pages実行結果で確認する。配信先へのZIP事前プローブは追加しない。

許可された環境でのSafari・Chrome・Firefox実機確認も残る。ローカル出力の成功でこれらの完了を代替しない。実機結果から最低ブラウザバージョン、GPU性能、音声、保存、スマートフォンの文字サイズ・ドラッグ量を調整する。全ステージの攻略バランスにも実プレイでの調整余地がある。

## 追加ステージと番号の扱い

追加ステージの基準リストは次のとおり。現在は第16・17・19面にも通常枠の制約付き抽選を適用し、各15投とステージの特色を守る。

|ステージ|追加要望|
|---|---|
|16|レストラン。凹型の皿を使う地形。ハンバーガー、ステーキ、スイカ、チーズ、食パン、白米、リンゴ、カップアイスと付属スプーン、ステーキナイフ、フォーク、少し縦にクロスした割りばし、お子様ランチピック、エビフライ、ドーナツ、目玉焼きの15個|
|17|ガレージ。タイヤ、ハンドル、エンジン、バッテリー、電動ドリル、マフラー、インパクトレンチ、ジャッキ、車のドア、助手席、三角コーン、ヘルメット、ドラム缶、バケツ、消火器の15個|
|18|既存の氷床を暫定移設して機能を維持。最新要望では番号未指定で、助手側の実装判断でありユーザー確認済みとして扱わない|
|19|祭り。紅白の台。花火は発射後も剛体として衝突し、一定時間後に炸裂して周囲を吹き飛ばす。既存の火炎・爆発処理を再利用する|
|20|最新名称は「なんでも実験室」。水・火・爆発・氷が混在し、任意でカタログから選べる。未選択なら既定の15個を元の順で投げる|

既存のSVG原稿を余白付き画像へ置き換えたり、滑走物を速度固定の疑似物理へ戻したり、炎を静止画だけに戻したりしない。
