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
              <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Profile Details</button>
            </form>
          </div>

          <!-- Tab 2: Display theme selection -->
          <div id="tab-display" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
            <h3 class="card-title">Theme Preferences</h3>
            <p class="body-text">Tascorr natively adapts color schemes to optimize contrast boundaries across interfaces. Select a theme below to instantly apply it.</p>
            
            <div id="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; margin-top: 8px;">
              <!-- Themes injected by JS -->
            </div>
          </div>

          <!-- Tab 3: Organization Policies (Admin only) -->
          ${isAdmin ? `
            <div id="tab-org" class="settings-pane widget-card" style="display: none; flex-direction: column; gap: 20px;">
              <h3 class="card-title">Company Account Details</h3>
              <form id="company-update-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <div style="display: flex; gap: 16px; align-items: flex-end;">
                  <!-- Logo Upload -->
                  <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0; background-color: var(--bg-tertiary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                    <img id="company-logo-img" style="width: 100%; height: 100%; object-fit: contain; border-radius: var(--radius-md); display: none;" />
                    <span id="company-logo-fallback" style="font-weight: 700; color: var(--text-secondary); font-size: 24px;">?</span>
                    <label id="upload-logo-btn" style="position: absolute; bottom: -8px; right: -8px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Upload Logo">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 12px; height: 12px; color: var(--text-secondary);">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <input type="file" id="logo-upload-input" accept="image/*" style="display: none;" />
                    </label>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                    <label class="small-text" style="font-weight:600;">Company / Tenant Name</label>
                    <input type="text" id="company-name" required style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                  <input type="checkbox" id="company-cross-dept-peer" style="width: 16px; height: 16px; cursor: pointer;" />
                  <label for="company-cross-dept-peer" class="small-text" style="font-weight: 500; cursor: pointer; display: flex; align-items: center;">
                    Allow cross-department peer task assignment
                    <div class="tooltip-container">
                      <span class="help-icon">?</span>
                      <span class="tooltip-text">If enabled, employees can assign tasks to peers outside their own department.</span>
                    </div>
                  </label>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label for="company-sla-access" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                    SLA Analytics Access Level
                    <div class="tooltip-container">
                      <span class="help-icon">?</span>
                      <span class="tooltip-text">Minimum rank level required to view the SLA Analytics page (lower numbers mean higher authority).</span>
                    </div>
                  </label>
                  <select id="company-sla-access" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary);">
                    <option value="0">Level 0 (Root Admin Only)</option>
                    <option value="1">Level 1 and above</option>
                    <option value="2">Level 2 and above</option>
                    <option value="3">Level 3 and above</option>
                    <option value="4">Level 4 and above</option>
                    <option value="5">Level 5 and above</option>
                    <option value="6">Level 6 and above (Everyone)</option>
                  </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Subscription Tier</label>
                  <input type="text" id="company-tier" disabled style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-tertiary);" />
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Company Details</button>
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

              <hr style="border: 0; border-top: 1px solid var(--border-neutral); margin: 8px 0;" />

              <h3 class="card-title">Global Support Access Consent</h3>
              <p class="body-text">Grant the platform superadmin temporary access to review organization audit trails or perform password resets for technical troubleshooting. This permission will automatically expire.</p>
              <div style="display: flex; gap: 16px; align-items: center; max-width: 500px; padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                <div style="flex: 1;">
                  <strong id="support-status-label" style="font-size: 14px; font-weight: 600;">Status: Access Revoked</strong>
                  <p id="support-expiry-label" class="small-text" style="margin-top: 4px;">No active support grant</p>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <select id="support-duration-select" style="padding: 8px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-tertiary); color: var(--text-primary); font-size: 13px;">
                    <option value="1">1 Hour</option>
                    <option value="4">4 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                  <button id="grant-support-btn" class="btn btn-primary" style="padding: 8px 12px; font-size: 13px;">Grant</button>
                  <button id="revoke-support-btn" class="btn btn-ghost" style="padding: 8px 12px; font-size: 13px; display: none;">Revoke</button>
                </div>
              </div>

              <hr style="border: 0; border-top: 1px solid var(--border-neutral); margin: 8px 0;" />

              <h3 class="card-title">Hierarchy Settings</h3>
              <form id="top-rank-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 500px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <label class="small-text" style="font-weight:600;">Top Level Executive Title</label>
                  <input type="text" id="top-rank-title" required placeholder="e.g. CEO, Chairman, President" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); color: var(--text-primary);" />
                  <p class="small-text" style="color: var(--text-secondary); margin-top: 4px;">This title appears at the root of the organization chart. This position can assign tasks to anyone in the company.</p>
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 10px 16px; border:none; font-weight:600; width: fit-content;">Save Hierarchy Setup</button>
              </form>
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
          const crossDeptInput = document.getElementById('company-cross-dept-peer');
          const slaAccessInput = document.getElementById('company-sla-access');
          const logoImg = document.getElementById('company-logo-img');
          const logoFallback = document.getElementById('company-logo-fallback');
          
          if (compNameInput) compNameInput.value = data.tenant.name || '';
          if (crossDeptInput) crossDeptInput.checked = data.tenant.allowCrossDeptPeerAssignment !== false;
          if (slaAccessInput) slaAccessInput.value = data.tenant.slaAccessLevel ?? 3;
          if (compTierInput) compTierInput.value = `Tier ${data.tenant.subscriptionTier} Startup (Active)`;

          if (logoImg && logoFallback) {
            logoImg.src = `/avatars/tenant-${data.tenant.id}.jpg?t=${Date.now()}`;
            logoImg.onload = () => {
              logoImg.style.display = 'block';
              logoFallback.style.display = 'none';
            };
            logoImg.onerror = () => {
              logoImg.style.display = 'none';
              logoFallback.style.display = 'block';
              logoFallback.innerText = data.tenant.name?.[0] || '?';
            };
          }

          // Render Support Access Status
          renderSupportStatus(data.tenant.supportAccessGrantedUntil);
        }
      })
      .catch(err => console.error('Failed to load company details', err));

    function renderSupportStatus(grantedUntil) {
      const statusLabel = document.getElementById('support-status-label');
      const expiryLabel = document.getElementById('support-expiry-label');
      const grantBtn = document.getElementById('grant-support-btn');
      const revokeBtn = document.getElementById('revoke-support-btn');

      if (!statusLabel || !expiryLabel) return;

      const now = new Date();
      if (grantedUntil && new Date(grantedUntil) > now) {
        const expiryDate = new Date(grantedUntil);
        statusLabel.innerText = 'Status: Support Access Active';
        statusLabel.style.color = '#10B981'; // var(--status-success) equivalent
        expiryLabel.innerText = `Active until: ${expiryDate.toLocaleString()}`;
        if (grantBtn) grantBtn.style.display = 'none';
        if (revokeBtn) revokeBtn.style.display = 'block';
      } else {
        statusLabel.innerText = 'Status: Access Revoked';
        statusLabel.style.color = '#EF4444'; // var(--status-danger) equivalent
        expiryLabel.innerText = 'No active support grant';
        if (grantBtn) grantBtn.style.display = 'block';
        if (revokeBtn) revokeBtn.style.display = 'none';
      }
    }

    fetchApi('GET', '/users/ranks')
      .then(ranksRes => {
        const ranks = ranksRes.ranks || [];
        const topRank = ranks.find(r => r.level === 1);
        if (topRank && document.getElementById('top-rank-title')) {
          document.getElementById('top-rank-title').value = topRank.title;
          document.getElementById('top-rank-title').dataset.id = topRank.id;
        }
      })
      .catch(err => console.error('Failed to load ranks', err));

    document.getElementById('company-update-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const compNameInput = document.getElementById('company-name');
      const crossDeptInput = document.getElementById('company-cross-dept-peer');
      const slaAccessInput = document.getElementById('company-sla-access');
      const name = compNameInput.value.trim();
      const allowCrossDeptPeerAssignment = crossDeptInput ? crossDeptInput.checked : true;
      const slaAccessLevel = slaAccessInput ? Number(slaAccessInput.value) : 3;
      if (!name) {
        Notifications.error('Validation Error', 'Company name is required.');
        return;
      }
      try {
        const res = await fetchApi('PATCH', '/users/tenant/details', { name, allowCrossDeptPeerAssignment, slaAccessLevel });
        // Update user session cache
        if (AuthState.currentUser) {
          AuthState.currentUser.tenantName = res.tenant.name;
          AuthState.currentUser.tenant = res.tenant; // Update tenant details for access control checks
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

    document.getElementById('top-rank-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('top-rank-title');
      const rankId = titleInput?.dataset.id;
      const title = titleInput?.value;

      if (!rankId) {
        Notifications.error('Update Failed', 'Top level rank could not be identified.');
        return;
      }

      try {
        await fetchApi('PATCH', `/users/ranks/${rankId}`, { title });
        Notifications.success('Hierarchy Saved', 'Top level executive title updated successfully.');
      } catch (err) {
        Notifications.error('Update Failed', err.message || 'Could not update hierarchy.');
      }
    });

    const uploadBtn = document.getElementById('upload-logo-btn');
    const uploadInput = document.getElementById('logo-upload-input');
    
    uploadInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          if (uploadBtn) uploadBtn.style.opacity = '0.5';
          const res = await fetchApi('POST', '/upload/tenant-logo', {
            imageBase64: base64String
          });
          Notifications.success('Logo Updated', 'Company logo uploaded successfully.');
          
          const logoImg = document.getElementById('company-logo-img');
          const logoFallback = document.getElementById('company-logo-fallback');
          if (logoImg) {
            logoImg.src = res.logoUrl;
            logoImg.style.display = 'block';
          }
          if (logoFallback) logoFallback.style.display = 'none';
          
          // Optionally update the logo in the header dynamically
          const headerLogoImg = document.getElementById('header-company-logo-img');
          const headerLogoContainer = document.getElementById('header-company-logo-container');
          if (headerLogoImg && headerLogoContainer) {
            headerLogoImg.src = res.logoUrl;
            headerLogoContainer.style.display = 'flex';
          }
          
        } catch (err) {
          console.error(err);
          Notifications.error('Upload Failed', err.message);
        } finally {
          if (uploadBtn) uploadBtn.style.opacity = '1';
        }
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('grant-support-btn')?.addEventListener('click', async () => {
      const hoursSelect = document.getElementById('support-duration-select');
      const hours = hoursSelect ? Number(hoursSelect.value) : 1;
      try {
        const res = await fetchApi('POST', '/users/tenant/support-access', { hours });
        renderSupportStatus(res.tenant.supportAccessGrantedUntil);
        Notifications.success('Access Granted', res.message);
      } catch (err) {
        Notifications.error('Grant Failed', err.message || 'Could not grant support access.');
      }
    });

    document.getElementById('revoke-support-btn')?.addEventListener('click', async () => {
      try {
        const res = await fetchApi('POST', '/users/tenant/support-access', { hours: 0 });
        renderSupportStatus(null);
        Notifications.success('Access Revoked', res.message);
      } catch (err) {
        Notifications.error('Revocation Failed', err.message || 'Could not revoke support access.');
      }
    });
  }

  // Inner display toggle hooks
  const themes = [
    { id: 'light', name: 'Light', color: '#EAEFF8', sidebar: 'rgba(226, 232, 240, 0.9)' },
    { id: 'dark', name: 'Dark', color: '#0b0b0f', sidebar: 'rgba(15, 15, 20, 0.9)' },
    { id: 'corporate', name: 'Corporate', color: '#F8FAFC', sidebar: 'rgba(203, 213, 225, 0.9)' },
    { id: 'ocean', name: 'Ocean', color: '#F0F9FF', sidebar: 'rgba(125, 211, 252, 0.9)' },
    { id: 'forest', name: 'Forest', color: '#F0FDF4', sidebar: 'rgba(134, 239, 172, 0.9)' },
    { id: 'sunset', name: 'Sunset', color: '#FFF7ED', sidebar: 'rgba(253, 186, 116, 0.9)' },
    { id: 'lavender', name: 'Lavender', color: '#FAF5FF', sidebar: 'rgba(216, 180, 254, 0.9)' },
    { id: 'midnight', name: 'Midnight', color: '#05050A', sidebar: 'rgba(5, 5, 10, 0.9)' }
  ];

  const renderThemeGrid = () => {
    const grid = document.getElementById('theme-grid');
    if (!grid) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    grid.innerHTML = themes.map(t => `
      <button class="theme-select-btn" data-theme-val="${t.id}" style="padding: 16px; border-radius: var(--radius-md); border: 2px solid ${currentTheme === t.id ? 'var(--accent-navy-primary)' : 'var(--border-neutral)'}; background-color: var(--bg-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s ease;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${t.sidebar} 50%, ${t.color} 50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"></div>
        <span style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${t.name}</span>
      </button>
    `).join('');

    // Attach listeners
    grid.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTheme = btn.dataset.themeVal;
        document.documentElement.setAttribute('data-theme', targetTheme);
        localStorage.setItem('tascorr_theme', targetTheme);
        
        // Let the global icon sync know
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: targetTheme }));
        
        // Update local UI
        renderThemeGrid();
        Notifications.info('Theme Applied', `${themes.find(x => x.id === targetTheme).name} theme activated.`);
      });
    });
  };

  renderThemeGrid();

  // Listen to external theme changes (e.g. from header toggle)
  window.addEventListener('themeChanged', () => {
    const tabDisplay = document.getElementById('tab-display');
    if (tabDisplay && tabDisplay.style.display !== 'none') {
      renderThemeGrid();
    }
  });
}
