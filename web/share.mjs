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
export function installResultSharing(host = window) {
  let result = null;
  let active = false;
  const gameURL = new URL('.', host.location.href).href;
  const status = host.document.querySelector('#share-status');
  function message(value = '') {
    if (status) { status.textContent = value; status.hidden = !value; }
  }
  const api = {
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
      if (next.file) message();
      return !!next.file;
    },
    hideResult() { active = false; message(); },
    hasImage() { return !!result?.file; },
    canShareImage() {
      return !!(result?.file && host.navigator.share && host.navigator.canShare?.({files:[result.file]}));
    },
    tweet() {
      if (!active || !result) return false;
      host.open(tweetURL(result.stage,result.score,gameURL),'_blank','noopener,noreferrer');
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
          url:gameURL,
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
