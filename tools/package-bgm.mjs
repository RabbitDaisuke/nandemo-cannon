// Build entry: ./build.sh bgm. This ZIP is a deployment handoff, not a download
// the game requests: browsers fetch and cache each selected MP3 once from either host.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {BGM_TRACKS} from '../web/bgmer-player.mjs';
import {extractStoredZipEntry} from '../web/wasm-loader.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'out/bgm-mirror');
const archive=path.join(root,'out/packages/nandemo-cannon-bgm.zip');
await fs.rm(folder,{recursive:true,force:true});
await fs.mkdir(path.join(folder,'audio/bgm'),{recursive:true});
await fs.mkdir(path.join(folder,'licenses'),{recursive:true});
await fs.mkdir(path.dirname(archive),{recursive:true});
const entries=[];
for(const track of BGM_TRACKS){
 const relative=`audio/bgm/${track.id}.mp3`;
 const data=await fs.readFile(path.join(root,'web',relative));
 await fs.writeFile(path.join(folder,relative),data);
 entries.push({path:relative,title:track.title,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}
await fs.copyFile(path.join(root,'web/licenses/bgmer.txt'),path.join(folder,'licenses/bgmer.txt'));
await fs.writeFile(path.join(folder,'BGM-UPLOAD.txt'),`なんでもキャノン BGMミラー配置用\n\nこのZIPを展開して、audio と licenses を nanndemo のGitHub Pages公開ルートへ置いてください。\n既存のindex.html、ゲーム本体、downloadsのエンジンZIPを変更する必要はありません。\n\n公開後に必要なURL:\n${entries.map(e=>`https://daisukedaisuketeam.github.io/nanndemo/${e.path}`).join('\n')}\nhttps://daisukedaisuketeam.github.io/nanndemo/licenses/bgmer.txt\n\nゲームはMP3を個別に再生します。ZIPをdownloadsへ置くだけでは配信されません。\n3曲は64kbpsモノラルMP3。初回エンジンZIPには含めません。\n音楽: BGMer https://bgmer.net/ （権利・出典: licenses/bgmer.txt）\n`);
await fs.writeFile(path.join(folder,'BGM-SHA256.txt'),entries.map(e=>`${e.sha256}  ${e.path}`).join('\n')+'\n');
await fs.rm(archive,{force:true});
execFileSync('zip',['-0','-X','-q','-r',archive,'.'],{cwd:folder});
execFileSync('unzip',['-t',archive],{stdio:'pipe'});
const zipped=await fs.readFile(archive);
for(const entry of entries){
 const bytes=extractStoredZipEntry(zipped,entry.path);
 if(createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error(`Bad music ZIP entry: ${entry.path}`);
}
console.log(JSON.stringify({archive,bytes:zipped.length,tracks:entries,integrity:'passed'},null,2));
