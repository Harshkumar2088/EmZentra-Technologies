# EmZentra Full-Stack Website

Professional responsive EmZentra company website with an Express.js backend and working contact API.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the ZIP.
2. Open a terminal in the extracted `emzentra-fullstack` folder.
3. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

4. Copy the root `.env.example` file to `.env` in the project root, if you want to configure email delivery. SMTP settings are optional.
5. Start the website from the `backend` folder:

   ```bash
   npm start
   ```

6. Open http://localhost:3000

The frontend is served by the backend. The health check is at http://localhost:3000/api/health.

## Contact form behaviour
- Validates name, email and message on the server.
- Rate-limits repeated contact submissions.
- Saves submissions to `backend/data/enquiries.json` when SMTP is not configured.
- If valid SMTP settings are configured in the root `.env`, it also emails the enquiry to `CONTACT_TO`.
- Keep `.env` private and never commit real SMTP credentials.
- For production use, prefer a database and durable hosting storage rather than a local JSON file.

## SMTP setup
Copy `.env.example` to `.env` in the project root and update `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`, and `CONTACT_FROM`. Restart the server after changing environment variables. Use credentials from your mail provider; do not put email passwords in frontend code.

## Project structure
- `frontend/public/index.html` — complete responsive frontend, styling and browser JavaScript
- `frontend/public/assets/emzentra-logo.png` — supplied logo
- `backend/server.js` — Express server, contact endpoint, validation, rate limiting, optional email delivery
- `backend/data/` — local enquiry storage created when first message arrives
- `package.json` — root scripts
- `.env.example` — environment variable template

## Before going live
- Replace placeholder email/address text in the contact section with official details.
- Configure SMTP or a production email provider.
- Configure HTTPS and durable storage.
- Add privacy policy/terms and review applicable privacy requirements.
- The website content is a professional draft based on the company service description; verify claims before publication.


## Expanded company services
The frontend includes software implementation and testing, technology advisory, IT project management, troubleshooting, IT-enabled services, and domestic/international collaboration enquiries. Review company contact details before publishing.
