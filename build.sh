#!/usr/bin/env bash
# Single entry point for humans, CI and subsequent AI agents.
set -euo pipefail
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_root"
build_mode="${1:-bundle}"
case "$build_mode" in
  bundle|check|preview|pages|runtime|source|deploy|bgm) ;;
  -h|--help)
    printf '%s\n' './build.sh [bundle|check|preview|pages|runtime|source|deploy|bgm]' 'runtime/source: produce the two Actions artifacts' 'deploy: merge artifacts, package ZIP, push cdn-assets and prepare Pages' 'pages: bundle then deploy' 'bgm: package the three music files and credits for mirror upload'
    exit 0 ;;
  *) printf 'Unknown build mode: %s\n' "$build_mode" >&2; exit 2 ;;
esac
command -v node >/dev/null || { printf '%s\n' 'Node.js 22+ is required.' >&2; exit 1; }
node -e 'if(Number(process.versions.node.split(".")[0])<22)throw Error("Node.js 22+ is required")'
if [[ "$build_mode" == pages || "$build_mode" == deploy ]]; then
  : "${GITHUB_REPOSITORY:?Run Pages from the Deploy Pages workflow in the standalone public GitHub repository.}"
  : "${GITHUB_TOKEN:?The Deploy Pages workflow must supply its repository-scoped token.}"
fi
mkdir -p out dist previews
touch out/.gdignore dist/.gdignore previews/.gdignore
if [[ "$build_mode" == bgm ]]; then
  exec node tools/package-bgm.mjs
fi
if [[ "$build_mode" == pages ]]; then
  bash "$project_root/build.sh" bundle
  exec bash "$project_root/build.sh" deploy
fi
if [[ "$build_mode" == deploy ]]; then
  mkdir -p out/packages
  rm -f out/packages/nandemo-cannon-web-4.7.2.partial.zip
  # Music downloads separately on first use; never add it to the engine ZIP
  # that every browser downloads at boot.
  (cd out/standalone && zip -0 -X -q -r ../packages/nandemo-cannon-web-4.7.2.partial.zip . -x 'audio/bgm/*')
  unzip -t out/packages/nandemo-cannon-web-4.7.2.partial.zip
  mv out/packages/nandemo-cannon-web-4.7.2.partial.zip out/packages/nandemo-cannon-web-4.7.2.zip
  exec node tools/build-web.mjs deploy
fi

# A configured development runtime may already provide sharp. Otherwise use the
# repository lockfile, exactly as GitHub Actions does.
if [[ "$build_mode" != check && "$build_mode" != runtime ]]; then
  if ! node -e 'const p=require("node:path");try{require("sharp")}catch{require(p.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||"", "sharp"))}' >/dev/null 2>&1; then
    npm ci --no-audit --no-fund
    touch node_modules/.gdignore
  fi
  node tools/rasterize-assets.mjs
  node tools/prepare-generated-art.mjs
fi
if [[ "$build_mode" == preview ]]; then
  node tools/render-cannon.mjs
  node tools/render-game.mjs
  exit 0
fi

godot_version='4.7.2'
godot_cache_dir="$project_root/.cache/godot/$godot_version"
godot_release_url='https://github.com/godotengine/godot/releases/download/4.7.2-stable'
fetch_checked() {
  local download_url="$1" download_path="$2" expected_sha="$3"
  if [[ ! -f "$download_path" ]] || ! printf '%s  %s\n' "$expected_sha" "$download_path" | sha256sum --check --status; then
    curl --fail --location --retry 3 --output "$download_path.partial" "$download_url"
    printf '%s  %s\n' "$expected_sha" "$download_path.partial" | sha256sum --check --status
    mv "$download_path.partial" "$download_path"
  fi
}
if [[ "$build_mode" != runtime ]]; then
if [[ -z "${GODOT_BIN:-}" ]]; then
  GODOT_BIN="$(command -v godot || true)"
fi
if [[ -z "$GODOT_BIN" ]]; then
  [[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || { printf '%s\n' 'Set GODOT_BIN to a Godot 4.7.2 executable on this platform.' >&2; exit 1; }
  mkdir -p "$godot_cache_dir"
  fetch_checked "$godot_release_url/Godot_v4.7.2-stable_linux.x86_64.zip" "$godot_cache_dir/editor.zip" cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4
  unzip -o -q "$godot_cache_dir/editor.zip" -d "$godot_cache_dir"
  GODOT_BIN="$godot_cache_dir/Godot_v4.7.2-stable_linux.x86_64"
  chmod +x "$GODOT_BIN"
fi
export GODOT_BIN
engine_version="$("$GODOT_BIN" --version)"
[[ "$engine_version" == 4.7.2.stable.* ]] || { printf 'Expected Godot 4.7.2 stable, got %s\n' "$engine_version" >&2; exit 1; }
fi
if [[ "$build_mode" != check && "$(uname -s)" == Linux ]]; then
  godot_template_dir="${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/4.7.2.stable"
  if [[ ! -f "$godot_template_dir/web_nothreads_release.zip" ]]; then
    mkdir -p "$godot_cache_dir" "$godot_template_dir"
    fetch_checked "$godot_release_url/Godot_v4.7.2-stable_export_templates.tpz" "$godot_cache_dir/templates.tpz" f298490b8d44d934be425a5a65a51bf15f422428b229a06a6e11d9ffea248011
    unzip -o -j -q "$godot_cache_dir/templates.tpz" templates/web_nothreads_release.zip templates/web_nothreads_debug.zip templates/version.txt -d "$godot_template_dir"
  fi
fi
if [[ "$build_mode" == runtime ]]; then
  export GODOT_WEB_TEMPLATE="$godot_template_dir/web_nothreads_release.zip"
  exec node tools/build-web.mjs runtime
fi
node tests/web-mirrors.mjs
node tests/web-share.mjs
node tests/web-bgm.mjs
node tools/check-game.mjs
[[ "$build_mode" != check ]] || exit 0
node tools/render-cannon.mjs
node tools/render-game.mjs
node tools/build-web.mjs "$build_mode"
