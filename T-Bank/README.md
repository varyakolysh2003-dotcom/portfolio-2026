# T-Bank cases

Page: `/t-bank/`, linked from the home page. The logo returns home.

Figma references: locked desktop `19:499`, Profile desktop `19:587`, Main 8.0 desktop `19:675`, mobile `19:837`, `19:924`, `19:1005` in the Portfolio file. Quizi is deliberately disabled and has no page or request handler.

`index.html`, `case.css`, `case.js` implement the page with shared Geist typography, layout and click sounds. `spoiler.js` follows `spoiler-effect-instruction.md`: blur plus animated white dots, paused outside the viewport and disabled for reduced motion. The sidebar pill is a password input. Clicking a locked image focuses this input. Enter submits the masked password; an unsuccessful attempt silently clears and resets the field. Successful authentication reveals all Profile images and enables the case tabs.

## Protected content

The supplied password is configured as a salted scrypt hash in `.data/tbank-auth.json`, alongside a random session signing secret. The plaintext password is not included in the client or build. The API in `scripts/tbank-api.mjs` issues an HttpOnly, SameSite session cookie valid for at most eight hours and cleared on each page load and checks it before returning images or Main 8.0 content. Failed password attempts are rate-limited. Public previews contain only the already blurred Figma images.

Protected Figma exports and Main 8.0 markup live in `.private/tbank/`, which the static server refuses to serve directly. The original birthday video is reused from the existing public home page. Private screenshots and source measurements are kept under `.private/tbank/verification/` and `.private/tbank/design.json`.

For deployment, retain `.private/tbank/` and `.data/tbank-auth.json` outside the public web root and run the Node server (`npm run preview` after building). `TBANK_PRIVATE_DIR` and `TBANK_AUTH_FILE` override these locations. Do not upload either directory to a static public bucket. Static-only hosting cannot provide the password API. Credentials and private working files are excluded from the static build and Git.

## Verification

`scripts/verify-tbank.mjs` uses an isolated test password and server to check locked assets, incorrect/correct password, session reset on reload, keyboard tabs, mobile tap, disabled Quizi, shared sound, original video, image decoding and responsive widths. Browser comparison screenshots are stored privately. Main layout and text match Figma; intended differences are the requested dot spoiler, inline password input and working mobile tabs (the unlocked Profile mobile reference still shows the password label).

Every reload starts with locked spoilers and an empty password field. Focusing the field hides its placeholder without an outline; blur restores the placeholder when empty.

Unlocked artwork uses the original Figma SVG compositions with embedded original PNG screens (1080–1500 px wide), preserving vector gradients, crops and shadows. Both desktop and mobile variants use these originals, not reduced screenshot exports. Successful password entry no longer transfers focus to Profile; keyboard tab navigation remains available.
