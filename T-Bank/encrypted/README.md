# Generated encrypted T-Bank assets

Before publishing, generate this directory locally with your own password:

```sh
TBANK_PASSWORD='your-strong-password' npm run encrypt:tbank
npm run build
```

Commit **all** generated `*.json` files together (manifest and numbered encrypted files).
No production bundle is supplied with a known test password. The verification script
creates a temporary bundle with a random test password and deletes it afterwards.

CI reads only these encrypted files. It must never receive `.private/`, the password,
or an AES key. The build intentionally fails until the encrypted bundle is generated.
