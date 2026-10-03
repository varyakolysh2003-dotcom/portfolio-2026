import { cp, mkdir, rm, readFile, readdir } from 'node:fs/promises';
try {
  const manifest=JSON.parse(await readFile('T-Bank/encrypted/manifest.json','utf8'));
  if(manifest.version!==1 || manifest.iterations<250000)throw new Error('Invalid manifest');
  if(!Array.isArray(manifest.files) || !manifest.files.includes(manifest.content))throw new Error('Incomplete manifest');
  for(const name of manifest.files) {
    if(!/^\d+\.json$/.test(name))throw new Error('Invalid encrypted filename');
    const envelope=JSON.parse(await readFile(`T-Bank/encrypted/${name}`,'utf8'));
    if(envelope.version!==1 || !envelope.iv || !envelope.ciphertext)throw new Error('Invalid encrypted file');
  }
} catch {
  throw new Error('T-Bank encrypted bundle missing or invalid. Run npm run encrypt:tbank locally with TBANK_PASSWORD, then commit T-Bank/encrypted/*.json. CI needs only encrypted files.');
}
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'sound-effects.js', 'icon-interactions.js', 'page-reveal.js', 'i18n.js', 'translations.js']) await cp(file, `dist/${file}`);
await mkdir('dist/yandex-lavka', { recursive: true });
for (const file of ['index.html', 'case.css', 'case.js', 'content.js', 'reader-interaction.js']) await cp(`Yandex Lavka/${file}`, `dist/yandex-lavka/${file}`);
console.log('Built portfolio in dist/');
await mkdir('dist/t-bank',{recursive:true});
for (const file of ['index.html','case.css','case.js','decrypt.js','lazy-media.js','spoiler.js','text-spoiler.js','text-particles.js']) await cp(`T-Bank/${file}`, `dist/t-bank/${file}`);

await mkdir('dist/t-bank/encrypted',{recursive:true});
for(const name of await readdir('T-Bank/encrypted')) if (/^(manifest|\d+)\.json$/.test(name)) await cp(`T-Bank/encrypted/${name}`,`dist/t-bank/encrypted/${name}`);
