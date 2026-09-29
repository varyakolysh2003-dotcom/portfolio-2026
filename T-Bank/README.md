# T-Bank case

The same static client runs locally and on GitHub Pages, including under
`/portfolio-2026/`. It has no authentication API dependency.

## Local preparation

Original content stays in `.private/tbank/`: `copy.json`, `main.html`, `media/`,
and `translations.mjs` (the private translations migrated from public source).
Keep this directory backed up privately; it is ignored by Git.

Run once before publishing and again whenever private content or the password changes:

```sh
TBANK_PASSWORD='your-strong-password' npm run encrypt:tbank
npm run build
```

Alternatively, read the password without including it in shell history (zsh):

```sh
read -s 'TBANK_PASSWORD?Case password: '
export TBANK_PASSWORD
npm run encrypt:tbank
unset TBANK_PASSWORD
npm run build
```

Commit all `T-Bank/encrypted/*.json` files along with the application changes.
Never commit `.private/`, `.data/`, passwords, or derived keys. GitHub Actions needs
neither the private directory nor an environment secret; it copies the prepared
ciphertext into `dist/t-bank/encrypted/`. A missing bundle/file fails the build.
The checkout intentionally contains no bundle encrypted with a known test password.

## Format and runtime

`manifest.json` records version 1, PBKDF2/SHA-256, 310,000 iterations, a random
16-byte salt, and the required encrypted filenames. Every numbered JSON file
contains version 1, a fresh 12-byte IV, and base64 AES-256-GCM ciphertext including
the authentication tag. One key is derived per bundle. Keys are non-extractable in
the browser. The encrypted content index contains copy, translations, Main HTML,
and media mapping; all media previously served by the private API are encrypted.

The browser authenticates and decrypts before revealing the case. Images use Blob
URLs, released when leaving the page; no password, key, session, or unlocked state
is written to storage or cookies. Reload locks the case. Wrong passwords clear the
input. Locked caption particle effects use dummy text, with real copy restored
only after decryption. Private captions and translations are absent from public JS.

The birthday showreel and poster remain public because the portfolio homepage
already uses them; they were never protected by the old API. The legacy API files
remain for reference but `serve.mjs` no longer routes to them.

Client-side encryption permits offline password guessing. Use a strong, unique
password. Changing it does not revoke previously downloaded/decrypted material.
Removing plaintext from the current checkout does not erase earlier Git history.

## Verification

`npm run verify:tbank` requires Playwright and Chrome (optional `PLAYWRIGHT_PATH`
and `CHROME_PATH` overrides). It creates an isolated temporary copy, encrypts with a
random test-only password, removes the private inputs, builds, applies the exact
GitHub Pages path adaptation, and serves only static files under `/portfolio-2026/`.
It checks wrong/correct password, reload, tabs, responsive image decoding, video,
Russian translations, absent API requests, missing bundle failures, and scans the
build against private text and media hashes. Test ciphertext is deleted afterwards;
screenshots stay in `.private/tbank/verification/`.
