# Secure inquiry delivery with Microsoft Graph

The React/Vite website remains a static GitHub Pages application. Inquiry email is
sent by the separate Azure Function in `api`; the browser never calls Microsoft
Graph and visitors never sign in to Microsoft.

## Why the Function is required

GitHub Pages serves static files and cannot execute server-side code. Vite also
replaces every `VITE_*` value at build time and ships it in the public JavaScript
bundle. A Microsoft Entra client secret in a `VITE_*` variable would therefore be
available to every visitor and must never be used.

The safe request path is:

```text
GitHub Pages form
  -> POST Azure Function /api/send-inquiry
  -> Microsoft Entra app-only token
  -> Microsoft Graph /users/{sender}/sendMail
  -> beatriz@diamondpeo.com
```

The only inquiry setting in the Pages build is the public Function endpoint:

```env
VITE_INQUIRY_API_URL=https://<function-app-name>.azurewebsites.net/api/send-inquiry
```

## Endpoint behavior

`POST /api/send-inquiry` accepts JSON containing:

- `formType`: `general`, `reservation`, `event`, or `contact`
- `name`
- `email`
- `phone`
- `preferredDate` in `YYYY-MM-DD` format
- `preferredTime` when supplied by the reservation form
- `guestCount` from 1 through 500
- `inquiryCategory` from the options displayed by the form
- `message`
- `pageUrl`
- `preOrders` and `policyAgreement` when supplied by the reservation form
- `website`, an empty spam honeypot
- `recaptchaToken`, only when optional reCAPTCHA is enabled

The Function normalizes line endings and whitespace, strips control characters,
checks types and length limits, validates email, phone, date, guest count, and
inquiry category, page URL, optional reservation details, and HTML-escapes visitor
content before placing it in the email. A per-instance rate limiter permits five
POST attempts per client in ten minutes; production deployments should also use
an Azure perimeter rate-limit policy when distributed enforcement is required.
Malformed requests receive a generic structured error. Internal Graph responses
and credentials are never returned.

The repository contains two real forms:

- Visit/Contact inquiry form at `/contact`
- Large-party reservation/event form at `/reservations#large-party`

All Reserve controls outside these forms are navigation links to the Reservations
page or the external Toast booking service. There are no newsletter, modal,
mobile-menu, or other hidden submission forms.

Email subjects are selected only by the validated server-side `formType`:

- `1890 Tea House – General Inquiry`
- `1890 Tea House – Reservation Request`
- `1890 Tea House – Event Inquiry`
- `1890 Tea House – Contact Request`

Every response includes an `X-Request-ID` header and JSON `requestId`. Successful
responses use this shape:

```json
{
  "ok": true,
  "message": "Thank you! Your request has been sent to the Tea House team.",
  "requestId": "..."
}
```

Errors use this shape:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "Please check your submission and try again."
  },
  "message": "Please check your submission and try again.",
  "requestId": "..."
}
```

Azure logs record the request ID, a safe failure category, missing setting names,
and a Graph HTTP status when available. They do not record secrets, access tokens,
Graph response bodies, or inquiry contents.

## Microsoft Entra and Graph configuration

1. Create a Microsoft Entra app registration for the Function.
2. Under **API permissions**, add Microsoft Graph **Application** permission
   `Mail.Send`. Do not select the delegated permission.
3. A tenant administrator must grant admin consent. `Mail.Send` application
   permission requires it.
4. Create a client secret and copy it directly to the Function App configuration
   or, preferably, reference it from Azure Key Vault. Never place it in this
   repository, GitHub Pages variables, or a `VITE_*` variable.
5. Ensure `GRAPH_SENDER_EMAIL` is a real Microsoft 365 mailbox that the app may
   send as.
6. Because application `Mail.Send` is powerful, use Exchange Online
   [Application RBAC](https://learn.microsoft.com/exchange/permissions-exo/application-rbac)
   to scope the service principal to the sender mailbox.

The Function uses the documented MIME form of
[`POST /users/{id}/sendMail`](https://learn.microsoft.com/graph/api/user-sendmail)
so the message can contain both plain-text and HTML alternatives plus a real
`Reply-To` header.

## Required Azure Function settings

Configure these server-only application settings:

| Setting | Required | Purpose |
| --- | --- | --- |
| `AZURE_TENANT_ID` | Yes | Microsoft Entra tenant ID |
| `AZURE_CLIENT_ID` | Yes | App registration client ID |
| `AZURE_CLIENT_SECRET` | Yes | App credential; server only |
| `GRAPH_SENDER_EMAIL` | Yes | Authorized Microsoft 365 sender mailbox |
| `INQUIRY_RECIPIENT_EMAIL` | Yes | Must be `beatriz@diamondpeo.com` |
| `ADDITIONAL_ALLOWED_ORIGINS` | No | Comma-separated future custom origins |
| `RECAPTCHA_SECRET_KEY` | No | Optional reCAPTCHA v2 server secret |
| `ALLOWED_RECAPTCHA_HOSTNAMES` | With reCAPTCHA | Comma-separated accepted hostnames |

The Function always permits only these built-in browser origins:

```text
https://diamonddevelopmentteam.github.io
http://localhost:5173
http://localhost:5174
```

Add a future custom domain as an origin, without a path:

```text
ADDITIONAL_ALLOWED_ORIGINS=https://www.1890teahouse.com
```

Also add the same origins under the Function App's **API > CORS** settings. Do not
use `*`. Azure documents the portal and CLI CORS options in
[Configure function app settings](https://learn.microsoft.com/azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors).

reCAPTCHA is optional. If enabled, configure both `RECAPTCHA_SECRET_KEY` and
`ALLOWED_RECAPTCHA_HOSTNAMES` on the Function and set
`VITE_RECAPTCHA_SITE_KEY` in GitHub. If it is not enabled, leave all three empty.

## Run locally

Prerequisites are Node.js 22 or later, Azure Functions Core Tools v4, and Azurite
when using `UseDevelopmentStorage=true`.

1. Install and test both projects:

   ```sh
   cd api
   npm install
   npm run lint
   npm run typecheck
   npm run build
   npm run test

   cd ../client
   npm install
   npm run lint
   npm run typecheck
   npm run build
   npm run test
   ```

2. Copy `api/local.settings.example.json` to `api/local.settings.json`, fill in
   the five required server settings, and keep the file uncommitted.
3. Start the Function:

   ```sh
   cd api
   npm start
   ```

4. Create `client/.env.local` with public values only:

   ```env
   VITE_INQUIRY_API_URL=http://localhost:7071/api/send-inquiry
   VITE_RECAPTCHA_SITE_KEY=
   ```

5. Start the frontend on an allowed origin:

   ```sh
   cd client
   npm run dev -- --port 5173
   ```

Use both real forms for end-to-end tests. A `202` response and request ID mean
Graph accepted a message; they do not by themselves prove mailbox delivery.

## Deploy the Azure Function

1. Create a Node.js 22 Azure Function App using Functions runtime v4, or select
   the existing Function App.
2. Add the required application settings above in Azure Portal. Restart the app
   after changing settings.
3. Add each approved origin to the Function App CORS allowlist. The CLI form is:

   ```sh
   az functionapp cors add \
     --resource-group <resource-group> \
     --name <function-app-name> \
     --allowed-origins https://diamonddevelopmentteam.github.io
   ```

   Repeat for the localhost origins and any configured custom origin.
4. From the `api` directory, validate and deploy:

   ```sh
   npm install
   npm run lint
   npm run typecheck
   npm run build
   npm run test
   func azure functionapp publish <function-app-name>
   ```

   Azure Functions Core Tools uses zip deployment for this command. See
   [Develop Azure Functions locally using Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local).
5. Send an `OPTIONS` preflight from an approved origin and confirm the response
   includes `Access-Control-Allow-Origin` for that exact origin.

## Configure and test GitHub Pages

In the `diamonddevelopmentteam/teaHouse` repository, add this **Actions
repository variable**:

```text
VITE_INQUIRY_API_URL=https://<function-app-name>.azurewebsites.net/api/send-inquiry
```

The Pages workflow injects it during `npm run build` and now fails rather than
publishing a bundle when it is missing or is not an HTTPS `/api/send-inquiry`
URL. Do not add any Microsoft credential as a repository variable or secret for
the Pages job.

To reproduce a production Pages build locally in PowerShell:

```powershell
cd client
$env:VITE_BASE_PATH = '/teaHouse/'
$env:VITE_INQUIRY_API_URL = 'https://<function-app-name>.azurewebsites.net/api/send-inquiry'
npm run build
npm run verify:pages
npm run verify:forms
npm run preview -- --port 5174
```

Open `http://localhost:5174/teaHouse/contact`, submit a real test inquiry, and
confirm the browser receives `202` with a request ID.

For production verification:

1. Deploy the Function and add the GitHub repository variable.
2. Re-run the GitHub Pages workflow or push to `main`.
3. Open `https://diamonddevelopmentteam.github.io/teaHouse/contact`.
4. Submit uniquely identifiable Visit and large-party test messages.
5. Record the request ID shown in the response/network panel.
6. Confirm both messages arrived at `beatriz@diamondpeo.com`, the From address is
   `GRAPH_SENDER_EMAIL`, Reply-To is the visitor's address, and the name, phone,
   date, guest count, inquiry category, message, page URL, timestamp, and request
   ID are present.
7. If mail is missing, search Application Insights/Function logs by request ID
   and then check the sender mailbox's Sent Items, Exchange message trace, and
   junk/quarantine handling.
