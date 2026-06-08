// settings.js - Settings and corporate configurations tab-based view.
// Conforms to Section 5 settings and Section 6.5 width standards.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';

export function renderSettingsView() {
  const isAdmin = AuthState.isAdmin();

  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="body-text">Configure personal preferences, display themes, and corporate policies.</p>
      </div>

      <!-- Settings Grid with Tabs -->
      <div class="settings-grid" style="display: flex; gap: 32px; align-items: flex-start;">
        <!-- Left Side: Tab Buttons -->
        <div class="settings-sidebar widget-card" style="width: 240px; padding: 12px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
          <button class="settings-tab-btn active" data-tab="tab-profile" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 600; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; gap: 8px;">
            User Profile
          </button>
          <button class="settings-tab-btn" data-tab="tab-display" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            Display Settings
          </button>
          ${isAdmin ? `
            <button class="settings-tab-btn" data-tab="tab-org" style="text-align: left; padding: 10px 16px; background: none; border: none; border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              Company & Policies
            </button>
          ` : ''}
        </div>

        <!-- Right Side: Content Panes -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 24px;">
          <!-- Tab 1: Profile Form -->
          <div id="tab-profile" class="settings-pane widget-card" style="display: flex; flex-direction: column; gap: 20px;">
            <h3 class="card-title">User Account Details</h3>
            <form id="profile-update-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label class="small-text" style="font-weight:600;">Email Address</label>
                <input type="email" id="profile-email" disabled style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-tertiary);" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">First Name</label>
                  <input type="text" id="profile-first" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Last Name</label>
                  <input type="text" id="profile-last" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                </div>
              </div>
              <button type="submit" class="menu-item active" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Profile Details</button>
            </form>
          </div>

          <!-- Tab 2: Display theme toggle -->
          <div id="tab-display" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
            <h3 class="card-title">Theme Preferences</h3>
            <p class="body-text">Tascorr natively adapts color schemes to optimize contrast boundaries across interfaces.</p>
            
            <div style="display: flex; align-items: center; justify-content: space-between; max-width: 500px; padding: 12px 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
              <div>
                <strong class="data-number">Dark Color Scheme</strong>
                <p class="small-text">Render deep charcoal layouts (Section 3.4)</p>
              </div>
              <button id="settings-theme-toggle" style="padding: 8px 16px; background-color: var(--accent-navy-primary); color: #fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer;">
                Toggle Mode
              </button>
            </div>
          </div>

          <!-- Tab 3: Organization Policies (Admin only) -->
          ${isAdmin ? `
            <div id="tab-org" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
              <h3 class="card-title">Company Account Details</h3>
              <form id="company-update-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Company / Tenant Name</label>
                  <input type="text" id="company-name" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Subscription Tier</label>
                  <input type="text" id="company-tier" disabled style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-tertiary);" />
                </div>
                <button type="submit" class="menu-item active" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Company Details</button>
              </form>

              <hr style="border: 0; border-top: 1px solid var(--border-neutral); margin: 8px 0;" />

              <h3 class="card-title">Corporate Approval Rules</h3>
              <div style="display: flex; align-items: center; justify-content: space-between; max-width: 500px; padding: 12px 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                <div>
                  <strong class="data-number">Enterprise Approval Mode</strong>
                  <p class="small-text">Enforces sequential rank-based approvals for cross-department resource changes.</p>
                </div>
                <label style="position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer;">
                  <input type="checkbox" id="approval-mode-chk" style="opacity: 0; width: 0; height: 0;" />
                  <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-neutral); border-radius: 24px; transition: 0.2s;" class="slider"></span>
                </label>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Hook settings tab toggling and forms saving
 */
export function initSettingsListeners() {
  const tabs = document.querySelectorAll('.settings-tab-btn');
  const panes = document.querySelectorAll('.settings-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Manage active classes
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-secondary)';
        t.style.fontWeight = '500';
      });
      tab.classList.add('active');
      tab.style.color = 'var(--accent-navy-primary)';
      tab.style.fontWeight = '600';

      // Switch views
      const target = tab.dataset.tab;
      panes.forEach(p => {
        p.style.display = p.id === target ? 'flex' : 'none';
      });
    });
  });

  // Populate fields
  const firstInput = document.getElementById('profile-first');
  const lastInput = document.getElementById('profile-last');
  const emailInput = document.getElementById('profile-email');

  if (AuthState.currentUser) {
    if (firstInput) firstInput.value = AuthState.currentUser.firstName || '';
    if (lastInput) lastInput.value = AuthState.currentUser.lastName || '';
    if (emailInput) emailInput.value = AuthState.currentUser.email || '';
  }

  // Profile submission form
  document.getElementById('profile-update-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const first = firstInput.value.trim();
    const last = lastInput.value.trim();

    if (!first || !last) {
      Notifications.error('Validation Error', 'First name and Last name are required.');
      return;
    }

    try {
      const response = await fetchApi('PATCH', `/users/${AuthState.currentUser.id}`, {
        firstName: first,
        lastName: last
      });

      // Update AuthState.currentUser
      AuthState.currentUser.firstName = response.user.firstName;
      AuthState.currentUser.lastName = response.user.lastName;
      localStorage.setItem('tascorr_user', JSON.stringify(AuthState.currentUser));
      
      // Update header username
      const userBadgeName = document.getElementById('header-user-role');
      if (userBadgeName) {
        userBadgeName.innerText = `${AuthState.currentUser.tenantName || `${AuthState.currentUser.firstName} ${AuthState.currentUser.lastName}`} (${AuthState.currentUser.rankTitle})`;
      }

      Notifications.success('Profile Saved', 'Account credentials updated successfully.');
    } catch (err) {
      Notifications.error('Save Failed', err.message || 'An error occurred while saving profile.');
    }
  });

  // Company submission form
  if (AuthState.isAdmin()) {
    fetchApi('GET', '/users/tenant/details')
      .then(data => {
        if (data && data.tenant) {
          const compNameInput = document.getElementById('company-name');
          const compTierInput = document.getElementById('company-tier');
          if (compNameInput) compNameInput.value = data.tenant.name || '';
          if (compTierInput) compTierInput.value = `Tier ${data.tenant.subscriptionTier} Startup (Active)`;
        }
      })
      .catch(err => console.error('Failed to load company details', err));

    document.getElementById('company-update-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const compNameInput = document.getElementById('company-name');
      const name = compNameInput.value.trim();
      if (!name) {
        Notifications.error('Validation Error', 'Company name is required.');
        return;
      }
      try {
        const res = await fetchApi('PATCH', '/users/tenant/details', { name });
        // Update user session cache
        if (AuthState.currentUser) {
          AuthState.currentUser.tenantName = res.tenant.name;
          localStorage.setItem('tascorr_user', JSON.stringify(AuthState.currentUser));
          
          // Trigger breadcrumbs and header update
          const userBadgeName = document.getElementById('header-user-role');
          if (userBadgeName) {
            userBadgeName.innerText = `${res.tenant.name} (${AuthState.currentUser.rankTitle})`;
          }
          const breadcrumbs = document.getElementById('breadcrumbs');
          if (breadcrumbs) {
            breadcrumbs.innerHTML = `
              <span class="body-text" style="font-weight: 500;">${res.tenant.name}</span>
              <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
              <span class="body-text" style="font-weight: 600; color: var(--text-primary);">Settings</span>
            `;
          }
        }
        Notifications.success('Company Saved', 'Company details updated successfully.');
      } catch (err) {
        Notifications.error('Save Failed', err.message || 'An error occurred.');
      }
    });
  }

  // Inner display toggle hooks
  document.getElementById('settings-theme-toggle')?.addEventListener('click', () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', targetTheme);
    Notifications.info('Theme Toggle', `Interface switched to ${targetTheme} environment schema.`);
  });
}
