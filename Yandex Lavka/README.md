# Yandex Lavka case study

Route: `/yandex-lavka/`. The home page project link opens this page; the Lavka logo returns home.

Source: [Figma desktop](https://www.figma.com/design/r0nWm83DA537rthC3Jf96H/Portfolio?node-id=12-111) and [mobile](https://www.figma.com/design/r0nWm83DA537rthC3Jf96H/Portfolio?node-id=12-345).

- `index.html`: case images and captions, including the distinct mobile sequence from Figma.
- `case.css`: case-specific styles and image crops; shared typography and layout come from `/styles.css`.
- `case.js`, `content.js`: Context/Process/Result tabs, cart feedback and shared sound preference.
- `design.json`: measured Figma geometry and text. Asset manifests record the original Figma exports; downloaded images live in `public/assets/yandex-lavka/`. Identical desktop/mobile exports share one local image without recompression.

Run `npm run dev`; build with `npm run build`. The build publishes this folder's runtime files into `dist/yandex-lavka/`.

`scripts/verify-lavka.mjs` checks navigation, responsive widths, image loading, keyboard tabs, sound preference, sticky sidebar and cart feedback. It accepts `PLAYWRIGHT_PATH` and `CHROME_PATH` when dependencies are installed outside this project.

## Cursor and reader counter

Five transparent 32×32 cursor components are exported directly from Figma `15:486` into `public/assets/yandex-lavka/cursors/`. Each page load selects a random variant, excluding the previous variant in the same tab. Hovering the cart consumes the item until the next page load. Touch users tap the cart; their cursor is not changed.

`GET /api/lavka/readers` reads the shared total; `POST` records a reader once using an anonymous HttpOnly cookie. Only hashed identifiers are stored, without IP addresses or names. Clearing cookies or using another browser counts as a new visitor; this is a browser count, not account-based identification. The completed caption refreshes the total every 15 seconds while the tab is visible. Failed requests never display an invented count and can be retried by clicking the cart.

The Node server persists the counter in `.data/lavka-readers.json`, outside the build. `READER_STORE` can point to a persistent volume on a host. Both dev and preview use this API. For publication, run the Node server with persistent storage; serving only the static `dist` directory without the API cannot provide a shared counter. This file store is intended for one server process; multiple replicas require a shared database. `scripts/verify-readers.mjs` tests with an isolated temporary store so test visits do not inflate the real counter.
