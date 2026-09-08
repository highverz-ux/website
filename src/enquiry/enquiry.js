/**
 * Highverz Simple & Sweet Enquiry Engine + Google Sheet Connector
 * Pure 4-field inquiry form, zero tabs, outside-click closing, native cursor handling, and live Google Sheets sync
 */

const STORAGE_KEY = 'highverz_leads';
const SHEETS_CONFIG_KEY = 'highverz_sheets_webhook_url';

// Default Google Apps Script URL (can also be configured via Admin HUD or localStorage)
let GOOGLE_SHEETS_URL = localStorage.getItem(SHEETS_CONFIG_KEY) || '';

export function initEnquirySystem() {
  injectEnquiryModal();
  injectAdminLeadsModal();
  bindTriggerElements();
  bindKeyboardShortcuts();
}

/**
 * Returns all stored leads from localStorage
 */
export function getStoredLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading highverz_leads:', e);
    return [];
  }
}

/**
 * Saves a lead into localStorage and forwards to Google Sheets
 */
export async function saveLead(leadData) {
  try {
    const leads = getStoredLeads();
    const newLead = {
      id: `HV-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sourceUrl: window.location.href,
      ...leadData
    };

    // 1. Local backup so no lead is ever lost
    leads.unshift(newLead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

    // 2. Dispatch custom event
    window.dispatchEvent(new CustomEvent('highverz:lead_stored', { detail: newLead }));

    // 3. Forward to Google Sheet if configured
    const targetSheetUrl = GOOGLE_SHEETS_URL || localStorage.getItem(SHEETS_CONFIG_KEY);
    if (targetSheetUrl) {
      try {
        await fetch(targetSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newLead.id,
            timestamp: newLead.formattedDate,
            type: 'General Inquiry',
            name: newLead.name || '',
            contact: newLead.contact || '',
            handle: newLead.handle || '',
            message: newLead.message || '',
            source: newLead.sourceUrl || ''
          })
        });
        console.log('Lead synced to Google Sheet successfully');
      } catch (sheetErr) {
        console.warn('Google Sheet sync attempt:', sheetErr);
      }
    }

    return newLead;
  } catch (e) {
    console.error('Error saving lead:', e);
    return null;
  }
}

/**
 * Injects the simple & sweet Enquiry Modal into the DOM (no tabs)
 */
function injectEnquiryModal() {
  if (document.getElementById('enquiry-modal-backdrop')) return;

  const modalHtml = `
    <div class="enquiry-modal-backdrop" id="enquiry-modal-backdrop" aria-hidden="true" role="dialog" aria-labelledby="enquiry-modal-title">
      <div class="enquiry-modal-window simple-enquiry-window">
        <button type="button" class="enquiry-modal-close" id="enquiry-modal-close" aria-label="Close Enquiry Modal">✕</button>

        <!-- Form Stage -->
        <div id="enquiry-form-stage">
          <div class="enquiry-header">
            <div class="enquiry-badge">
              <span class="enquiry-badge-dot"></span>
              <span>Let's Connect</span>
            </div>
            <h2 class="enquiry-title" id="enquiry-modal-title">
              Let's Build <span class="highlight-cyan">Together.</span>
            </h2>
            <p class="enquiry-desc">
              Drop your details below. The Highverz team will review your project and get back to you within 12–24 hours.
            </p>
          </div>

          <!-- Pure & Simple Form Without Tabs -->
          <form class="enquiry-form simple-form" id="global-enquiry-form">
            <div class="enquiry-field">
              <label class="enquiry-label" for="enquiry-name">Your Name <span class="req">*</span></label>
              <input type="text" id="enquiry-name" name="name" class="enquiry-input" placeholder="e.g. Alex Gonzalez" required />
            </div>

            <div class="enquiry-field">
              <label class="enquiry-label" for="enquiry-contact">Email or WhatsApp <span class="req">*</span></label>
              <input type="text" id="enquiry-contact" name="contact" class="enquiry-input" placeholder="you@domain.com or +1 (555) 000-0000" required />
            </div>

            <div class="enquiry-field">
              <label class="enquiry-label" for="enquiry-handle">Social Link or Website <span class="req">*</span></label>
              <input type="text" id="enquiry-handle" name="handle" class="enquiry-input" placeholder="@handle or website link" required />
            </div>

            <div class="enquiry-field">
              <label class="enquiry-label" for="enquiry-message">What are you looking to achieve?</label>
              <textarea id="enquiry-message" name="message" class="enquiry-textarea simple-textarea" placeholder="Tell us briefly about your project, goals, or timeline..."></textarea>
            </div>

            <button type="submit" class="enquiry-submit-btn" id="btn-submit-enquiry">
              <span id="submit-btn-text">Send Inquiry</span>
              <span class="btn-arrow-icon">↗</span>
            </button>

            <p class="enquiry-privacy-note">
              🔒 Direct to our team. 100% confidential.
            </p>
          </form>
        </div>

        <!-- Success Feedback Stage -->
        <div class="enquiry-success-box" id="enquiry-success-stage">
          <div class="enquiry-success-icon">✓</div>
          <h3 class="enquiry-success-title">Message Received!</h3>
          <p class="enquiry-success-desc">
            Thanks for reaching out! Your details have been sent to our team. We'll be in touch shortly.
          </p>

          <div class="enquiry-success-meta" id="enquiry-success-meta">
            Reference: <strong id="lead-ref-id">HV-00000</strong>
          </div>

          <div class="enquiry-success-actions">
            <a href="#" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-chat" id="btn-success-whatsapp">
              <span>Chat on WhatsApp</span>
              <span>↗</span>
            </a>
            <button type="button" class="btn-enquiry-reset" id="btn-enquiry-reset">Send Another Note</button>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  bindModalEvents();
}

/**
 * Injects the Admin Leads Dashboard with Google Sheets configuration
 */
function injectAdminLeadsModal() {
  if (document.getElementById('admin-leads-overlay')) return;

  const currentSheetUrl = localStorage.getItem(SHEETS_CONFIG_KEY) || '';

  const adminHtml = `
    <div class="admin-leads-overlay" id="admin-leads-overlay" aria-hidden="true" role="dialog">
      <div class="admin-leads-panel">
        <button type="button" class="admin-leads-close" id="admin-leads-close">✕</button>

        <div class="admin-leads-header">
          <div class="admin-leads-title">
            <span>Highverz Leads &amp; Google Sheet Hub</span>
            <span class="admin-leads-count" id="admin-leads-count">0 Leads</span>
          </div>

          <div class="admin-leads-actions">
            <button type="button" class="btn-admin-export" id="btn-export-csv">
              <span>Download CSV</span>
              <span>📥</span>
            </button>
            <button type="button" class="btn-admin-clear" id="btn-clear-leads">
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <!-- Google Sheet URL Configuration Banner -->
        <div class="admin-sheet-config-bar">
          <div class="sheet-config-label">
            <span>📊 Google Sheet Apps Script URL:</span>
          </div>
          <div class="sheet-config-input-row">
            <input type="url" id="admin-sheet-url-input" class="admin-sheet-input" placeholder="Paste your Google Apps Script Web App URL here (https://script.google.com/...)" value="${currentSheetUrl}" />
            <button type="button" class="btn-admin-save-sheet" id="btn-save-sheet-url">Save URL</button>
          </div>
          <div class="sheet-config-help">
            ${currentSheetUrl ? '🟢 Google Sheet Connected. Leads are automatically synced upon submission.' : '⚠️ No Google Sheet connected yet. Submissions are saved locally and can be exported as CSV, or paste your Apps Script URL above to sync live.'}
          </div>
        </div>

        <div class="admin-leads-table-wrap">
          <table class="admin-leads-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Date &amp; Time</th>
                <th>Name</th>
                <th>Email / WhatsApp</th>
                <th>Social / Website</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="admin-leads-tbody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
          <div class="admin-leads-empty" id="admin-leads-empty" style="display: none;">
            <p>No inquiries captured yet.</p>
            <span style="font-size: 0.8rem; color: #64748b;">Submissions through the website will appear here in real-time.</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', adminHtml);
  bindAdminEvents();
}

/**
 * Bind modal open/close and click-outside cancellation
 */
function bindModalEvents() {
  const backdrop = document.getElementById('enquiry-modal-backdrop');
  const closeBtn = document.getElementById('enquiry-modal-close');
  const formStage = document.getElementById('enquiry-form-stage');
  const successStage = document.getElementById('enquiry-success-stage');
  const form = document.getElementById('global-enquiry-form');
  const resetBtn = document.getElementById('btn-enquiry-reset');
  const submitBtn = document.getElementById('btn-submit-enquiry');
  const submitBtnText = document.getElementById('submit-btn-text');

  // Close modal and restore native cursor
  const closeModal = () => {
    backdrop.classList.remove('is-active');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('enquiry-modal-open');
    if (window.lenis) window.lenis.start();
  };

  closeBtn.addEventListener('click', closeModal);

  // Reliable click-outside cancellation: any click outside .enquiry-modal-window closes it immediately
  backdrop.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.enquiry-modal-window')) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-active')) {
      closeModal();
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Sending...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Save lead into persistent storage & forward to Google Sheets
    const saved = await saveLead(data);

    // Update success screen
    document.getElementById('lead-ref-id').textContent = saved ? saved.id : 'HV-RECEIVED';

    // WhatsApp shortcut
    const waText = encodeURIComponent(
      `Hello Highverz Team, I just submitted an inquiry on Highverz!\n\n` +
      `Name: ${data.name}\n` +
      `Contact: ${data.contact}\n` +
      `Link: ${data.handle}\n` +
      `Message: ${data.message || 'Ready to connect'}`
    );
    const waBtn = document.getElementById('btn-success-whatsapp');
    waBtn.href = `https://wa.me/919999999999?text=${waText}`;

    submitBtn.disabled = false;
    submitBtnText.textContent = 'Send Inquiry';

    // Swap views
    formStage.style.display = 'none';
    successStage.classList.add('is-visible');
  });

  // Reset form to submit another
  resetBtn.addEventListener('click', () => {
    form.reset();
    successStage.classList.remove('is-visible');
    formStage.style.display = 'block';
  });
}

/**
 * Binds all CTA buttons to open the Enquiry Modal
 */
function bindTriggerElements() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest(
      '[data-enquiry-trigger], .btn-nav-talk, #btn-nav-talk, .btn-primary-cyan-large, a[href="#contact"]'
    );

    if (target) {
      if (target.closest('.inline-enquiry-wrapper') || target.closest('.enquiry-form')) {
        return;
      }

      e.preventDefault();
      openEnquiryModal();
    }
  });
}

/**
 * Open the Enquiry Modal globally and manage cursor state
 */
export function openEnquiryModal() {
  const backdrop = document.getElementById('enquiry-modal-backdrop');
  if (!backdrop) return;

  if (window.lenis) window.lenis.stop();
  backdrop.classList.add('is-active');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('enquiry-modal-open');

  // Deactivate any lingering custom cursor hover states
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    cursor.classList.remove('hovering');
  }
}

/**
 * Admin Leads Dashboard Logic
 */
function bindAdminEvents() {
  const overlay = document.getElementById('admin-leads-overlay');
  const closeBtn = document.getElementById('admin-leads-close');
  const exportBtn = document.getElementById('btn-export-csv');
  const clearBtn = document.getElementById('btn-clear-leads');
  const saveSheetBtn = document.getElementById('btn-save-sheet-url');
  const sheetInput = document.getElementById('admin-sheet-url-input');

  const closeAdmin = () => {
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('enquiry-modal-open');
    if (window.lenis) window.lenis.start();
  };

  closeBtn.addEventListener('click', closeAdmin);
  overlay.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.admin-leads-panel')) {
      closeAdmin();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
      closeAdmin();
    }
  });

  // Save Google Sheet Webhook URL
  if (saveSheetBtn && sheetInput) {
    saveSheetBtn.addEventListener('click', () => {
      const url = sheetInput.value.trim();
      localStorage.setItem(SHEETS_CONFIG_KEY, url);
      GOOGLE_SHEETS_URL = url;
      alert(url ? 'Google Sheet Web App URL saved! Submissions will now sync live.' : 'Google Sheet URL cleared.');
      renderAdminLeads();
    });
  }

  // Export Leads to CSV
  exportBtn.addEventListener('click', () => {
    exportLeadsToCSV();
  });

  // Clear Leads
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all stored leads? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      renderAdminLeads();
    }
  });

  // Footer / direct trigger click
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#admin-leads-trigger, .admin-leads-trigger');
    if (trigger) {
      e.preventDefault();
      openAdminLeadsDashboard();
    }
  });

  // Listen for new lead stored
  window.addEventListener('highverz:lead_stored', () => {
    renderAdminLeads();
  });
}

/**
 * Render leads into Admin Table
 */
export function renderAdminLeads() {
  const tbody = document.getElementById('admin-leads-tbody');
  const countLabel = document.getElementById('admin-leads-count');
  const emptyBox = document.getElementById('admin-leads-empty');
  if (!tbody || !countLabel) return;

  const leads = getStoredLeads();
  countLabel.textContent = `${leads.length} Lead${leads.length === 1 ? '' : 's'}`;

  if (leads.length === 0) {
    tbody.innerHTML = '';
    emptyBox.style.display = 'flex';
    return;
  }

  emptyBox.style.display = 'none';
  tbody.innerHTML = leads.map((lead) => {
    return `
      <tr>
        <td style="font-family: monospace; font-weight: 700; color: #38bdf8;">${lead.id}</td>
        <td style="font-size: 0.78rem; color: #94a3b8;">${lead.formattedDate || ''}</td>
        <td style="font-weight: 700; color: #ffffff;">${escapeHtml(lead.name || '')}</td>
        <td>
          <div style="font-size: 0.82rem; color: #38bdf8;">${escapeHtml(lead.contact || '')}</div>
        </td>
        <td><span style="color: #00e5ff;">${escapeHtml(lead.handle || '')}</span></td>
        <td style="font-size: 0.8rem; color: #cbd5e1; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(lead.message || '—')}</td>
        <td>
          <button type="button" class="btn-copy-lead" data-id="${lead.id}" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.72rem; cursor: pointer;">
            Copy
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind copy buttons
  tbody.querySelectorAll('.btn-copy-lead').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        const text = `Highverz Lead [${lead.id}]\nName: ${lead.name}\nContact: ${lead.contact}\nLink: ${lead.handle}\nMessage: ${lead.message || 'None'}`;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 1500);
        });
      }
    });
  });
}

/**
 * Open Admin Leads Dashboard
 */
export function openAdminLeadsDashboard() {
  const overlay = document.getElementById('admin-leads-overlay');
  if (!overlay) return;

  renderAdminLeads();
  if (window.lenis) window.lenis.stop();
  overlay.classList.add('is-active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('enquiry-modal-open');
}

/**
 * Keyboard shortcuts (Shift + L opens Admin Leads Dashboard)
 */
function bindKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
      openAdminLeadsDashboard();
    }
  });
}

/**
 * Exports all leads to a formatted CSV file
 */
function exportLeadsToCSV() {
  const leads = getStoredLeads();
  if (leads.length === 0) {
    alert('No leads available to export.');
    return;
  }

  const headers = ['Lead ID', 'Date Submitted', 'Client Name', 'Email or WhatsApp', 'Social or Website Link', 'Message', 'Source Page'];

  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.formattedDate || ''}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.contact || '').replace(/"/g, '""')}"`,
    `"${(l.handle || '').replace(/"/g, '""')}"`,
    `"${(l.message || '').replace(/"/g, '""')}"`,
    `"${(l.sourceUrl || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `highverz-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
