import dotenv from 'dotenv';

dotenv.config();

export const config = {
  serverPort: process.env.SERVER_PORT || 8060,

  // Database (required)
  databaseUrl: process.env.DATABASE_URL || '',

  // OIDC — works with Azure AD, Authentik, or any OIDC-compliant IdP
  oidcIssuerUrl: process.env.OIDC_ISSUER_URL || '',
  oidcClientId: process.env.OIDC_CLIENT_ID || '',
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET || '',
  // Set to 'true' to skip token verification in local dev (no IdP required)
  oidcDisabled: process.env.OIDC_DISABLED === 'true',

  // SMTP relay (optional) — "the ticket talks to humans". Point at internal
  // Postfix or any provider. Mail features are disabled until host is set.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true = implicit TLS (465)
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'materialticket@localhost',
  },

  // Tactical RMM (optional) — enables device sync + running scripts on devices.
  // apiUrl is the API base of your Tactical instance, e.g. https://api.rmm.example.com
  trmm: {
    apiUrl: (process.env.TRMM_API_URL || '').replace(/\/$/, ''),
    apiKey: process.env.TRMM_API_KEY || '',
  },

  // ConnectWise Manage (optional — only needed if CW sync is configured)
  cwm: {
    company: process.env.CWM_COMPANY || '',
    server: process.env.CWM_SERVER || '',
    publicKey: process.env.CWM_PUBKEY || '',
    privateKey: process.env.CWM_PRIVATEKEY || '',
    clientId: process.env.CWM_CLIENTID || '',
  },
};
