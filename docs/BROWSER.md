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
|ランタイムCDN|Statically、実コミットSHA固定|
|圧縮展開|DecompressionStream / gzip。SHA256を検証|
|対象ブラウザ系統|Safari、Chrome、Firefoxの必要APIに対応する版|
|実機ブラウザ検証|未実施。ローカルブラウザは起動していない|

[公式4.7.2リリース](https://github.com/godotengine/godot/releases/tag/4.7.2-stable)のLinuxエディタZIPのSHA256は`cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4`、Export Templates TPZは`f298490b8d44d934be425a5a65a51bf15f422428b229a06a6e11d9ffea248011`。公式asset digestと照合した。エディタ、テンプレート、配信用ランタイムは同じ版を使う。

## ビルド入口

リポジトリ直下の`./build.sh`を手元とCIの共通入口にする。Node.js 22以上とBashが必要。Godotの自動取得はLinux x86_64のみ対応する。既存の4.7.2を使う場合は`GODOT_BIN`を指定し、同じ版のExport Templatesを用意する。WindowsでもGit Bashなどから同じ入口を使う。

|コマンド|実行内容|
|---|---|
|`./build.sh` / `./build.sh bundle`|SVGラスタライズ、4suiteのheadless検証、Nodeプレビュー、公式Web export、開発用出力とCDN用ランタイムの作成|
|`./build.sh check`|body・cannon・hazard・gameの実行検証とゲーム状態JSONの更新|
|`./build.sh preview`|SVGと保存済み状態をNodeで画像化。Godotやブラウザは起動しない|
|`./build.sh pages`|ActionsでCDN用ブランチへ保存し、実Statically取得を検証して軽量Pages版を生成|

必要なNode依存はbuild.shが準備する。内部の`.mjs`を直接実行する手順を別のビルド入口にしない。npmの`godot`パッケージはGodot Engineとは別物のため採用しない。

## 出力

|出力先|用途|含めるもの|
|---|---|---|
|`out/standalone/`|ローカル開発用の自己完結版|ゲーム、起動HTML、圧縮ランタイム、復号ローダー|
|`out/runtime/godot/4.7.2/`|CDN用ブランチへ保存するランタイム|公式JS3ファイル、gzip化WASM、manifest、ライセンス|
|`dist/`|CDN検証後に生成するPages版|ゲームPCK、画像、起動設定、復号ローダー、ライセンス。Godotランタイムは含めない|

`bundle`は公開を行わない。`out/standalone/`はHTTPサーバーで配信して使い、`file://`直開きは対象外。公開用の出力には生WASMや分割ファイルを置かない。`out/export/`の生WASMは公式exportの検証用中間生成物であり、配布対象ではない。

## GitHub Actionsから公開する

1. ソースを単体の**公開**GitHubリポジトリへコミットする。公開設定をスクリプトが勝手に変更することはない。
2. **Settings → Pages → Source** を **GitHub Actions** にする。
3. **Actions → Deploy Pages → Run workflow** を実行する。

外部CDNのURL入力や個人アクセストークンの追加登録は不要。workflowはGitHubが用意するリポジトリ単位の`GITHUB_TOKEN`と`GITHUB_REPOSITORY`を使用し、`./build.sh pages`を呼ぶ。ビルドjobの`contents: write`はCDN用ブランチへの保存に使う。deploy jobは`pages: write`と`id-token: write`を持ち、`github-pages` environmentへ公開する。リポジトリや組織の設定でこれらの権限・ブランチ作成を禁止している場合は、その設定の調整が必要。

ビルドは同じリポジトリの`cdn-assets`ブランチにランタイムを通常のGitファイルとして保存する。mainや作業中のソースブランチは変更しない。既存の`cdn-assets`がこのビルドの管理対象でない場合は上書きせず停止する。ランタイムと付属情報が前回と同じならコミットを追加せず、既存コミットを再利用する。

生成されるURLの形式は次のとおり。`OWNER`、`REPO`、`SHA`はActionsが実際の値から決定する。

```text
https://cdn.statically.io/gh/OWNER/REPO@SHA/runtime/godot/4.7.2/
```

可変ブランチ名ではなく実コミットSHAを固定し、ゲーム側だけの更新ではランタイムURLとキャッシュを維持する。保存後に実CDNへアクセスし、HTTP成功、CORS、JavaScriptのMIME、ファイルサイズとSHA256を確認してから`dist/`を生成する。失敗したらPages公開を止め、重いエンジンをPagesへfallbackしない。CDN用ブランチへのコミットが成功しても、その後のCDN検証が失敗すればPagesは更新しない。

## ランタイムの読み込み

|ファイル|用途|
|---|---|
|`godot.js`|未改変の公式起動コード|
|`godot.wasm.gz`|公式WASM原本をgzip化したファイル|
|`godot.audio.worklet.js`|未改変の公式音声worklet|
|`godot.audio.position.worklet.js`|未改変の公式位置音声worklet|
|`runtime-manifest.json`|配布サイズ、SHA256、復号後サイズ・SHA256|
|`third-party-licenses.txt`|エンジンと同梱ライブラリのライセンス|

Pages側はPCK、画像、起動設定などを配信し、GodotのJS・WASM・音声workletはStaticallyから取得する。現時点のローカル測定では、エンジンを除いたゲーム資産は約0.92MB。これは実Pages配信の測定値ではなく、素材の更新で変わる。

`wasm-loader.mjs`は起動中だけ、設定されたGodot WASMのfetchを正確なURLで捕捉し、実際の`godot.wasm.gz`を取得する。gzipのSHA256を照合し、`DecompressionStream('gzip')`で復号したストリームを`Content-Type: application/wasm`のResponseとして公式Godotへ返す。HTTP側ですでに解凍された場合は原本のSHA256を照合し、再解凍しない。別のfetchはそのまま通し、起動処理後に元のfetchへ戻す。

WASM原本は39,514,754バイト、配布gzipは10,153,810バイト。復号後は公式原本と同一で、エンジンコードの変更、拡張子の偽装、分割配信は行わない。CORSでPagesからの匿名取得を許可する必要があり、`no-cors`は代用できない。JS3ファイルはJavaScriptのMIMEを検証する。gzipファイル自身を`application/wasm`としてコンパイルせず、復号後のResponseへそのMIMEを付ける。

圧縮展開に対応する新しいブラウザが必要。`DecompressionStream`がない環境でgzipを受け取った場合は更新を促す非対応メッセージを出す。SHA256検証にはWeb Cryptoも使う。これらのAPIの存在だけでSafari・Chrome・Firefoxの実動作確認済みとは扱わない。

## 確認済みと未確認

Godot 4.7.2のheadless検証はgame 103、body 12、hazard 37、cannon 26の計178項目が成功した。公式Web export、出力PCKのheadless起動、公式JSのCDN用パス設定、WASMコンパイルも確認した。

Nodeでは圧縮ローダーを3経路で実行した。gzipファイルの復号、HTTP解凍済み原本の受け渡し、不正データの拒否が成功し、正常な2経路ではバイト列一致と`WebAssembly.compileStreaming`を確認した。これは実Staticallyへの取得検証ではない。

この会話ではリポジトリURLが未提供のため、Actions実行、CDN用ブランチの公開、実CDN検証、Pages版の生成・公開は未実施。Safari・Chrome・Firefoxでの起動、タッチ入力、WebGL描画、音声、性能、保存も未確認。Nodeプレビューは実ゲーム状態とSVG素材の再構成で、ブラウザのスクリーンショットではない。最低ブラウザバージョンは実機確認後に決める。
