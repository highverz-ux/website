export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const googleSheetsUrl = process.env.GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbzHkVm1s28Q8dJEaEnTsoHvxl-nZXE4cVURN92x47KJSTHTJfayTKSNvIR3219HLt9tRA/exec';
  res.status(200).json({ googleSheetsUrl });
}

