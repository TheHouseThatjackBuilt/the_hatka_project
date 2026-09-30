# IBM Plex Sans

Локальные оригинальные WOFF2: Regular 400 и Medium 500, полный набор символов
с кириллицей. Файлы не модифицированы; npm-пакет и CDN не используются.

Источник: [IBM/plex](https://github.com/IBM/plex/tree/bf260093582f04622aacc1e9f9ca604d7ccd0c42/packages/plex-sans/fonts/complete/woff2).
Снимок от 2026-09-14, commit `bf260093582f04622aacc1e9f9ca604d7ccd0c42`.
Лицензия [SIL OFL 1.1](LICENSE.txt) скопирована из `packages/plex-sans/LICENSE.txt`
того же commit и включается в сборку ссылкой с демонстрационного экрана.

| Файл                      | Байты | SHA-256                                                            |
| ------------------------- | ----: | ------------------------------------------------------------------ |
| IBMPlexSans-Regular.woff2 | 63020 | `ba711a3085ff9f27440b6b9c4550cfc47c97bf36591d5da958b975bb3add8c1a` |
| IBMPlexSans-Medium.woff2  | 66740 | `5660f8a658f8bb50dbc005232f885eadffd2bc1c235c4f6fbb63469d1f9cde6d` |

Подключение — в [fonts.css](../fonts.css), `font-display: swap`. Vite копирует
ресурсы с хешами в `dist/assets/`. Шрифты загружаются только при использовании
новой темы; базовый просмотрщик их не запрашивает на этапе R1.1.
