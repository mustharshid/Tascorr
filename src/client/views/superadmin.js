// superadmin.js - Global platform Superadmin console.
// Enforces separate superadmin console specifications (Section 8) and global logs (NNR-7).

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';

let tenants = [];
let logs = [];

export function renderSuperadminView() {
  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">Superadmin Console</h1>
        <p class="body-text">Manage tenant subscriptions, platform configurations, and global security audit trails.</p>
      </div>

      <!-- Unauthorized banner (fallback boundary safeguard check) -->
      <div id="superadmin-unauthorized" style="display: none; padding: 32px; text-align: center; background-color: rgba(220, 38, 38, 0.05); border: 1px dashed var(--status-danger); border-radius: var(--radius-lg);">
        <strong style="color: var(--status-danger); font-size: 16px;">Access Denied</strong>
        <p class="body-text" style="margin-top: 8px;">Global Superadmin authorization context is required to view these administrative endpoints.</p>
      </div>

      <!-- Content Grid -->
      <div id="superadmin-content" style="display: flex; flex-direction: column; gap: 32px;">
        <!-- Top: Tenant Provisioning Drawer Card -->
        <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
          <h3 class="card-title">Onboard New Organization Tenant</h3>
          <div id="tenant-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="onboard-tenant-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 800px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-name" class="small-text" style="font-weight: 600;">Organization Name</label>
              <input type="text" id="tenant-name" required placeholder="Acme International" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-tier" class="small-text" style="font-weight: 600;">Subscription Level Tier</label>
              <select id="tenant-tier" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="1">Tier 1 (Startup: 10 user cap)</option>
                <option value="2">Tier 2 (Growth: 100 user cap)</option>
                <option value="3">Tier 3 (Enterprise: Unlimited)</option>
              </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-email" class="small-text" style="font-weight: 600;">Admin User Email</label>
              <input type="email" id="tenant-email" required placeholder="admin@acme.com" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="tenant-password" class="small-text" style="font-weight: 600;">Admin User Password</label>
              <input type="password" id="tenant-password" required placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="grid-column: span 2; margin-top: 8px;">
              <button type="submit" class="menu-item active" style="padding: 10px 20px; border:none; font-weight:600; width:fit-content;">Onboard Organization</button>
            </div>
          </form>
        </div>

        <!-- Bottom: Platform Audit Logs and Tenants list -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
          <!-- Global Audit Trails -->
          <div class="widget-card" style="display: flex; flex-direction: column; gap: 16px;">
            <h3 class="card-title">Global Audit & Session Logs</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                    <th style="padding: 12px; font-weight:600;">Timestamp</th>
                    <th style="padding: 12px; font-weight:600;">Actor</th>
                    <th style="padding: 12px; font-weight:600;">Action Type</th>
                    <th style="padding: 12px; font-weight:600;">Metadata Parameters</th>
                  </tr>
                </thead>
                <tbody id="global-audit-body">
                  <tr>
                    <td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No platform logs retrieved yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hook superadmin events and fetch audits
 */
export async function initSuperadminListeners() {
  const unauthorizedEl = document.getElementById('superadmin-unauthorized');
  const contentEl = document.getElementById('superadmin-content');
  if (!contentEl) return;

  // Verify rank boundary is superadmin (tenantId 0 or user email match)
  const isSuper = AuthState.isSuperadmin();
  
  if (!isSuper) {
    unauthorizedEl.style.display = 'block';
    contentEl.style.display = 'none';
    return;
  }

  unauthorizedEl.style.display = 'none';
  contentEl.style.display = 'flex';

  await loadAuditLogs();

  // Tenant onboarding form
  const form = document.getElementById('onboard-tenant-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('tenant-name').value.trim();
    const email = document.getElementById('tenant-email').value.trim();
    const password = document.getElementById('tenant-password').value;
    const tier = Number(document.getElementById('tenant-tier').value);

    const errorAlert = document.getElementById('tenant-error-alert');
    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.innerText = '';
    }

    // Passwords complexity validation (mixed case, numbers, symbols, 12+ characters)
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      showError('Administrator password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.');
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Organization Workspace...';
      }

      await fetchApi('POST', '/superadmin/tenants', {
        name,
        adminEmail: email,
        adminPassword: password,
        subscriptionTier: tier
      });

      Notifications.success('Tenant Created', 'Company registered and admin account provisioned successfully.');
      form.reset();
      await loadAuditLogs();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Onboarding organization failed.');
      Notifications.error('Onboarding Failed', err.message);
    } finally {
      const submitBtn = form?.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Onboard Organization';
      }
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.innerText = msg;
      errorAlert.style.display = 'block';
    }
  }
}

/**
 * Load platform-level log history
 */
async function loadAuditLogs() {
  const tbody = document.getElementById('global-audit-body');
  if (!tbody) return;

  try {
    const data = await fetchApi('GET', '/superadmin/audit-logs');
    logs = data.logs || [];

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No action history logged on the platform yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; color: var(--text-secondary); font-size:12px;">${new Date(l.createdAt).toLocaleString()}</td>
        <td style="padding: 12px; font-weight:600;">${l.actor?.email || 'System'}</td>
        <td style="padding: 12px;"><span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${l.action}</span></td>
        <td style="padding: 12px; font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.metadata}">${l.metadata || '{}'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--status-danger);">Failed to load platform log: ${err.message}</td></tr>`;
  }
}
