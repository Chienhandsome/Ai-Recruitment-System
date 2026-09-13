# Candidate Interview Web

Static candidate page for the AI interview flow.

## Local

`config.js` points to `http://127.0.0.1:8010` by default. Start it with:

```powershell
.\run.ps1
```

## Vercel

Set the Vercel environment variable below, then use build command `npm run build`
and output directory `.`:

```env
INTERVIEW_WEB_API_URL=https://interview-api.example.com
```

The build script writes this public API URL into `config.js`; it must never
contain a key or secret.
