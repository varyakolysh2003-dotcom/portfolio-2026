const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const directory = new URL('./encrypted/', import.meta.url);
async function read(file) {
  if (!/^(manifest|\d+)\.json$/.test(file)) throw new Error('Invalid encrypted file');
  const response = await fetch(new URL(file, directory));
  if (!response.ok) throw new Error('Encrypted case unavailable');
  return response.json();
}
export async function decryptCase(password) {
  const manifest = await read('manifest.json');
  if (manifest.version !== 1 || manifest.kdf !== 'PBKDF2' || manifest.hash !== 'SHA-256' || manifest.cipher !== 'AES-GCM' || !Number.isInteger(manifest.iterations) || manifest.iterations < 250000 || manifest.iterations > 2000000) throw new Error('Unsupported encrypted case');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  password = '';
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: decode(manifest.salt), iterations: manifest.iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  async function decrypt(file) {
    const envelope = await read(file);
    if (envelope.version !== 1) throw new Error('Unsupported encrypted file');
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.ciphertext));
  }
  const content = JSON.parse(new TextDecoder().decode(await decrypt(manifest.content)));
  const urls = new Map();
  const dispose = () => { for (const url of urls.values()) URL.revokeObjectURL(url); urls.clear(); };
  try {
    // Finish authentication and decryption before revealing any page content.
    for (const [name, asset] of Object.entries(content.media)) {
      urls.set(name, URL.createObjectURL(new Blob([await decrypt(asset.file)], { type: asset.type })));
    }
    return { ...content, mediaUrl(name) { if (!urls.has(name)) throw new Error('Missing case media'); return urls.get(name); }, dispose };
  } catch (error) { dispose(); throw error; }
}
