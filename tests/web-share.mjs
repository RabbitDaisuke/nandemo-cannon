// Browser-free checks for the public composer URL and in-memory JPEG lifecycle.
import assert from 'node:assert/strict';
import {installResultSharing, resolveGameURL, resultText, tweetURL} from '../web/share.mjs';
const stage = 'なんでも実験室', score = 321;
const expected = 'なんでもキャノンのステージ「なんでも実験室」で、スコア「321」を獲得しました！';
assert.equal(resultText(stage, score), expected);
const url = new URL(tweetURL(stage, score, 'https://rabbitdaisuke.github.io/nandemo-cannon/'));
assert.equal(url.origin + url.pathname, 'https://x.com/intent/tweet');
assert.equal(url.searchParams.get('text'), expected);
assert.equal(url.searchParams.get('hashtags'), 'なんでもキャノン');
assert.equal(url.searchParams.get('url'), 'https://rabbitdaisuke.github.io/nandemo-cannon/');
assert.equal(url.searchParams.has('media'), false);
const opened = [], shared = [], downloads = [], status = {};
const host = {
  location: {href:'https://rabbitdaisuke.github.io/nandemo-cannon/?stage=20#play'},
  document: {
    querySelector: () => status,
    createElement: () => ({click(){downloads.push(this.download);},remove(){}}),
    body: {appendChild(){}}
  },
  navigator: {canShare: data => data.files[0].type === 'image/jpeg',share: async data => shared.push(data)},
  atob,open:(...args)=>opened.push(args),setTimeout: callback => callback()
};
const api = installResultSharing(host);
const jpeg = Buffer.from([255,216,255,224,0,0,255,217]).toString('base64');
assert.equal(api.setResult(stage, score, jpeg), true);
assert.equal(api.canShareImage(), true);
assert.equal(api.tweet(), true);
assert.equal(new URL(opened[0][0]).searchParams.get('url'), 'https://rabbitdaisuke.github.io/nandemo-cannon/');
assert.equal(opened[0][2], 'noopener,noreferrer');
assert.equal(await api.shareImage(), true);
assert.equal(shared[0].text, expected + '\n#なんでもキャノン');
assert.equal(shared[0].url, 'https://rabbitdaisuke.github.io/nandemo-cannon/');
assert.equal(shared[0].files[0].type, 'image/jpeg');
assert.deepEqual(Buffer.from(await shared[0].files[0].arrayBuffer()), Buffer.from(jpeg,'base64'));
assert.equal(api.download(), true);
assert.deepEqual(downloads, ['nandemo-cannon-321.jpg']);
api.hideResult();
assert.equal(api.hasImage(), true, 'Keep the last screenshot in memory while playing');
assert.equal(api.tweet(), false);
assert.equal(await api.shareImage(), false);
api.setResult('月面', 9, 'invalid');
assert.equal(api.hasImage(), false, 'Never attach a previous result to a new score');
assert.equal(api.download(), false);
assert.equal(api.tweet(), true);
assert.equal(new URL(opened.at(-1)[0]).searchParams.get('text'), resultText('月面',9));
// Embedded game files live on a CDN URL, which must not replace an explicitly
// configured public game page in either sharing mechanism.
const publicURL = 'https://rabbitdaisuke.github.io/nandemo-cannon/';
const embeddedHost = {...host, location:{href:'https://html.itch.zone/html/123/game/index.html'}};
const embedded = installResultSharing(embeddedHost, {gameURL:publicURL});
assert.equal(embedded.setResult(stage, score, jpeg), true);
assert.equal(embedded.tweet(), true);
assert.equal(new URL(opened.at(-1)[0]).searchParams.get('url'), publicURL);
assert.equal(await embedded.shareImage(), true);
assert.equal(shared.at(-1).url, publicURL);
assert.equal(shared.at(-1).text, expected + '\n#なんでもキャノン');
assert.equal(shared.at(-1).files[0].type, 'image/jpeg');
assert.equal(resolveGameURL(host.location.href), publicURL, 'Default Pages share URL changed');
for (const [href, id] of [
  ['https://html5.plicy.net/uploads/game/239777/index.html', '239777'],
  ['https://html5.plicy.net/new-version/246810/assets/game/index.html?next=/999/#12345', '246810'],
  ['https://html5.plicy.net/files/239777/123/index.html', '239777']
]) {
  const expectedURL = `https://plicy.net/GamePlay/${id}`;
  assert.equal(resolveGameURL(href), expectedURL);
  assert.equal(resolveGameURL(href, publicURL), expectedURL, 'PLiCy page must override the portal fallback');
  for (const options of [undefined, {gameURL:publicURL}]) {
    const plicy = installResultSharing({...host, location:{href}}, options);
    assert.equal(plicy.setResult(stage, score, jpeg), true);
    assert.equal(plicy.tweet(), true);
    assert.equal(new URL(opened.at(-1)[0]).searchParams.get('url'), expectedURL);
    assert.equal(await plicy.shareImage(), true);
    assert.equal(shared.at(-1).url, expectedURL);
  }
}
for (const href of [
  'https://html5.plicy.net.example.test/uploads/239777/index.html',
  'https://example.test/html5.plicy.net/239777/index.html',
  'https://html5.plicy.net@other.test/uploads/239777/index.html',
  'http://html5.plicy.net/uploads/239777/index.html',
  'https://html5.plicy.net/uploads/game239777/index.html',
  'https://html5.plicy.net/uploads/239777extra/index.html',
  'https://html5.plicy.net/uploads/game/index.html?game=/239777/#246810',
  embeddedHost.location.href
]) assert.equal(resolveGameURL(href, publicURL), publicURL, `Unexpected PLiCy mapping: ${href}`);
console.log('Result sharing: exact Japanese text, JPEG lifecycle, download, public URL override, local PLiCy URL mapping and optional native sharing passed.');
