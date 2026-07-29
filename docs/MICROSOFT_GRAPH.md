# Microsoft Graph integration path

The public site remains deployable as a static GitHub Pages application. Each content type has a focused module under `client/src/data`, and the page components read through `client/src/services/contentService.js`. Form submissions use `client/src/services/inquiryService.js`.

This adapter boundary lets the site move to Microsoft Lists or SharePoint without rewriting the route components.

## Recommended architecture

Do not call Microsoft Graph from the browser with an application secret.

1. Store public business content in SharePoint Lists or Microsoft Lists.
2. Store menu, event, gallery, and journal files in a SharePoint document library.
3. Register a Microsoft Entra ID application for a server-side Azure Function or Azure App Service.
4. Keep the tenant ID, client ID, certificate or secret in server-side application settings or Azure Key Vault.
5. Grant only the least-privilege Microsoft Graph permissions needed for the selected site, lists, and library.
6. Expose a small public, validated API to the website.

The browser receives only the API base URL:

```env
VITE_CONTENT_API_BASE_URL=https://your-api.azurewebsites.net/api
```

## Suggested read endpoints

- `GET /business`
- `GET /menus`
- `GET /events`
- `GET /news`
- `GET /journal`
- `GET /journal/:slug`
- `GET /faqs`
- `GET /gallery`
- `GET /tea-rooms`

The API should return the same shapes as the corresponding files in `client/src/data`. If the remote service is unavailable, `contentService.refresh()` falls back to the bundled content.

## Suggested submission endpoints

- `POST /inquiries/contact`
- `POST /inquiries/large-parties`
- `POST /inquiries/employment`

Validate and sanitize every payload on the server. Use a restricted write-only workflow for inquiries and never return private list fields to the public client. Inquiry forms require the API URL and show an inline unavailable message when it is not configured; they never open an email application.

## Secure contact email function

The `api` project implements `POST /api/inquiries/contact` as an Azure Function. It validates and normalizes the request, checks the reCAPTCHA token and hostname with Google, and then uses app-only Microsoft Graph `Mail.Send` authentication to send from the configured mailbox. The public request cannot select the sender, recipient, or Graph endpoint. The server enforces `INQUIRY_RECIPIENT_EMAIL=beatriz@diamondpeo.com`; `GRAPH_SENDER_EMAIL` must be the real Microsoft 365 mailbox authorized to send.

### Local development

1. Copy `api/local.settings.example.json` to `api/local.settings.json`.
2. Fill in the local file manually and never commit it.
3. Install and run [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local), then start the API on port 7071:

   ```sh
   cd api
   npm ci
   npm start
   ```

4. Create `client/.env.local` containing public browser configuration only:

   ```env
   VITE_CONTENT_API_BASE_URL=http://localhost:7071/api
   VITE_RECAPTCHA_SITE_KEY=
   ```

5. Start the frontend with `npm run dev` from `client`.

`api/local.settings.json` is for local development only. Do not publish it or put its values in frontend variables, logs, tests, documentation, or GitHub Pages.

### Azure deployment

1. Create or select a Microsoft Entra app registration and grant Microsoft Graph `Mail.Send` application permission with administrator consent.
2. Add `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `GRAPH_SENDER_EMAIL`, `INQUIRY_RECIPIENT_EMAIL=beatriz@diamondpeo.com`, `RECAPTCHA_SECRET_KEY`, `ALLOWED_ORIGINS`, and `ALLOWED_RECAPTCHA_HOSTNAMES` to the Function App Configuration / environment variables.
3. Add `https://diamonddevelopmentteam.github.io` to the Function App CORS settings. Origins do not include a path, so do not add `/teaHouse/`.
4. Register the production hostname with the reCAPTCHA v2 checkbox configuration.
5. Set the public GitHub repository variables `VITE_CONTENT_API_BASE_URL` and `VITE_RECAPTCHA_SITE_KEY` for the Pages build.
6. Deploy the `api` project separately from the static GitHub Pages site.

Do not publish `local.settings.json`, place backend secrets in GitHub Pages, or use `VITE_*` variables for confidential values. The Graph `Mail.Send` application permission is powerful; restrict the app to the intended sender mailbox through the organization’s Microsoft 365 administration process as a follow-up security measure.

## Suggested Lists and libraries

- `TeaHouseSettings`: address, phone, email, hours, social and reservation links
- `TeaHouseMenus`: title, description, image, PDF, active date, sort order
- `TeaHouseEvents`: start/end, description, location, offer, status, image
- `TeaHouseNews`: publication, date, headline, summary, image, article URL
- `TeaHouseJournal`: slug, title, date, excerpt, sections, image, status
- `TeaHouseFAQs`: question, answer, sort order, active
- `TeaHouseGallery`: image, alt text, caption, category, sort order
- `TeaHouseRooms`: label, description, uses, image, sort order
- `TeaHouseInquiries`: type, contact fields, message, created date, status
- SharePoint document library: menu PDFs, menu images, event artwork, gallery, and journal media

## Migration sequence

1. Create the Lists, library, columns, indexes, and retention rules.
2. Register the Microsoft Entra application for the server-side API.
3. Use Sites.Selected or another least-privilege Graph model where practical.
4. Store credentials in Azure configuration or Key Vault.
5. Implement and validate the read and submission endpoints.
6. Add rate limiting, spam protection, logging, and alerting.
7. Set `VITE_CONTENT_API_BASE_URL` for the production build.
8. Test remote reads, form writes, and the static fallback independently.

The same server can later create Outlook calendar items, post Teams notifications, or trigger Power Automate without exposing Microsoft 365 credentials to the React application.
