// Browser-free checks for the public composer URL and in-memory JPEG lifecycle.
import assert from 'node:assert/strict';
import {installResultSharing, resultText, tweetURL} from '../web/share.mjs';
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
console.log('Result sharing: exact Japanese text, JPEG lifecycle, download and optional native sharing passed.');
