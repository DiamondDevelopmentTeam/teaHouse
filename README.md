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

## Secure inquiry email

The Visit and large-party reservation/event forms share one typed frontend
submission service and post to the separate Azure Function in `api`. The Function
validates each request and sends it to `beatriz@diamondpeo.com` through Microsoft
Graph application authentication from `donotreply@diamondpeo.com`. Both forms use
visible reCAPTCHA v2 and the Function verifies every token before Graph is called.
The GitHub Pages bundle contains only the public Function URL and reCAPTCHA site
key; the reCAPTCHA secret and Graph credentials remain server-side.

Copy `client/.env.example` to `client/.env.local` for local frontend work. In
GitHub, configure `VITE_INQUIRY_API_URL` and `VITE_RECAPTCHA_SITE_KEY` as Actions
repository variables. In the `diamondpeo-webforms-api` Azure Function App,
configure `RECAPTCHA_SECRET_KEY`, `GRAPH_SENDER_EMAIL=donotreply@diamondpeo.com`,
the Microsoft Graph tenant/client settings, recipient, CORS origins, and any
additional approved reCAPTCHA hostnames as Function App application settings.
Never use a `VITE_*` name for a server secret.

See `docs/MICROSOFT_GRAPH.md` for the endpoint contract, Microsoft Entra and
`Mail.Send` setup, Azure settings, local testing, deployment, CORS, GitHub
repository variable, and real-delivery verification.

## GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`. The workflow requires the
public `VITE_INQUIRY_API_URL` and `VITE_RECAPTCHA_SITE_KEY` repository variables, installs with the lockfile,
lints, builds, verifies the deployment paths, uploads `client/dist`, and deploys
it with GitHub Pages.

The production Vite base is `/teaHouse/`. React Router derives its `basename` from `import.meta.env.BASE_URL`, and `client/public/404.html` returns deep links through the SPA entry point before restoring the original URL.
