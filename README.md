# IMEI Image Viewer (Static Web for GitHub Pages / Netlify / Vercel)

This is a static web UI that lets you:
- Input an IMEI (optionally fetch image list from your Apps Script endpoint)
- Or paste a list of image URLs manually
- View images in a gallery
- Copy individual image link / copy all links
- Open a modal "copy box" to Ctrl+A → Ctrl+C to copy image blobs (works across platforms)
- Download individual images or download all images sequentially (no ZIP)

## How to use

### Option A — Connect to your Apps Script backend
1. Deploy your Apps Script function as a Web App that returns JSON array for `GET ?imei=...`.
   Example expected response:
   ```json
   [
     { "name": "IMG_001.jpg", "url": "https://lh3.googleusercontent.com/..." },
     { "name": "IMG_002.jpg", "url": "https://lh3.googleusercontent.com/..." }
   ]
   ```
2. In the UI, paste your Apps Script web app URL into the **Apps Script API URL** field, type IMEI and click **Lấy ảnh từ Apps Script**.

> Notes: If your Apps Script currently uses `google.script.run`, you'll need to add a small `doGet(e)` endpoint that returns JSON for external fetch.

### Option B — Paste image URLs manually
- Paste direct image URLs (one per line) into the textarea and click **Load ảnh từ danh sách**.

## Hosting on GitHub Pages
1. Create a new GitHub repository and upload `index.html`, `styles.css`, `app.js`.
2. Enable GitHub Pages (Settings → Pages → Deploy from branch: main → / (root)).
3. Your site will be available at `https://<username>.github.io/<repo>/`.

## Limitations
- Copying multiple image blobs directly via Clipboard API may be blocked in some browsers or hosting contexts.
- The modal copy box allows Ctrl+A → Ctrl+C as a reliable fallback.
