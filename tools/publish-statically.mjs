// Publish the merged Actions artifacts to their dedicated branch.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

export async function publishRuntime(root) {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '') || !token) throw new Error('Run Deploy Pages in the standalone GitHub repository.');
  const metadataResponse = await fetch(`https://api.github.com/repos/${repository}`, {headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(30000)});
  if (!metadataResponse.ok) throw new Error(`Cannot inspect the target repository (${metadataResponse.status}).`);
  const metadata = await metadataResponse.json();
  if (metadata.private !== false) throw new Error('Statically needs a public repository. Repository visibility will not be changed automatically.');
  const checkout = path.join(root, '.cache/cdn-publish');
  await fs.rm(checkout, {recursive: true, force: true});
  await fs.mkdir(checkout, {recursive: true});
  // Authentication lives only in child environment variables, never Git config,
  // shell arguments, committed files, or logs.
  const gitEnvironment = {...process.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: 'AUTHORIZATION: basic ' + Buffer.from(`x-access-token:${token}`).toString('base64')};
  async function git(args, expected = [0]) {
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, {cwd: checkout, env: gitEnvironment, stdio: ['ignore', 'pipe', 'pipe']});
      let stdout = '', stderr = '';
      child.stdout.on('data', data => {stdout += data;});
      child.stderr.on('data', data => {stderr += data;});
      child.on('error', reject);
      child.on('close', code => expected.includes(code) ? resolve({code, output: stdout.trim()}) : reject(new Error(`Git ${args[0]} failed (${code}): ${stderr.replaceAll(token, '[redacted]')}`)));
    });
  }
  await git(['init', '--initial-branch=cdn-assets']);
  await git(['remote', 'add', 'origin', `https://github.com/${repository}.git`]);
  const remote = await git(['ls-remote', '--exit-code', 'origin', 'refs/heads/cdn-assets'], [0, 2]);
  if (remote.code === 0) {
    await git(['fetch', '--depth=1', 'origin', 'refs/heads/cdn-assets']);
    await git(['checkout', '-B', 'cdn-assets', 'FETCH_HEAD']);
    const marker = await fs.readFile(path.join(checkout, '.nandemo-cannon-cdn'), 'utf8').catch(() => '');
    if (marker.trim() !== 'nandemo-cannon-godot-runtime-v1') throw new Error('Existing cdn-assets branch is not owned by this build. It was left unchanged.');
  }
  for (const name of await fs.readdir(checkout)) {
    if (name !== '.git') await fs.rm(path.join(checkout, name), {recursive: true, force: true});
  }
  await fs.cp(path.join(root, 'out/standalone'), checkout, {recursive: true});
  await fs.mkdir(path.join(checkout, 'downloads'), {recursive: true});
  await fs.copyFile(path.join(root, 'out/packages/nandemo-cannon-web-4.7.2.zip'), path.join(checkout, 'downloads/nandemo-cannon-web-4.7.2.zip'));
  await fs.writeFile(path.join(checkout, '.nandemo-cannon-cdn'), 'nandemo-cannon-godot-runtime-v1\n');
  await fs.writeFile(path.join(checkout, 'README.md'), '# なんでもキャノン Web build\nGenerated from the source repository by Deploy Pages.\nThe root contains the complete standalone Web build. downloads/nandemo-cannon-web-4.7.2.zip is the same distributable as a ZIP.\nLICENSE is the original game license; licenses/godot/ contains the unchanged upstream Godot and third-party license documents.\nThe official unmodified Godot runtime is under runtime/godot/4.7.2/ as a real gzip file for Statically.\n');
  await git(['add', '--all']);
  const changed = await git(['diff', '--cached', '--quiet'], [0, 1]);
  if (changed.code === 1) {
    await git(['config', 'user.name', 'github-actions[bot]']);
    await git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
    const message = path.join(root, '.cache/cdn-commit-message.txt');
    await fs.writeFile(message, 'Publish なんでもキャノン Web build\n');
    await git(['commit', '--cleanup=verbatim', '--allow-empty-message', '--file', message]);
    await git(['push', 'origin', 'HEAD:refs/heads/cdn-assets']);
  }
  const commit = (await git(['rev-parse', 'HEAD'])).output;
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid CDN commit SHA');
  const baseURL = `https://cdn.statically.io/gh/${repository}@${commit}/runtime/godot/4.7.2/`;
  const publication = {provider: 'Statically', repository, branch: 'cdn-assets', commit, baseURL};
  await fs.writeFile(path.join(root, 'out/cdn-publication.json'), JSON.stringify(publication, null, 2) + '\n');
  console.log(`CDN runtime commit: ${commit}`);
  return publication;
}
