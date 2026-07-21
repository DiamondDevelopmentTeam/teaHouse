# 1890 Tea House

The 1890 Tea House website is a responsive React and Vite single-page experience for the tea room, restaurant, private rooms, events, catering, and visitor information.

## Local development

```sh
cd client
npm ci
npm run dev
```

Quality checks:

```sh
npm run lint
npm run build
npm run verify:pages
```

## GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`. The workflow installs with the lockfile, lints, builds, verifies the deployment paths, uploads `client/dist`, and deploys it with GitHub Pages.

The production Vite base is `/teaHouse/`. React Router derives its `basename` from `import.meta.env.BASE_URL`, and `client/public/404.html` returns deep links through the SPA entry point before restoring the original URL.
