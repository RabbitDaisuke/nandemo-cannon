// Local, in-memory result sharing. No upload and no automatic post.
export const RESULT_HASHTAG = 'なんでもキャノン';
export function resultText(stage, score) {
  return `なんでもキャノンのステージ「${String(stage)}」で、スコア「${Math.trunc(Number(score) || 0)}」を獲得しました！`;
}
export function tweetURL(stage, score, gameURL) {
  const intent = new URL('https://x.com/intent/tweet');
  intent.searchParams.set('text', resultText(stage, score));
  intent.searchParams.set('hashtags', RESULT_HASHTAG);
  intent.searchParams.set('url', gameURL);
  return intent.href;
}
export function resolveGameURL(locationHref, fallback = new URL('.', locationHref).href) {
  const location = new URL(locationHref);
  // PLiCy serves the uploaded files under a separate host. Resolve its public
  // game page locally; query strings, fragments and other hosts are ignored.
  if (location.protocol === 'https:' && location.hostname === 'html5.plicy.net') {
    const id = location.pathname.match(/\/([0-9]+)(?:\/|$)/)?.[1];
    if (id) return `https://plicy.net/GamePlay/${id}`;
  }
  return fallback;
}
export function installResultSharing(host = window, {gameURL = new URL('.', host.location.href).href, nativeTweetLink = false} = {}) {
  let result = null;
  let active = false;
  const resolvedGameURL = resolveGameURL(host.location.href, gameURL);
  const status = host.document.querySelector('#share-status');
  const linkLayer = nativeTweetLink ? host.document.createElement('div') : null;
  const tweetLink = nativeTweetLink ? host.document.createElement('a') : null;
  if (tweetLink) {
    linkLayer.style.cssText = 'position:fixed;overflow:hidden;pointer-events:none;z-index:20';
    tweetLink.textContent = 'X でポスト';
    tweetLink.target = '_blank';
    tweetLink.rel = 'noopener noreferrer';
    tweetLink.style.cssText = 'position:absolute;display:block;pointer-events:auto;color:transparent;background:transparent;text-decoration:none;touch-action:manipulation';
    linkLayer.hidden = true;
    linkLayer.appendChild(tweetLink);
    host.document.body.appendChild(linkLayer);
  }
  function message(value = '') {
    if (status) { status.textContent = value; status.hidden = !value; }
  }
  const api = {
    usesTweetLink() { return nativeTweetLink; },
    setTweetBounds(x, y, width, height, viewportWidth, viewportHeight) {
      if (!tweetLink || !active || !result) return false;
      const canvas = host.document.querySelector('#canvas').getBoundingClientRect();
      const scale = Math.min(canvas.width / viewportWidth, canvas.height / viewportHeight);
      if (!(scale > 0)) { linkLayer.hidden = true; return false; }
      Object.assign(linkLayer.style, {left:`${canvas.left}px`,top:`${canvas.top}px`,width:`${canvas.width}px`,height:`${canvas.height}px`});
      Object.assign(tweetLink.style, {
        left:`${(canvas.width - viewportWidth * scale) / 2 + x * scale}px`,
        top:`${(canvas.height - viewportHeight * scale) / 2 + y * scale}px`,
        width:`${width * scale}px`,height:`${height * scale}px`
      });
      linkLayer.hidden = false;
      return true;
    },
    setResult(stage, score, jpegBase64) {
      // Replace atomically so a failed capture cannot attach an older score.
      const next = {stage:String(stage),score:Math.trunc(Number(score) || 0),file:null};
      if (jpegBase64) {
        try {
          const bytes = Uint8Array.from(host.atob(jpegBase64), char => char.charCodeAt(0));
          if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error('JPEG');
          next.file = new File([bytes], `nandemo-cannon-${next.score}.jpg`, {type:'image/jpeg'});
        } catch { message('がぞうをつくれませんでした。スコアはポストできます。'); }
      }
      result = next;
      active = true;
      if (tweetLink) {
        tweetLink.href = tweetURL(next.stage, next.score, resolvedGameURL);
        linkLayer.hidden = true;
      }
      if (next.file) message();
      return !!next.file;
    },
    hideResult() {
      active = false; message();
      if (tweetLink) { linkLayer.hidden = true; tweetLink.removeAttribute('href'); }
    },
    hasImage() { return !!result?.file; },
    canShareImage() {
      return !!(result?.file && host.navigator.share && host.navigator.canShare?.({files:[result.file]}));
    },
    tweet() {
      if (nativeTweetLink) return false; // Navigation belongs to the user's real anchor activation.
      if (!active || !result) return false;
      host.open(tweetURL(result.stage,result.score,resolvedGameURL),'_blank','noopener,noreferrer');
      return true;
    },
    download() {
      if (!active || !result?.file) return false;
      const url = URL.createObjectURL(result.file);
      const link = host.document.createElement('a');
      link.href = url; link.download = result.file.name;
      host.document.body.appendChild(link); link.click(); link.remove();
      host.setTimeout(() => URL.revokeObjectURL(url), 30000);
      return true;
    },
    async shareImage() {
      if (!active || !api.canShareImage()) return false;
      try {
        await host.navigator.share({
          title:'なんでもキャノン',
          text:`${resultText(result.stage,result.score)}\n#${RESULT_HASHTAG}`,
          url:resolvedGameURL,
          files:[result.file]
        });
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') message('がぞうのシェアができませんでした。「がぞうをほぞん」をおためしください。');
        return false;
      }
    }
  };
  host.NandemoShare = api;
  return api;
}
