# 生成アートと組み込み

2026-10-23のユーザー依頼で、大砲・ロゴ・日本語UI文字を内蔵画像生成で制作した。小物と地形は既存のSVG方式を維持する。生成プロンプトは`assets/generated/prompts.json`と`japanese-prompts.json`、原稿シートは同ディレクトリのlossless WebP。CIから画像生成は呼ばない。

|原稿|成果物|用途|
|---|---|---|
|cannon-sheet.webp|assets/cannon/a-*.webp、b-*.webp、base/barrel/trunnion.webp|黒鉄の2候補。短く太い砲口と大きな車輪が読み取れるBを採用|
|font-sheet.webp、hiragana-sheet.webp、katakana-sheet.webp、kana-corrections.webp、katakana-a.webp|assets/font/arcade-atlas.webp、arcade-generated.fnt|基礎HUD文字とかなを統合した246字。アは単独画像生成で差し替え|
|logo-source.webp|assets/ui/logo.webp|正しいタイトル「なんでもキャノン」の金色16bitロゴ|

`./build.sh preview`または`source`/`bundle`が`tools/prepare-generated-art.mjs`を呼ぶ。原稿から固定範囲を切り出し、アルファの微小な縁を整理し、最近傍縮小・外周トリミング・lossless WebP（quality100、effort6）へ変換する。透明な余白を表示サイズの代わりに増やさない。大砲の支点・砲口と採用候補は`assets/cannon/generated-parts.json`に記録した。原稿用ディレクトリは`.gdignore`でゲームexportから除外する。

ひらがなはU+3041〜U+3096の全86字と反復記号「ゝ」「ゞ」を収録する。カタカナ、既存のHUD漢字、数字、記号も統合し、正確な文字集合と件数は`assets/font/generated-coverage.json`に保存する。現在246字で、日本語全文字を収録した汎用フォントではない。

メニュー、ステージ名、物体名、案内文は日本語で表示する。`data/ui-ja.json`に213物体と32ステージのかな表記・案内文を持ち、正式な漢字名は結果の投稿文にも使う。新しい文字は字形と対応表を同時に更新する。アの再生成指示は`assets/generated/katakana-a-prompt.txt`に保存し、他の文字を再生成せず既存アトラスへ統合する。旧SVGフォントはフォールバックと比較用に残す。

確認はNode.jsとsharpで行い、ローカルブラウザは使わない。`previews/cannon-candidates.png`は2案比較、`previews/cannon-angles.png`は採用版の15・35・75度比較。`previews/game-*.png`はGodotの実状態を、読み込まれる素材とフォントメトリクスで再構成した画像で、GPUフレームや実ブラウザのキャプチャではない。ゲーム内の共有JPEGは、プレイヤー環境で結果表示前の実ゲーム画面を撮影する別の機能。
