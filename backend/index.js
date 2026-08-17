require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 500;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.get('/', (req, res) => res.send('CloudVandana CRUD Backend is running'));

// ---- OAuth: login (PKCE) ----
app.get('/auth/login', (req, res) => {
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');

  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  const authUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?` +
    `response_type=code&client_id=${process.env.SF_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.SF_CALLBACK_URL)}` +
    `&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

  res.redirect(authUrl);
});

// ---- OAuth: callback ----
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (state !== req.session.state) return res.status(403).send('Invalid state');

  try {
    const tokenRes = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
        redirect_uri: process.env.SF_CALLBACK_URL,
        code_verifier: req.session.codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    req.session.salesforce = {
      accessToken: tokenRes.data.access_token,
      instanceUrl: tokenRes.data.instance_url
    };

    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth callback failed');
  }
});

app.get('/api/status', (req, res) => {
  res.json({ loggedIn: !!req.session.salesforce });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ---- Field config per object (5–10 fields each) ----
const FIELDS = {
  Account: ['Id', 'Name', 'Industry', 'Phone', 'Website', 'BillingCity'],
  Opportunity: ['Id', 'Name', 'StageName', 'Amount', 'CloseDate', 'Probability'],
  Lead: ['Id', 'Name', 'Company', 'Status', 'Email', 'Phone'],
  Contact: ['Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Title'],
  Case: ['Id', 'Subject', 'Status', 'Priority', 'Origin', 'Description']
};

function sfAuth(req) {
  return req.session.salesforce;
}

// ---- READ (paginated, 20 at a time) ----
app.get('/api/:object', async (req, res) => {
  const auth = sfAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });

  const { object } = req.params;
  const offset = parseInt(req.query.offset || '0', 10);
  const fields = FIELDS[object];
  if (!fields) return res.status(400).json({ error: 'Unknown object' });

  const soql = `SELECT ${fields.join(',')} FROM ${object} ORDER BY Id LIMIT 20 OFFSET ${offset}`;
  try {
    const result = await axios.get(
      `${auth.instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(soql)}`,
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );
    res.json(result.data.records);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- CREATE ----
app.post('/api/:object', async (req, res) => {
  const auth = sfAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const result = await axios.post(
      `${auth.instanceUrl}/services/data/v60.0/sobjects/${req.params.object}`,
      req.body,
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- UPDATE ----
app.patch('/api/:object/:id', async (req, res) => {
  const auth = sfAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await axios.patch(
      `${auth.instanceUrl}/services/data/v60.0/sobjects/${req.params.object}/${req.params.id}`,
      req.body,
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// ---- DELETE ----
app.delete('/api/:object/:id', async (req, res) => {
  const auth = sfAuth(req);
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await axios.delete(
      `${auth.instanceUrl}/services/data/v60.0/sobjects/${req.params.object}/${req.params.id}`,
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`CloudVandana backend running at http://localhost:${PORT}`));