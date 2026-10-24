# Web出力と配信

## 固定した組み合わせ

|項目|設定|
|---|---|
|エディタとテンプレート|Godot 4.7.2 stable / official.ed1daf0bf|
|実行|WebAssembly|
|描画|Compatibility / WebGL 2|
|thread_support / extensions_support|どちらもfalse|
|WebGPU|不要|
|SharedArrayBuffer / COOP / COEP|単一スレッド構成では必須にしない|
|ランタイム配信|GitHub Pagesの完全版ZIP、2ミラーから50%ずつで選択|
|圧縮展開|ZIPからWASMを取り出し、DecompressionStream / gzipで展開。SHA256を検証|
|対象ブラウザ系統|Safari、Chrome、Firefoxの必要APIに対応する版|
|実機ブラウザ検証|未実施。ローカルブラウザは起動していない|

[公式4.7.2リリース](https://github.com/godotengine/godot/releases/tag/4.7.2-stable)のLinuxエディタZIPのSHA256は`cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4`、Export Templates TPZは`f298490b8d44d934be425a5a65a51bf15f422428b229a06a6e11d9ffea248011`。公式asset digestと照合した。エディタ、テンプレート、配信用ランタイムは同じ版を使う。

## ビルド入口

リポジトリ直下の`./build.sh`を手元とCIの共通入口にする。Node.js 22以上とBashが必要。Godotの自動取得はLinux x86_64のみ対応する。既存の4.7.2を使う場合は`GODOT_BIN`を指定し、同じ版のExport Templatesを用意する。WindowsでもGit Bashなどから同じ入口を使う。

|コマンド|実行内容|
|---|---|
|`./build.sh` / `./build.sh bundle`|SVGラスタライズ、4suiteのheadless検証、Nodeプレビュー、公式Web export、自己完結出力とランタイムの作成|
|`./build.sh check`|body・cannon・hazard・gameの実行検証とゲーム状態JSONの更新|
|`./build.sh preview`|SVGと保存済み状態をNodeで画像化。Godotやブラウザは起動しない|
|`./build.sh runtime`|公式Webテンプレートを抽出し、`out/engine/`にランタイム成果物を作成|
|`./build.sh source`|検証・画像生成・公式Web exportを行い、エンジンを除いた`out/game/`を作成|
|`./build.sh deploy`|結合済みWeb出力をZIP化・検査し、生成物ブランチへ保存。Pages版を生成|
|`./build.sh pages`|`bundle`→`deploy`を順に実行|

必要なNode依存はbuild.shが準備する。内部の`.mjs`を直接実行する手順を別のビルド入口にしない。npmの`godot`パッケージはGodot Engineとは別物のため採用しない。

## 出力

|出力先|用途|含めるもの|
|---|---|---|
|`out/standalone/`|自己完結版・Actionsの結合先|ゲーム、起動HTML、圧縮ランタイム、復号ローダー、元のライセンス|
|`out/runtime/godot/4.7.2/`|bundleが作るランタイム|公式JS3ファイル、gzip化WASM、manifest、原本ライセンス|
|`out/engine/` / `out/game/`|並列jobの成果物|`web-runtime` / `web-game`としてupload-artifactへ渡す|
|`out/packages/nandemo-cannon-web-4.7.2.zip`|起動時取得兼ゲーム配布ZIP|ゲーム・エンジン・元のライセンス。BGM音源を除外して初回通信量を維持。ZIP32のstore方式で作成し、`unzip -t`で確認|
|`dist/`|Pages公開対象|ゲームPCK、画像、起動設定、復号ローダー、公式JS・音声worklet、ライセンス、`downloads/`の完全版ZIP|

`bundle`は公開を行わない。`out/standalone/`はHTTPサーバーで配信して使い、`file://`直開きは対象外。公開用の出力には生WASMや分割ファイルを置かない。`out/export/`の生WASMは公式exportの検証用中間生成物であり、配布対象ではない。

BGMer音源は`web/audio/.gdignore`でGodotから除外する。buildは`audio/bgm/`を出力へコピーし、曲を初めて使うときに自前URLと`https://daisukedaisuketeam.github.io/nanndemo/audio/bgm/`を50%ずつで選ぶ。通常は片方だけをストリーム再生し、事前プローブや先読みはしない。通信・デコード・CORSの失敗時だけ他方へ1回切り替え、自動再生拒否は同じ配信元のままユーザー操作を待つ。音声要素とMediaElementAudioSourceを再利用し、`crossOrigin = 'anonymous'`を`src`より先に設定する。ミラーの公開ルートへ音源ZIPを展開し、`audio/bgm/088.mp3`・`415.mp3`・`073.mp3`を配置する必要がある。配置前の404は自前配信へ戻す。起動時取得ZIP単体には音源を入れない。全音源付きのローカル配布には`out/standalone/`全体を使う。Safariの音量はHTMLMediaElement.volumeに依存せずGainNodeで制御し、最初の開始操作でAudioContextだけを解除する。音声要素はゲーム開始後に生成する。

## GitHub Actionsから公開する

1. **公開**リポジトリ`RabbitDaisuke/nandemo-cannon`のmainへソースをpushする。公開設定をスクリプトが勝手に変更することはない。
2. **Settings → Pages → Source** を **GitHub Actions** にする。
3. mainへのpushで起動する**Deploy Pages**を確認する。手動では**Actions → Deploy Pages → Run workflow**を実行する。

`runtime`と`source`の2jobが並列に`./build.sh runtime`と`./build.sh source`を呼ぶ。runtimeは公式テンプレートを抽出し、sourceは既存の公式Web export処理を使ってエンジンファイルを成果物から除外する。upload-artifactへ渡した`web-runtime`と`web-game`は、両jobを`needs`に持つdeploy jobでdownload-artifactの`pattern: web-*`、`merge-multiple: true`により`out/standalone/`へ結合する。その後`./build.sh deploy`でZIPを作成・検査し、公開処理を行う。
deploy jobは標準の`GITHUB_TOKEN`と`GITHUB_REPOSITORY`を使い、`contents: write`、`pages: write`、`id-token: write`を持つ。公開先environmentは`github-pages`。リポジトリや組織の設定でこれらの権限・ブランチ作成を禁止している場合は、その設定の調整が必要。

`tools/publish-archive.mjs`は保管・配布用の`cdn-assets`ブランチへ、`downloads/nandemo-cannon-web-4.7.2.zip`、ルートの`LICENSE`、`licenses/godot/`の公式原本、管理用README・マーカーだけを通常のGitファイルとして保存する。展開済みWeb一式は重複して置かない。ZIPはエンジンを含む完全な自己完結版。main、作業中のソースブランチ、指定ミラーのリポジトリは変更しない。既存の`cdn-assets`がこのビルドの管理対象でない場合は上書きせず停止する。

同じZIPを`dist/downloads/`にもコピーする。`runtime.json`の`archives`配列は`{url, bytes?, sha256?}`を持ち、配信providerはGitHub Pages。自前ZIPにはサイズとSHA256を設定する。deployはローカルZIPの`unzip -t`と必要な内容の検査後に`dist/`を生成し、配信先への事前プローブは行わない。生成済みZIPは後続の公開処理に失敗した場合もActions artifactへ保存する。

## ランタイムの読み込み

|ファイル|用途|
|---|---|
|`godot.js`|未改変の公式起動コード|
|`godot.wasm.gz`|公式WASM原本をgzip化したファイル|
|`godot.audio.worklet.js`|未改変の公式音声worklet|
|`godot.audio.position.worklet.js`|未改変の公式位置音声worklet|
|`runtime-manifest.json`|配布サイズ、SHA256、復号後サイズ・SHA256|
|`licenses/godot/`|公式原本のLICENSE.txt、COPYRIGHT.txt、AUTHORS.md、thirdparty/README.mdと元URL|

ゲーム本体のPCK、画像、起動設定、ライセンスと、合計約290KBの未改変の公式JS・音声workletをGitHub Pagesで配信する。JS・workletの配置先は`runtime/godot/4.7.2/`。重いWASMは完全版ZIPから取得する。

`wasm-loader.mjs`は起動ごとに次のどちらかを50%ずつの確率で選ぶ。

|ミラー|ZIPのURL|
|---|---|
|現在のPages|`./downloads/nandemo-cannon-web-4.7.2.zip`|
|ユーザー指定|`https://daisukedaisuketeam.github.io/nanndemo/downloads/nandemo-cannon-web-4.7.2.zip`|

通常は1回のZIP取得で起動し、同時要求は同じPromiseを共有する。HTTP・通信・整合性エラーの場合だけ、もう片方を1回試す。自前ZIPはサイズとSHA256を照合し、指定ミラーの旧ZIPは取り出した公式WASMのSHA256で互換性を確認する。中の`godot.wasm.gz`を取り出し、`DecompressionStream('gzip')`で展開したWASMを`Content-Type: application/wasm`のResponseとして公式Godotへ渡す。両方に失敗した場合は起動エラーを表示する。自己完結版は同梱のgzipを使う。

WASM原本は39,514,754バイト、ZIP内のgzipは10,153,810バイト。復号後は公式原本と同一で、エンジンコードの変更、拡張子の偽装、分割配信は行わない。別originのミラーからZIPを取得する場合はCORSが必要で、`no-cors`は代用できない。

圧縮展開に対応する新しいブラウザが必要。`DecompressionStream`がない環境でgzipを受け取った場合は更新を促す非対応メッセージを出す。SHA256検証にはWeb Cryptoも使う。これらのAPIの存在だけでSafari・Chrome・Firefoxの実動作確認済みとは扱わない。

## 確認済みと未確認

Godot 4.7.2のheadless検証はgame 103、body 12、hazard 37、cannon 26の計178項目が成功した。公式Web export、出力PCKのheadless起動、WASMコンパイルも確認した。

Nodeではgzipファイルの復号、HTTP解凍済み原本の受け渡し、不正データの拒否を確認し、正常な2経路ではバイト列一致と`WebAssembly.compileStreaming`を確認した。これは実配信先からのZIP取得の確認ではない。

2026-10-23の[Actions実行39950881028](https://github.com/RabbitDaisuke/nandemo-cannon/actions/runs/39950881028)は全jobが成功し、GitHub Pagesへの公開まで完了した。今回の2ミラー構成を反映する次の実行結果と、実配信先からのZIP取得は未確認。

Safari・Chrome・Firefoxでの起動、タッチ入力、WebGL描画、音声、性能、保存も未確認。Nodeプレビューは実ゲーム状態とSVG素材の再構成で、ブラウザのスクリーンショットではない。最低ブラウザバージョンは実機確認後に決める。
