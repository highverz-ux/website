import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(cors());
app.use(express.json());

// Helper function to read config
const readConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading config:', err);
  }
  return { googleSheetsUrl: '' };
};

// Helper function to write config
const writeConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Error writing config:', err);
  }
};

const LEADS_FILE = path.join(__dirname, 'leads.json');

// Helper to read leads
const readLeads = () => {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading leads.json:', err);
  }
  return [];
};

// Helper to save leads
const saveLeadLocally = (lead) => {
  try {
    const leads = readLeads();
    leads.unshift({ ...lead, receivedAt: new Date().toISOString() });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('Error saving lead locally:', err);
  }
};

// GET /api/config - Retrieve current configuration
app.get('/api/config', (req, res) => {
  const config = readConfig();
  res.json(config);
});

// POST /api/config - Save configuration (like Google Sheets URL)
app.post('/api/config', (req, res) => {
  const { googleSheetsUrl } = req.body;
  
  if (googleSheetsUrl !== undefined) {
    const config = readConfig();
    config.googleSheetsUrl = googleSheetsUrl.trim();
    writeConfig(config);
    console.log(`[Config] Google Sheets Webhook URL updated: ${config.googleSheetsUrl}`);
    return res.json({ success: true, config });
  }
  
  res.status(400).json({ error: 'googleSheetsUrl is required' });
});

// GET /api/leads - View all leads stored locally
app.get('/api/leads', (req, res) => {
  res.json({ leads: readLeads() });
});

// POST /api/enquiry - Forward form submission to Google Sheet & backup locally
app.post('/api/enquiry', async (req, res) => {
  const payload = req.body || {};
  console.log(`[Enquiry] New submission received:`, {
    name: payload.name,
    contact: payload.contact,
    handle: payload.handle
  });

  // 1. Always back up lead locally so data is never lost
  saveLeadLocally(payload);

  const config = readConfig();
  const googleSheetsUrl = (payload.googleSheetsUrl && payload.googleSheetsUrl.trim()) ||
    config.googleSheetsUrl ||
    process.env.GOOGLE_SHEETS_URL ||
    'https://script.google.com/macros/s/AKfycbzHkVm1s28Q8dJEaEnTsoHvxl-nZXE4cVURN92x47KJSTHTJfayTKSNvIR3219HLt9tRA/exec';

  if (!googleSheetsUrl || googleSheetsUrl.includes('testing/exec')) {
    console.warn('[Enquiry] Google Sheets URL is not set or using placeholder.');
    return res.json({
      success: true,
      backedUpLocally: true,
      sheetSynced: false,
      message: 'Lead saved locally. Provide real Google Sheets URL to sync automatically.'
    });
  }

  try {
    // Forward payload to Google Sheets Web App
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const responseText = await response.text();
    console.log(`[Google Sheets] Status: ${response.status} | Response:`, responseText.substring(0, 150));

    res.json({
      success: true,
      backedUpLocally: true,
      sheetSynced: response.ok,
      status: response.status
    });
  } catch (error) {
    console.error('[Google Sheets Error] Failed to forward:', error.message);
    // Still return success: true because lead was saved locally
    res.json({
      success: true,
      backedUpLocally: true,
      sheetSynced: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
