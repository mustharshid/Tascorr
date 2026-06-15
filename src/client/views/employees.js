// employees.js - Employee directory and user provisioning view.
// Enforces Admin-Only Employee Provisioning (NNR-4) and Tier 1 scale limits (NNR-8).

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';
import { escapeHTML } from '../services/sanitize.js';

let employees = [];
let ranks = [];
let departments = [];

export function renderEmployeesView() {
  const isAdmin = AuthState.isAdmin();
  
  return `
    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Employees</h1>
          <p class="body-text">Manage corporate employee profiles, ranks, and operational provisioning.</p>
        </div>
        ${isAdmin ? `
          <button id="add-employee-btn" class="btn btn-primary" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Employee
          </button>
        ` : ''}
      </div>

      <!-- Add Employee Drawer Form (Admin only, hidden by default) -->
      ${isAdmin ? `
        <div id="add-employee-drawer" style="display: none; padding: 24px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); flex-direction: column; gap: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Provision Employee Account</h3>
            <p class="small-text">Enforces corporate standard complexity checks and department scoping</p>
          </div>
          <div id="employee-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-employee-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-first" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                First Name
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee's given first name (1 to 50 characters).</span>
                </span>
              </label>
              <input type="text" id="emp-first" required maxlength="50" placeholder="Ahmed" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-last" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Last Name
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee's family name or surname (1 to 50 characters).</span>
                </span>
              </label>
              <input type="text" id="emp-last" required maxlength="50" placeholder="Shareef" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-email" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Email Address
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Official workspace email. Must be unique within the platform.</span>
                </span>
              </label>
              <input type="email" id="emp-email" required maxlength="254" placeholder="ahmed@company.com" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-password" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Temp Password
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Temporary login key. Minimum 12 characters, including upper/lower case letters, numbers, and symbols.</span>
                </span>
              </label>
              <input type="password" id="emp-password" required maxlength="128" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-rank" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Role
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Determines numerical authority level (0 is root Administrator, higher numbers represent lower rank authority).</span>
                </span>
              </label>
              <select id="emp-rank" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <!-- Populated dynamically -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="emp-dept" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Optional scope. The primary operational department this user is assigned to.</span>
                </span>
              </label>
              <select id="emp-dept" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="">Unassigned</option>
                <!-- Populated dynamically -->
              </select>
            </div>

            <div style="grid-column: span 2; display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600; font-size:13px;">Create User</button>
              <button id="cancel-employee-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); cursor: pointer; text-align: center;">Cancel</button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Search & Filters -->
      <div class="widget-card" style="padding: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <input type="text" id="employee-search" placeholder="Search by name, email, rank..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);" />
        <select id="employee-status" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <!-- Employees Directory Table Card -->
      <div class="widget-card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead style="background-color: var(--bg-secondary); border-bottom: 1px solid var(--border-neutral); position: sticky; top: 0; z-index: 10;">
            <tr>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Full Name</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Email Address</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Rank Level</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Department</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary);">Status</th>
              <th style="padding: 16px; font-weight: 600; color: var(--text-secondary); text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="employees-table-body">
            <tr>
              <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">Loading employees registry...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Corporate Rank Form (Admin only) -->
      ${isAdmin ? `
        <div class="widget-card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);">
          <div>
            <h3 class="card-title" style="font-size: 16px;">Add Corporate Rank Role</h3>
            <p class="small-text">Define hierarchy authority levels. Lower levels represent higher authority (e.g., 0 = Administrator, 1 = Executive/Director, 2 = Dept Head, 3 = Manager, 4 = Employee).</p>
          </div>

          <!-- Current ranks summary -->
          <div id="rank-list-container" style="display: none; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); overflow: hidden;">
            <div style="padding: 10px 16px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-neutral);">
              <span class="small-text" style="font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">Current Rank Roles</span>
            </div>
            <div id="rank-list-rows" style="display: flex; flex-direction: column;"></div>
          </div>

          <div id="rank-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-rank-form" style="display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 240px; flex: 1;">
              <label for="rank-title-input" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Title
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The job title or delegation role description (e.g., Senior Consultant).</span>
                </span>
              </label>
              <input type="text" id="rank-title-input" required placeholder="VP / Director" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; width: 150px;">
              <label for="rank-level-input" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Authority Level
                <span class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Hierarchy integer (lower numbers represent higher authority). Must be a positive integer.</span>
                </span>
              </label>
              <input type="number" id="rank-level-input" required min="1" max="99" placeholder="2" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md);" />
            </div>
            <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border: none; font-weight: 600; height: 38px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">Add Rank Role</button>
          </form>
        </div>
      ` : ''}
    </div>

    <!-- Edit Employee Modal (Admin only overlay) -->
    ${isAdmin ? `
      <div id="edit-employee-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="widget-card" style="width: 100%; max-width: 500px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: var(--shadow-lg);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Edit Employee Profile</h3>
            <p class="small-text">Modify account level access, title role, status, and department scoping.</p>
          </div>
          <div id="edit-employee-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          <form id="edit-employee-form" style="display: flex; flex-direction: column; gap: 16px;">
            <input type="hidden" id="edit-emp-id" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="edit-emp-first" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                  First Name
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The employee's given first name.</span>
                  </div>
                </label>
                <input type="text" id="edit-emp-first" required maxlength="50" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="edit-emp-last" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                  Last Name
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The employee's family name or surname.</span>
                  </div>
                </label>
                <input type="text" id="edit-emp-last" required maxlength="50" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-rank" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Rank Role (Title & Access)
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Determines numerical authority level and system access.</span>
                </div>
              </label>
              <select id="edit-emp-rank" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-dept" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The primary operational department this user is assigned to.</span>
                </div>
              </label>
              <select id="edit-emp-dept" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="">Unassigned</option>
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-status" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Status
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Active users can log in; deactivated users are blocked.</span>
                </div>
              </label>
              <select id="edit-emp-status" required style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-emp-password" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Reset Password (leave blank to keep current)
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Generate a new login key for the employee.</span>
                </div>
              </label>
              <input type="password" id="edit-emp-password" placeholder="New password (min 12 chars, letters, numbers, symbols)" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600;">Save Changes</button>
              <button id="close-edit-modal-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * Load directory data and wire form actions — called once on page load.
 * Binds all event listeners once, then delegates data refresh to loadEmployeesData().
 */
export async function initEmployeesListeners() {
  const tableBody = document.getElementById('employees-table-body');
  if (!tableBody) return;

  const isAdmin = AuthState.isAdmin();

  // Hook filters — bind once
  document.getElementById('employee-search')?.addEventListener('input', renderTable);
  document.getElementById('employee-status')?.addEventListener('input', renderTable);

  if (isAdmin) {
    const addBtn = document.getElementById('add-employee-btn');
    const drawer = document.getElementById('add-employee-drawer');
    const cancelBtn = document.getElementById('cancel-employee-btn');
    const form = document.getElementById('create-employee-form');
    const rankForm = document.getElementById('create-rank-form');

    // Edit employee modal elements
    const editModal = document.getElementById('edit-employee-modal');
    const closeEditBtn = document.getElementById('close-edit-modal-btn');
    const editForm = document.getElementById('edit-employee-form');

    addBtn?.addEventListener('click', () => {
      const activeCount = employees.filter(e => e.status === 'active').length;
      if (activeCount >= 10) {
        Notifications.warning('Tier Limit Warning', 'Your workspace count is at 10 active users. Adding employees requires tier migration support.');
      }
      drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
    });

    cancelBtn?.addEventListener('click', () => {
      drawer.style.display = 'none';
    });

    // Edit user row handler (Event delegation)
    document.getElementById('employees-table-body')?.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-emp-btn');
      if (editBtn) {
        const empId = Number(editBtn.dataset.id);
        const emp = employees.find(x => x.id === empId);
        if (emp) {
          document.getElementById('edit-emp-id').value = emp.id;
          document.getElementById('edit-emp-first').value = emp.firstName;
          document.getElementById('edit-emp-last').value = emp.lastName;

          const rankSelect = document.getElementById('edit-emp-rank');
          if (rankSelect) {
            rankSelect.innerHTML = ranks.map(r =>
              `<option value="${r.id}">${escapeHTML(r.title)} (Level ${r.level})</option>`
            ).join('');
            rankSelect.value = emp.rankId;
          }

          const deptSelect = document.getElementById('edit-emp-dept');
          if (deptSelect) {
            deptSelect.innerHTML = '<option value="">Unassigned</option>' +
              departments.map(d => `<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
            deptSelect.value = emp.departmentId || '';
          }

          document.getElementById('edit-emp-status').value = emp.status;
          
          const passwordInput = document.getElementById('edit-emp-password');
          if (passwordInput) passwordInput.value = '';

          if (editModal) editModal.style.display = 'flex';
        }
      }

      // Delete employee handler
      const deleteBtn = e.target.closest('.delete-emp-btn');
      if (deleteBtn) {
        const empId = Number(deleteBtn.dataset.id);
        const empName = deleteBtn.dataset.name || 'this employee';

        if (!confirm(`Are you sure you want to delete "${empName}"? This action will deactivate their account.`)) {
          return;
        }

        try {
          deleteBtn.disabled = true;
          deleteBtn.innerText = 'Deleting...';
          await fetchApi('DELETE', `/users/${empId}`);
          Notifications.success('Employee Deleted', `${empName} has been removed from the directory.`);
          await loadEmployeesData();
        } catch (err) {
          console.error(err);
          Notifications.error('Deletion Failed', err.message || 'Could not delete employee.');
        } finally {
          deleteBtn.disabled = false;
          deleteBtn.innerText = 'Delete';
        }
      }
    });

    // Close edit modal
    closeEditBtn?.addEventListener('click', () => {
      if (editModal) editModal.style.display = 'none';
    });

    // Submit edit employee form
    editForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const empId = Number(document.getElementById('edit-emp-id').value);
      const firstName = document.getElementById('edit-emp-first').value.trim();
      const lastName = document.getElementById('edit-emp-last').value.trim();
      const rankId = Number(document.getElementById('edit-emp-rank').value);
      const departmentId = document.getElementById('edit-emp-dept').value;
      const status = document.getElementById('edit-emp-status').value;
      const password = document.getElementById('edit-emp-password').value;

      if (!firstName || !lastName) {
        Notifications.error('Validation Error', 'First name and Last name are required.');
        return;
      }

      const updatePayload = {
        firstName,
        lastName,
        rankId,
        departmentId: departmentId ? Number(departmentId) : null,
        status
      };

      if (password) {
        if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
          Notifications.error('Validation Error', 'Passwords must be at least 12 characters and meet complexity requirements (mixed case, number, symbol).');
          return;
        }
        updatePayload.password = password;
      }

      const submitBtn = editForm.querySelector('button[type="submit"]');
      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Saving...'; }

        await fetchApi('PATCH', `/users/${empId}`, updatePayload);

        Notifications.success('User Profile Updated', 'Employee details modified successfully.');
        if (editModal) editModal.style.display = 'none';
        await loadEmployeesData();
      } catch (err) {
        console.error(err);
        Notifications.error('Update Failed', err.message || 'Check server constraints.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Save Changes'; }
      }
    });

    // Inline edit Corporate Rank Roles handlers
    const rankListRows = document.getElementById('rank-list-rows');
    rankListRows?.addEventListener('input', (e) => {
      if (e.target.classList.contains('rank-title-edit-input')) {
        const row = e.target.closest('div');
        const saveBtn = row?.querySelector('.save-rank-btn');
        if (saveBtn) saveBtn.style.display = 'inline-block';
      }
    });

    rankListRows?.addEventListener('click', async (e) => {
      if (e.target.classList.contains('save-rank-btn')) {
        const rankId = Number(e.target.dataset.id);
        const row = e.target.closest('div');
        const input = row?.querySelector('.rank-title-edit-input');
        const title = input?.value.trim();
        if (!title) {
          Notifications.error('Validation Error', 'Rank title cannot be empty.');
          return;
        }
        try {
          await fetchApi('PATCH', `/users/ranks/${rankId}`, { title });
          Notifications.success('Rank Updated', 'Corporate rank role updated.');
          await loadEmployeesData();
        } catch (err) {
          Notifications.error('Update Failed', err.message || 'Could not update rank.');
        }
      } else if (e.target.classList.contains('delete-rank-btn')) {
        const rankId = Number(e.target.dataset.id);
        if (confirm('Are you sure you want to delete this Corporate Rank role?')) {
          try {
            await fetchApi('DELETE', `/users/ranks/${rankId}`);
            Notifications.success('Rank Deleted', 'Corporate rank role deleted successfully.');
            await loadEmployeesData();
          } catch (err) {
            Notifications.error('Deletion Failed', err.message || 'Could not delete rank.');
          }
        }
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = document.getElementById('emp-first').value.trim();
      const lastName = document.getElementById('emp-last').value.trim();
      const email = document.getElementById('emp-email').value.trim();
      const password = document.getElementById('emp-password').value;
      const rankId = Number(document.getElementById('emp-rank').value);
      const departmentId = document.getElementById('emp-dept').value;

      if (!firstName || firstName.length < 1 || firstName.length > 50) {
        showError('First name must be between 1 and 50 characters.');
        return;
      }
      if (!lastName || lastName.length < 1 || lastName.length > 50) {
        showError('Last name must be between 1 and 50 characters.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address format.');
        return;
      }

      if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        showError('Temporary passwords must be at least 12 characters long and meet complexity requirements (mixed case, number, symbol).');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Creating Account...'; }

        await fetchApi('POST', '/users', {
          firstName, lastName, email, password, rankId,
          departmentId: departmentId ? Number(departmentId) : null
        });

        Notifications.success('User Created', 'Employee profile provisioned successfully.');
        drawer.style.display = 'none';
        form.reset();
        await loadEmployeesData();
      } catch (err) {
        console.error(err);
        showError(err.message || 'Failed to create user account.');
        Notifications.error('Provisioning Failed', err.message || 'Check gate constraints.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Create User'; }
      }
    });

    rankForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('rank-title-input').value.trim();
      const level = Number(document.getElementById('rank-level-input').value);

      const errorAlert = document.getElementById('rank-error-alert');
      if (errorAlert) { errorAlert.style.display = 'none'; errorAlert.innerText = ''; }

      if (!title) { showRankError('Rank title is required.'); return; }
      if (isNaN(level) || level < 0) { showRankError('Authority level must be a non-negative number.'); return; }

      const submitBtn = rankForm.querySelector('button[type="submit"]');
      try {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Adding...'; }

        await fetchApi('POST', '/users/ranks', { title, level });

        Notifications.success('Rank Role Created', `Successfully added rank role: "${title}".`);
        rankForm.reset();
        await loadEmployeesData();
      } catch (err) {
        console.error(err);
        showRankError(err.message || 'Failed to create rank role.');
        Notifications.error('Rank Creation Failed', err.message || 'Verification failed.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Add Rank Role'; }
      }
    });

    function showError(msg) {
      const el = document.getElementById('employee-error-alert');
      if (el) { el.innerText = msg; el.style.display = 'block'; }
    }

    function showRankError(msg) {
      const el = document.getElementById('rank-error-alert');
      if (el) { el.innerText = msg; el.style.display = 'block'; }
    }
  }

  // Initial data load
  await loadEmployeesData();
}

/**
 * Fetch fresh users/departments/ranks data and re-render.
 * Safe to call multiple times — does not re-bind event listeners.
 */
async function loadEmployeesData() {
  const tableBody = document.getElementById('employees-table-body');
  if (!tableBody) return;

  const isAdmin = AuthState.isAdmin();

  try {
    const [uData, deptData, ranksData] = await Promise.all([
      fetchApi('GET', '/users'),
      fetchApi('GET', '/departments'),
      fetchApi('GET', '/users/ranks')
    ]);

    employees = uData.users || [];
    departments = deptData.departments || [];
    ranks = ranksData.ranks || [];

    if (ranks.length === 0) {
      ranks = [
        { id: 1, title: 'Administrator', level: 0 },
        { id: 2, title: 'Chief Executive', level: 1 },
        { id: 3, title: 'Deputy Chief Executive', level: 2 },
        { id: 4, title: 'Executive / Director', level: 3 },
        { id: 5, title: 'Department Head', level: 4 },
        { id: 6, title: 'Manager', level: 5 },
        { id: 7, title: 'Employee', level: 6 }
      ];
    }

    renderTable();

    if (isAdmin) {
      const rankSelect = document.getElementById('emp-rank');
      if (rankSelect) {
        rankSelect.innerHTML = ranks.map(r =>
          `<option value="${r.id}">${escapeHTML(r.title)} (Level ${r.level})</option>`
        ).join('');
      }

      const deptSelect = document.getElementById('emp-dept');
      if (deptSelect) {
        deptSelect.innerHTML = '<option value="">Unassigned</option>' +
          departments.map(d => `<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
      }

      // Populate current ranks list so users know which levels are already occupied
      const rankListContainer = document.getElementById('rank-list-container');
      const rankListRows = document.getElementById('rank-list-rows');
      if (rankListContainer && rankListRows) {
        if (ranks.length > 0) {
          rankListContainer.style.display = 'block';
          rankListRows.innerHTML = ranks.map((r, i) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; ${i < ranks.length - 1 ? 'border-bottom: 1px solid var(--border-neutral);' : ''}">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <span class="small-text" style="width: 80px; font-weight: 700; color: var(--accent-navy-primary);">Level ${r.level}</span>
                <input type="text" class="rank-title-edit-input" data-id="${r.id}" value="${escapeHTML(r.title)}" style="border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-primary); font-size: 13px; font-family: var(--font-text); width: 60%; max-width: 250px; padding: 4px;" />
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                <button class="save-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-success); font-weight: 600; cursor: pointer; display: none; padding: 0;">Save</button>
                <button class="delete-rank-btn small-text" data-id="${r.id}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>
              </div>
            </div>
          `).join('');
        } else {
          rankListContainer.style.display = 'none';
        }
      }
    }
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6" style="padding:32px; text-align:center; color:var(--status-danger);">Failed to load registry: ${escapeHTML(err.message)}</td></tr>`;
  }
}

/**
 * Render table rows based on filters
 */
function renderTable() {
  const tableBody = document.getElementById('employees-table-body');
  if (!tableBody) return;

  const query = document.getElementById('employee-search')?.value.toLowerCase() || '';
  const status = document.getElementById('employee-status')?.value || 'ALL';
  const isAdmin = AuthState.isAdmin();

  const filtered = employees.filter(e => {
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch = name.includes(query) || e.email.toLowerCase().includes(query) || e.rank?.title.toLowerCase().includes(query);
    const matchesStatus = status === 'ALL' || e.status === status;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-secondary);">
          No employees matching filters found.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(e => {
    const isDeactivated = e.status !== 'active';
    const statusPill = isDeactivated 
      ? '<span class="pill-badge status-danger"><span class="badge-dot"></span>Inactive</span>'
      : '<span class="pill-badge status-success"><span class="badge-dot"></span>Active</span>';
      
    const deptName = e.department ? escapeHTML(e.department.name) : '<span style="color:var(--text-secondary)">General</span>';
    const fullName = `${escapeHTML(e.firstName)} ${escapeHTML(e.lastName)}`;
    const rankTitle = escapeHTML(e.rank?.title || 'Employee');
    const rankLevel = e.rank ? e.rank.level : 4;
    
    return `
      <tr style="border-bottom: 1px solid var(--border-neutral); hover: background-color var(--bg-secondary); transition: background-color 0.15s ease;">
        <td data-label="Full Name" style="padding: 16px; font-weight:600; color:var(--text-primary);">${fullName}</td>
        <td data-label="Email Address" style="padding: 16px; color:var(--text-secondary);">${escapeHTML(e.email)}</td>
        <td data-label="Rank Level" style="padding: 16px; color:var(--text-primary); font-weight:500;">${rankTitle} <span class="small-text">(Lvl ${rankLevel})</span></td>
        <td data-label="Department" style="padding: 16px;">${deptName}</td>
        <td data-label="Status" style="padding: 16px;">${statusPill}</td>
        <td data-label="Actions" style="padding: 16px; text-align: right;">
          <div style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <a href="#profile" class="small-text" style="color:var(--accent-navy-primary); font-weight:600; text-decoration:none;" onclick="localStorage.setItem('target_profile_id', ${e.id});">View Profile</a>
            ${isAdmin ? `<button class="edit-emp-btn small-text" data-id="${e.id}" style="background: none; border: none; color: var(--accent-navy-primary); font-weight: 600; cursor: pointer; padding: 0;">Edit</button>` : ''}
            ${isAdmin && e.id !== AuthState.currentUser?.id ? `<button class="delete-emp-btn small-text" data-id="${e.id}" data-name="${escapeHTML(e.firstName)} ${escapeHTML(e.lastName)}" style="background: none; border: none; color: var(--status-danger); font-weight: 600; cursor: pointer; padding: 0;">Delete</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
