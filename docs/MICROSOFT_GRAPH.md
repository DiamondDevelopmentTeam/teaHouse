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

Validate and sanitize every payload on the server. Use a restricted write-only workflow for inquiries and never return private list fields to the public client. Without an API URL, contact and large-party forms create a pre-addressed email instead.

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
