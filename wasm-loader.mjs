// Statically serves the real .wasm.gz file committed to the CDN branch.
// No extension disguise, file splitting, or fallback to GitHub Pages.
export function installCompressedWasm(runtime, baseURL, scope = globalThis) {
  const originalFetch = scope.fetch;
  const nativeFetch = originalFetch.bind(scope);
  const wasmURL = new URL(runtime.executable + '.wasm', baseURL).href;
  const compressedURL = new URL(runtime.executable + '.wasm.gz', baseURL).href;
  const intercepted = async (input, init) => {
    const inputURL = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    if (new URL(inputURL, baseURL).href !== wasmURL) return nativeFetch(input, init);
    const response = await nativeFetch(compressedURL, init);
    if (!response.ok) throw new Error(`Engine download failed (${response.status})`);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
    const digest = [...new Uint8Array(await scope.crypto.subtle.digest('SHA-256', buffer))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (digest !== (compressed ? runtime.gzipSHA256 : runtime.wasmSHA256)) throw new Error('Engine integrity check failed');
    let body = new Blob([buffer]).stream();
    if (compressed) {
      if (typeof scope.DecompressionStream !== 'function') throw new Error('このブラウザは圧縮データの展開に対応していません。新しいバージョンへ更新してください。');
      body = body.pipeThrough(new scope.DecompressionStream('gzip'));
    }
    return new Response(body, {headers: {'Content-Type': 'application/wasm', 'Content-Length': String(runtime.wasmBytes)}});
  };
  scope.fetch = intercepted;
  return () => { if (scope.fetch === intercepted) scope.fetch = originalFetch; };
}
