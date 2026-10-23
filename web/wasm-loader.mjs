// Read the controlled ZIP32 STORE archive made by build.sh (zip -0 -X).
// The caller authenticates the complete archive before reading an entry.
export function extractStoredZipEntry(input, name) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => { throw new Error('Invalid engine ZIP: expected ZIP32 STORE'); };
  const range = (start, length, limit = bytes.length) => { if (start < 0 || length < 0 || start + length > limit) invalid(); };
  const u16 = offset => view.getUint16(offset, true);
  const u32 = offset => view.getUint32(offset, true);
  const end = bytes.length - 22;
  range(end, 22);
  // build.sh does not add archive comments, split volumes, or ZIP64 records.
  if (u32(end) !== 0x06054b50 || u16(end + 4) || u16(end + 6) || u16(end + 20)) invalid();
  const count = u16(end + 10), size = u32(end + 12), start = u32(end + 16);
  if (!count || count === 0xffff || u16(end + 8) !== count || size === 0xffffffff || start + size !== end) invalid();
  let cursor = start, found;
  const names = new Set(), regions = [];
  const decoder = new TextDecoder('utf-8', {fatal: true});
  for (let index = 0; index < count; index++) {
    range(cursor, 46, end);
    if (u32(cursor) !== 0x02014b50 || u16(cursor + 6) > 20 || u16(cursor + 10) || u16(cursor + 34)) invalid();
    const flags = u16(cursor + 8), length = u32(cursor + 20), local = u32(cursor + 42);
    const nameLength = u16(cursor + 28), extraLength = u16(cursor + 30), commentLength = u16(cursor + 32);
    if (flags & ~0x0800 || length === 0xffffffff || length !== u32(cursor + 24) || !nameLength) invalid();
    range(cursor + 46, nameLength + extraLength + commentLength, end);
    const filename = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (names.has(filename)) invalid();
    names.add(filename);
    range(local, 30, start);
    if (u32(local) !== 0x04034b50 || u16(local + 4) > 20 || u16(local + 6) !== flags || u16(local + 8) || u32(local + 14) !== u32(cursor + 16) || u32(local + 18) !== length || u32(local + 22) !== length || u16(local + 26) !== nameLength) invalid();
    const data = local + 30 + nameLength + u16(local + 28);
    range(local + 30, data - local - 30 + length, start);
    for (let offset = 0; offset < nameLength; offset++) if (bytes[local + 30 + offset] !== bytes[cursor + 46 + offset]) invalid();
    regions.push([local, data + length]);
    if (filename === name) found = bytes.subarray(data, data + length);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== end) invalid();
  regions.sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < regions.length; index++) if (regions[index][0] < regions[index - 1][1]) invalid();
  if (!found) throw new Error(`Engine ZIP entry not found: ${name}`);
  return found;
}

export function installCompressedWasm(runtime, baseURL, scope = globalThis) {
  const originalFetch = scope.fetch;
  const nativeFetch = originalFetch.bind(scope);
  const wasmURL = new URL(runtime.executable + '.wasm', baseURL).href;
  const compressedURL = new URL(runtime.executable + '.wasm.gz', baseURL).href;
  const digest = async bytes => [...new Uint8Array(await scope.crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  let archivePromise;
  const intercepted = async (input, init) => {
    const inputURL = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    if (new URL(inputURL, baseURL).href !== wasmURL) return nativeFetch(input, init);
    let bytes;
    if (runtime.archiveURL) {
      archivePromise ||= (async () => {
        const response = await nativeFetch(new URL(runtime.archiveURL, baseURL).href, init);
        if (!response.ok) throw new Error(`Engine archive download failed (${response.status})`);
        const archive = new Uint8Array(await response.arrayBuffer());
        if (archive.length !== runtime.archiveBytes || await digest(archive) !== runtime.archiveSHA256) throw new Error('Engine archive integrity check failed');
        return archive;
      })();
      bytes = extractStoredZipEntry(await archivePromise, runtime.wasmEntry || 'runtime/godot/4.7.2/godot.wasm.gz');
    } else {
      const response = await nativeFetch(compressedURL, init);
      if (!response.ok) throw new Error(`Engine download failed (${response.status})`);
      bytes = new Uint8Array(await response.arrayBuffer());
    }
    const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
    if (await digest(bytes) !== (compressed ? runtime.gzipSHA256 : runtime.wasmSHA256)) throw new Error('Engine integrity check failed');
    if (!compressed && bytes.length !== runtime.wasmBytes) throw new Error('Engine size check failed');
    let body = new Blob([bytes]).stream();
    if (compressed) {
      if (typeof scope.DecompressionStream !== 'function') throw new Error('このブラウザは圧縮データの展開に対応していません。新しいバージョンへ更新してください。');
      body = body.pipeThrough(new scope.DecompressionStream('gzip'));
    }
    return new Response(body, {headers: {'Content-Type': 'application/wasm', 'Content-Length': String(runtime.wasmBytes)}});
  };
  scope.fetch = intercepted;
  return () => { if (scope.fetch === intercepted) scope.fetch = originalFetch; };
}
