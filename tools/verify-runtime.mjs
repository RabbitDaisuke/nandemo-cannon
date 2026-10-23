import {createHash} from 'node:crypto';

export async function verifyRuntime(base, manifest) {
  if (!base) throw new Error('A committed Statically runtime URL is required for Pages.');
  const url = new URL(base.endsWith('/') ? base : base + '/');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Use a plain, versioned HTTPS CDN directory URL without credentials or query parameters.');
  if (url.hostname !== 'cdn.statically.io') throw new Error('This deployment uses Statically.');
  const repositoryOwner = (process.env.GITHUB_REPOSITORY || '').split('/')[0];
  const origin = process.env.GAME_ORIGIN || (repositoryOwner ? `https://${repositoryOwner}.github.io` : 'https://example.github.io');
  const verified = [];
  for (const entry of manifest.files) {
    let response;
    for (let attempt = 0; attempt < 6; attempt++) {
      response = await fetch(new URL(entry.name, url), {headers: {Origin: origin, 'Accept-Encoding': 'br, gzip'}, signal: AbortSignal.timeout(60000)});
      if (![404, 502, 503, 504].includes(response.status) || attempt === 5) break;
      await response.arrayBuffer();
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    if (!response.ok) throw new Error(`Runtime CDN returned ${response.status} for ${entry.name}`);
    const cors = response.headers.get('access-control-allow-origin');
    if (cors !== '*' && cors !== origin) throw new Error(`Runtime CDN must allow ${origin} through CORS: ${entry.name}`);
    if (entry.name.endsWith('.js') && !/(?:text|application)\/(?:javascript|ecmascript)/i.test(response.headers.get('content-type') || '')) throw new Error(`CDN JavaScript MIME is invalid: ${entry.name}`);
    const encoding = response.headers.get('content-encoding') || '';
    const bytes = Buffer.from(await response.arrayBuffer()); // fetch decodes HTTP encoding.
    const receivedHash = createHash('sha256').update(bytes).digest('hex');
    const encodedMatch = bytes.length === entry.bytes && receivedHash === entry.sha256;
    const decodedMatch = entry.name.endsWith('.wasm.gz') && bytes.length === entry.decodedBytes && receivedHash === entry.decodedSHA256;
    if (!encodedMatch && !decodedMatch) throw new Error(`CDN file does not match the official 4.7.2 export: ${entry.name}`);
    verified.push({name: entry.name, sha256: entry.sha256, contentEncoding: encoding});
  }
  return {baseURL: url.href, origin, files: verified};
}
