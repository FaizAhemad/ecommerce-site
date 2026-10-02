# WhatsApp vendor intake for Windows

This is a separate local Node.js tool. It receives signed Meta Cloud API direct-message webhooks, keeps an inbox in SQLite, downloads supported vendor media and generates one Excel workbook per vendor. It does not run inside Vercel, send WhatsApp messages, use WhatsApp Web automation, or write to the ecommerce catalog.

Status: offline implementation/tested fixtures only. No real business number, credentials, live receiver, tunnel or Windows startup task has been configured. The WhatsApp Business mobile app alone does not establish that a number is connected to this API.

## Confirm the WhatsApp connection first

In the Meta developer/business setup for your number, check whether you have a WhatsApp Business Account, a **Phone Number ID** and access to WhatsApp API setup/webhook configuration. A visible phone number in the mobile app is not the Phone Number ID. If these are unavailable, finish official Cloud API onboarding before starting the tool; do not remove/re-register your existing mobile number without checking its supported onboarding/coexistence path.

Use the official [Cloud API documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/) and [Meta webhook reference](https://www.postman.com/meta/whatsapp-business-platform/folder/tduohwq/webhook-payload-reference). Never paste app secrets or access tokens into chat.

## Setup

1. Install Node.js 24 LTS or newer. The tool uses `node:sqlite`; its stability depends on the installed Node release.
2. From this folder, run `npm ci --ignore-scripts`. Dependencies are isolated from the website. ExcelJS 4.4.0 writes XLSX files; UUID is overridden to patched 11.1.1. Some transitive packages are deprecated; keep dependency review ongoing. The workbook test exercises the override. CSV was not used because the requirement is an actual Excel workbook with multiple sheets and formatting.
3. Copy `vendors.example.json` to `vendors.json`. Set the business **Phone Number ID** and vendor IDs, names and sending numbers (international digits without `+`). Sender numbers must be unique; display names from incoming messages are not trusted as shop identity. Keep IDs stable. This file is gitignored.
4. Configure these process environment variables securely: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (your chosen webhook verification value), `WHATSAPP_ACCESS_TOKEN` (appropriate media access) and `WHATSAPP_GRAPH_VERSION` (a version supported by your Meta app, such as the exact `vXX.X` shown in its configuration). No `.env` file is read automatically. The app secret, verify token and access token serve different purposes.
5. Start the tool in PowerShell:

   ```powershell
   npm start -- ".\vendors.json" "$env:USERPROFILE\Documents\Gadgify Imports"
   ```

6. Configure a stable HTTPS tunnel/reverse proxy to forward **only** `/webhooks/whatsapp` to `http://127.0.0.1:8787/webhooks/whatsapp`. Tunnel provider/account choice and installation remain owner setup. Do not publish the output folder or expose a Windows file share.
7. Register the HTTPS URL and verify token with Meta and subscribe the business account to incoming messages. The GET challenge is checked; every POST requires the app-secret signature over original bytes. Acknowledgement happens only after local inbox storage succeeds.
8. Send one test product from an allowed vendor, two images and one video. Check the Excel row and the real files before relying on live operation. Keep the PC awake, online and the process running. If it is offline, delivery depends on Meta's retry window; this tool is not an always-on cloud inbox and cannot guarantee capture of old messages.

## Vendor message format

Send one product per text message or initial photo caption:

```text
Product: Cricket bat
Code: BAT-001
Price: 149.50
Description: Junior practice bat
Category: Sports
Brand: Vendor supplied brand
Stock: 12
Sizes: Junior
Colors: Natural
```

Only provide known fields. Price is INR and must be numeric without commas/currency symbols. Stock is a whole number. `SKU:` also works in place of `Code:`. Codes are scoped to the vendor.

For additional photos/videos, either **reply to that product message**, or add `Code: BAT-001` to the media caption. Separate products must have separate codes. Without a code, each explicit `Product:` message becomes a distinct candidate. Repeated delivery of the same WhatsApp message is deduplicated; a new message repeating an existing code is a possible update and goes to review, not a silent overwrite.

This first version does not use AI/OCR, time proximity or photo similarity to infer product details. Free-form messages, conflicting codes/fields, additional field updates, unsupported attachment types and unresolved reply chains are retained for review. Reply resolution is bounded to 32 passes. Historical chat ZIP ingestion and a correction/merge UI from `src/whatsapp-automation.md` are separate follow-up scope; the latest direct-message/local-folder choice governs this tool.

## Output

```text
Gadgify Imports/
  _state/
    inbox.sqlite                 # authoritative local inbox; back this up with its WAL files
    media/                       # original downloaded media, including unassigned items
  Example-Sports-Shop--vendor-001/
    .whatsapp-intake              # identifies this tool's managed export folder
    products.xlsx
    media/
      Cricket-bat--<product-id>/
        Cricket-bat-1.jpg
        Cricket-bat-2.jpg
        Cricket-bat-1.mp4
```

Stable vendor/product IDs prevent collisions between identical names. Image/video numbering is independent. Pending downloads reserve their position within the current product group. Exports are regenerated from the inbox; late grouping can change generated paths. Do not treat those relative paths as immutable public URLs.

The workbook has **Products**, **Needs review**, and **Messages** sheets, filters, frozen headers, wrapped text and numeric prices. Missing fields remain blank; products remain drafts. Media paths are relative to the vendor workbook. Unassigned media is referenced on Needs review. Originals and source message IDs are retained. Incoming text is written as plain strings, never formulas or executable links.

**The workbook is a generated view, not an editing database.** Make a separate copy for manual corrections; editing `products.xlsx` directly will be overwritten on the next export. A local correction/approval UI and ecommerce import are not implemented. Existing unrelated workbooks without the tool's folder marker will not be replaced.

## Recovery and boundaries

- If Excel locks the workbook, export retries without discarding the durable inbox; close Excel to let it finish. A pending workbook is written before replacing the old workbook.
- Downloads use fresh Meta media metadata, a strict HTTPS host allowlist, no redirects, per-request 30-second limits, basic signature/MIME validation and optional provider-hash checking. This is not malware scanning. Only JPEG, PNG, WebP and MP4 are supported (5 MB images / 16 MB videos tool limits).
- Five automatic download attempts use exponential backoff. After correcting credentials/configuration, stop and restart with `--retry-media` appended to the command to reset failed/pending download attempts. No provider write or WhatsApp message is replayed.
- A 256 KB webhook bound, 100 messages per envelope and 50,000-message local inbox cap bound intake. Capacity/disk/database errors return 503 so Meta can retry. Archive/retention tooling is not implemented; monitor disk usage before live operation.
- Protect the local folder with Windows account permissions and disk protection. No automatic deletion is performed. Keep this tool/output outside any public/static website folder. Changing vendor IDs or names after export is not a migration operation; old managed folders are not deleted.
- Run only one instance per output directory. The listener uses loopback port 8787. No service, scheduled task, firewall exception or tunnel is installed by this implementation.
- No live catalog/shop ownership is inferred from a WhatsApp display name. Later catalog import must pass the existing authenticated shop mapping and moderation workflow.

## Verification

Run `npm test` in this folder. Tests use synthetic payloads, an in-memory SQLite inbox, temporary XLSX/media fixtures and fake provider responses. They do not start a listener or contact WhatsApp. Workbook round-trip structure is checked; actual Excel rendering, file-lock behavior, live downloads, tunnel uptime and owner business-number acceptance remain pending.
