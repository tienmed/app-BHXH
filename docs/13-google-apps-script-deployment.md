# Google Apps Script Deployment

## Why An Internal Proxy Is Used

Browser calls from `localhost` or a deployed web frontend to `script.google.com` can run into CORS limitations.

To avoid that:

- Google Apps Script remains the external data API
- the Next.js app calls its own internal route
- the internal route performs the server-side fetch to Apps Script

## Environment Variables

Use one of these:

- `GOOGLE_APPS_SCRIPT_URL`
- or legacy fallback `NEXT_PUBLIC_RECOMMENDATION_API_URL`

Recommended:

- set only `GOOGLE_APPS_SCRIPT_URL`

## Real Deployment Flow

1. Create the Google Sheet workbook and import the pilot CSV files.
2. Create an Apps Script project.
3. Add [Code.gs](C:/Users/Thinkpad X280/Documents/App BHXH/integrations/google-apps-script/Code.gs) and [appsscript.json](C:/Users/Thinkpad X280/Documents/App BHXH/integrations/google-apps-script/appsscript.json).
4. Update `APP_BHXH_CONFIG.workbookId` if the script is not bound to the workbook.
5. Deploy as a Web App and copy the `/exec` URL.
6. Create `.env.local` in the web app root project and set:

```bash
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

7. Start the app with `npm run dev`.
8. The doctor UI will call the internal Next.js API route, which proxies to Apps Script.

## Smoke Test

After deployment:

- open the doctor UI
- select one or more ICD codes
- click `Tải gợi ý`
- confirm the status message says data came from Google Apps Script

## Notes

- if Apps Script fails, the UI falls back to local pilot data
- this keeps the pilot usable even during Sheet/API setup
