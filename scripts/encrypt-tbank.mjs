import { readFile, writeFile, mkdir, readdir, rm, rename } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const password = process.env.TBANK_PASSWORD;
if (!password) { console.error('Set TBANK_PASSWORD before running npm run encrypt:tbank (local only).'); process.exit(1); }
const root = resolve('.private/tbank');
const output = resolve('T-Bank/encrypted');
const staging = `${output}.tmp`;
const iterations = 310000;
try {
  const copy = JSON.parse(await readFile(`${root}/copy.json`, 'utf8'));
  const { translations } = await import(pathToFileURL(`${root}/translations.mjs`));
  const main = await readFile(`${root}/main.html`, 'utf8');
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  const media = {};
  let index = 0;
  async function encrypt(bytes) {
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
    const file = `${index++}.json`;
    await writeFile(`${staging}/${file}`, JSON.stringify({ version: 1, iv: Buffer.from(iv).toString('base64'), ciphertext: Buffer.from(ciphertext).toString('base64') }));
    return file;
  }
  // Encrypt every media file served by the old API, including unused originals.
  for (const name of (await readdir(`${root}/media`)).sort()) {
    if (!/^(profile|main)(Desktop|Mobile)-\d-\d\.(png|svg)$/.test(name)) continue;
    media[name] = { file: await encrypt(await readFile(`${root}/media/${name}`)), type: name.endsWith('.svg') ? 'image/svg+xml' : 'image/png' };
  }
  // Public portfolio showreel assets remain public; all old protected URLs must resolve.
  for (const match of main.matchAll(/\/api\/tbank\/media\/([^"'\s]+)/g)) {
    if (!media[match[1]]) throw new Error(`Missing protected media: ${match[1]}`);
  }
  const content = await encrypt(Buffer.from(JSON.stringify({ copy: { ...copy, translations: translations(copy) }, main: main.replaceAll('/api/tbank/media/', 'tbank-media:').replaceAll('/assets/', '../assets/'), media })));
  await writeFile(`${staging}/manifest.json`, JSON.stringify({ version: 1, kdf: 'PBKDF2', hash: 'SHA-256', iterations, cipher: 'AES-GCM', salt: Buffer.from(salt).toString('base64'), content, files: Array.from({ length: index }, (_, i) => `${i}.json`) }));
  await mkdir(output, { recursive: true });
  // All encryption completes before replacing generated files; manifest is published last.
  for (const name of await readdir(staging)) if (name !== 'manifest.json') await rename(`${staging}/${name}`, `${output}/${name}`);
  await rename(`${staging}/manifest.json`, `${output}/manifest.json`);
  await rm(staging, { recursive: true, force: true });
  console.log(`Encrypted ${Object.keys(media).length} media files and case content in T-Bank/encrypted/.`);
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  console.error(`T-Bank encryption failed: ${error.code || error.message}`);
  process.exitCode = 1;
}
