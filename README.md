# 1890 Tea House

The 1890 Tea House website is a responsive React and Vite experience for the tea room, restaurant, private rooms, events, catering, and visitor information.

## Completed routes

The site includes dedicated pages for About, Menus, Events, Reservations, Tea Rooms, News, Gallery, FAQs, Journal, every Journal article, Contact, Careers, Privacy, Terms, and a custom 404 page. The original editorial home page remains the landing experience.

## Local development

```sh
cd client
npm ci
npm run dev
```

Quality checks:

```sh
npm run lint
npm run audit:images
npm run build
npm run verify:pages
```

## Image delivery

Images use explicit width and height values to prevent layout shift, native lazy loading for below-the-fold media, asynchronous decoding, responsive `sizes`, and WebP sources where available. Run `npm run audit:images` before deployment to identify oversized source files.

## Microsoft Graph readiness

Business settings, menus, events, news, journal posts, FAQs, gallery images, and Tea Rooms are separated under `client/src/data`. The adapters in `client/src/services` use bundled content today and are ready for a secure backend configured with `VITE_CONTENT_API_BASE_URL`.

Keep Microsoft Graph credentials out of the browser. See `docs/MICROSOFT_GRAPH.md` for the recommended Azure Function or App Service architecture, SharePoint List model, API contract, and migration sequence.

## GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`. The workflow installs with the lockfile, lints, builds, verifies the deployment paths, uploads `client/dist`, and deploys it with GitHub Pages.

The production Vite base is `/teaHouse/`. React Router derives its `basename` from `import.meta.env.BASE_URL`, and `client/public/404.html` returns deep links through the SPA entry point before restoring the original URL.
