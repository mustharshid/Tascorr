// departments.js - Department nodes and accountability tree chart.
// Conforms to Section 6.4 Hierarchy Visualization and Section 7.3 Mobile specifications.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';
import { escapeHTML } from '../services/sanitize.js';

let departments = [];
let employees = [];

export function renderDepartmentsView() {
  const isAdmin = AuthState.isAdmin();

  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title & CTA -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-title">Departments</h1>
          <p class="body-text">Visualize structural department hierarchies, heads, and staff mappings.</p>
        </div>
        ${isAdmin ? `
          <button id="add-dept-btn" class="menu-item active" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Department
          </button>
        ` : ''}
      </div>

      <!-- Create Department Form (Admin only, hidden by default) -->
      ${isAdmin ? `
        <div id="create-dept-card" class="widget-card" style="display: none; flex-direction: column; gap: 16px; max-width: 500px;">
          <h3 class="card-title">Create Department Node</h3>
          <div id="dept-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          
          <form id="create-dept-form" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="dept-name" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                Department Name
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The official name of the operational department.</span>
                </div>
              </label>
              <input type="text" id="dept-name" required placeholder="Operations & Logistics" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md);" />
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <label for="dept-head" class="small-text" style="font-weight:600; display: flex; align-items: center;">
                Department Head
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee designated as the leader of this department.</span>
                </div>
              </label>
              <select id="dept-head" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary);">
                <option value="">No Head Assigned</option>
                <!-- Populated dynamically -->
              </select>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="submit" class="menu-item active" style="padding: 8px 16px; border:none; font-weight:600;">Save Department</button>
              <button id="cancel-dept-btn" type="button" style="padding: 8px 16px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:none; cursor:pointer;">Cancel</button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Interactive Tree Section -->
      <div class="widget-card" style="padding: 32px; overflow-x: auto;">
        <div style="min-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 40px;" id="hierarchy-tree-root">
          <!-- Hierarchy Tree will render dynamically here -->
        </div>
      </div>
    </div>

    <!-- Edit Department Modal (Admin only overlay) -->
    ${isAdmin ? `
      <div id="edit-dept-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="widget-card" style="width: 100%; max-width: 500px; padding: 24px; display: flex; flex-direction: column; gap: 20px; box-shadow: var(--shadow-lg);">
          <div>
            <h3 class="card-title" style="font-size: 18px;">Edit Department Node</h3>
            <p class="small-text">Modify department name and accountability head assignment.</p>
          </div>
          <div id="edit-dept-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>
          <form id="edit-dept-form" style="display: flex; flex-direction: column; gap: 16px;">
            <input type="hidden" id="edit-dept-id" />
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-dept-name" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department Name
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The official name of the operational department.</span>
                </div>
              </label>
              <input type="text" id="edit-dept-name" required maxlength="100" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background: var(--bg-secondary); color: var(--text-primary);" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="edit-dept-head" class="small-text" style="font-weight: 600; display: flex; align-items: center;">
                Department Head
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The employee designated as the leader of this department.</span>
                </div>
              </label>
              <select id="edit-dept-head" style="padding: 8px 12px; border:1px solid var(--border-neutral); border-radius:var(--radius-md); background:var(--bg-secondary); color: var(--text-primary);">
                <option value="">No Head Assigned</option>
                <!-- Dynamically populated -->
              </select>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button type="submit" class="menu-item active" style="flex:1; justify-content:center; padding: 10px; border:none; font-weight:600;">Save Changes</button>
              <button id="close-edit-dept-modal-btn" type="button" style="flex:1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background: var(--bg-primary); color: var(--text-primary); cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    ` : ''}
  `;
}

/**
 * Fetch and construct accountability hierarchy chart.
 * Called once on page load — binds events once, then calls loadAndRender for data.
 */
export async function initDepartmentsListeners() {
  const treeRoot = document.getElementById('hierarchy-tree-root');
  if (!treeRoot) return;

  const isAdmin = AuthState.isAdmin();

  // Wire up event listeners ONCE (not inside the data-loading path)
  if (isAdmin) {
    const addBtn = document.getElementById('add-dept-btn');
    const card = document.getElementById('create-dept-card');
    const cancelBtn = document.getElementById('cancel-dept-btn');
    const form = document.getElementById('create-dept-form');

    // Edit Modal elements
    const editModal = document.getElementById('edit-dept-modal');
    const closeEditBtn = document.getElementById('close-edit-dept-modal-btn');
    const editForm = document.getElementById('edit-dept-form');

    addBtn?.addEventListener('click', () => {
      card.style.display = card.style.display === 'none' ? 'flex' : 'none';
    });

    cancelBtn?.addEventListener('click', () => {
      card.style.display = 'none';
    });

    // Event delegation on tree root for edit and delete clicks
    treeRoot.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.edit-dept-btn');
      const deleteBtn = e.target.closest('.delete-dept-btn');

      if (editBtn) {
        const deptId = Number(editBtn.dataset.id);
        const dept = departments.find(d => d.id === deptId);
        if (dept) {
          document.getElementById('edit-dept-id').value = dept.id;
          document.getElementById('edit-dept-name').value = dept.name;

          // Populate the head select in the edit modal
          const headSelect = document.getElementById('edit-dept-head');
          if (headSelect) {
            headSelect.innerHTML = '<option value="">No Head Assigned</option>' +
              employees.map(u => `<option value="${u.id}">${escapeHTML(u.firstName)} ${escapeHTML(u.lastName)} (${escapeHTML(u.rank?.title || 'Employee')})</option>`).join('');
            headSelect.value = dept.headUserId || '';
          }

          if (editModal) editModal.style.display = 'flex';
        }
      }

      if (deleteBtn) {
        const deptId = Number(deleteBtn.dataset.id);
        const dept = departments.find(d => d.id === deptId);
        if (dept) {
          if (confirm(`Are you sure you want to delete the "${dept.name}" department? All members will be unassigned.`)) {
            try {
              await fetchApi('DELETE', `/departments/${deptId}`);
              Notifications.success('Department Deleted', 'Department node removed.');
              await loadAndRender();
            } catch (err) {
              console.error(err);
              Notifications.error('Deletion Failed', err.message || 'Could not delete department.');
            }
          }
        }
      }
    });

    closeEditBtn?.addEventListener('click', () => {
      if (editModal) editModal.style.display = 'none';
    });

    editForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const deptId = Number(document.getElementById('edit-dept-id').value);
      const name = document.getElementById('edit-dept-name').value.trim();
      const headUserId = document.getElementById('edit-dept-head').value;

      const errorAlert = document.getElementById('edit-dept-error-alert');
      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.innerText = '';
      }

      if (!name || name.length < 2) {
        if (errorAlert) {
          errorAlert.innerText = 'Department name must be at least 2 characters.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      const submitBtn = editForm.querySelector('button[type="submit"]');
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Saving...';
        }

        await fetchApi('PATCH', `/departments/${deptId}`, {
          name,
          headUserId: headUserId ? Number(headUserId) : null
        });

        Notifications.success('Department Updated', 'Department details saved successfully.');
        if (editModal) editModal.style.display = 'none';
        await loadAndRender();
      } catch (err) {
        console.error(err);
        if (errorAlert) {
          errorAlert.innerText = err.message || 'Failed to update department.';
          errorAlert.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save Changes';
        }
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('dept-name').value.trim();
      const headUserId = document.getElementById('dept-head').value;

      const errorAlert = document.getElementById('dept-error-alert');
      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.innerText = '';
      }

      if (!name || name.length < 2) {
        if (errorAlert) {
          errorAlert.innerText = 'Department name must be at least 2 characters.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Saving...';
        }

        await fetchApi('POST', '/departments', {
          name,
          headUserId: headUserId ? Number(headUserId) : null
        });

        Notifications.success('Department Created', 'Department node onboarded successfully.');
        card.style.display = 'none';
        form.reset();

        // Only reload data + re-render — do NOT call initDepartmentsListeners again
        await loadAndRender();
      } catch (err) {
        console.error(err);
        if (errorAlert) {
          errorAlert.innerText = err.message || 'Failed to create department node.';
          errorAlert.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save Department';
        }
      }
    });
  }

  // Initial data load
  await loadAndRender();
}

/**
 * Fetch fresh data and re-render the tree + head select dropdown.
 * Safe to call multiple times — does not re-bind event listeners.
 */
async function loadAndRender() {
  const treeRoot = document.getElementById('hierarchy-tree-root');
  if (!treeRoot) return;

  const isAdmin = AuthState.isAdmin();

  try {
    const [deptRes, usersRes] = await Promise.all([
      fetchApi('GET', '/departments'),
      fetchApi('GET', '/users')
    ]);

    departments = deptRes.departments || [];
    employees = usersRes.users || [];

    renderTree();

    // Refresh head dropdown options with latest users list
    if (isAdmin) {
      const headSelect = document.getElementById('dept-head');
      if (headSelect) {
        headSelect.innerHTML = '<option value="">No Head Assigned</option>' +
          employees.map(u => `<option value="${u.id}">${escapeHTML(u.firstName)} ${escapeHTML(u.lastName)} (${escapeHTML(u.rank?.title || 'Employee')})</option>`).join('');
      }
    }
  } catch (err) {
    console.error(err);
    treeRoot.innerHTML = `<div style="color:var(--status-danger)">Error loading structure: ${escapeHTML(err.message)}</div>`;
  }
}

/**
 * Layout the visual tree hierarchy
 */
function renderTree() {
  const rootEl = document.getElementById('hierarchy-tree-root');
  if (!rootEl) return;

  const isAdmin = AuthState.isAdmin();

  let treeHtml = '';

  // Find corporate CEO or topmost administrators (level 1)
  const rootUsers = employees.filter(e => e.rank?.level === 1 && e.status === 'active');
  const rootNode = rootUsers.length > 0 ? rootUsers[0] : null;

  if (rootNode) {
    const avatarUrl = `/avatars/user-${rootNode.id}.jpg?t=${Date.now()}`;
    const initial = `${rootNode.firstName[0]}${rootNode.lastName[0]}`;
    
    treeHtml += `
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;">
        <!-- Root Card -->
        <div class="org-node" style="position: relative; z-index: 2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; background-color: var(--accent-navy-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <img src="${avatarUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; object-fit: cover; display: none;" />
            <div style="display: flex;">${escapeHTML(initial)}</div>
          </div>
          <div style="font-weight: 600; font-size: 14px; text-align: center; color: var(--text-primary); margin-bottom: 4px;">
            ${escapeHTML(rootNode.firstName)} ${escapeHTML(rootNode.lastName)}
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">
            ${escapeHTML(rootNode.rank?.title || 'Top Executive')}
          </div>
        </div>
        
        <!-- Stem down from Root -->
        ${departments.length > 0 ? `<div style="width: 2px; height: 32px; background-color: var(--tree-line-color);"></div>` : ''}
      </div>
    `;
  }

  // Render Departments row
  if (departments.length > 0) {
    // Horizontal row of departments
    treeHtml += `
      <div style="display: flex; gap: 32px; justify-content: center; align-items: flex-start; position: relative;">

        ${departments.map((d, index) => {
          const headUser = d.headUser;
          const headName = headUser ? `${headUser.firstName} ${headUser.lastName}` : 'Vacant';
          const headTitle = headUser ? (headUser.rank?.title || 'VP / Department Head') : 'No Head Assigned';
          const members = employees.filter(e => e.departmentId === d.id && e.id !== headUser?.id);

          return `
            <div style="display: flex; flex-direction: column; align-items: center; position: relative; min-width: 200px;">
              
              <!-- Horizontal connector line segments bridging the gap -->
              ${departments.length > 1 ? `
                <div style="position: absolute; top: 0; height: 2px; background-color: var(--tree-line-color);
                  left: ${index === 0 ? '50%' : '-16px'};
                  right: ${index === departments.length - 1 ? '50%' : '-16px'};"></div>
              ` : ''}

              <!-- Vertical drop line from horizontal connector -->
              <div style="width: 2px; height: 16px; background-color: var(--tree-line-color); z-index: 2;"></div>
              
              <!-- Department Head Card -->
              <div class="widget-card" style="padding: 16px 20px; text-align: center; border: 1px solid var(--border-neutral); max-width: 240px; min-width: 180px; background-color: var(--bg-secondary); margin-top: -2px; position: relative; z-index: 3;">
                ${isAdmin ? `
                  <div style="position: absolute; top: 6px; right: 8px; display: flex; gap: 6px; z-index: 5;">
                    <button class="edit-dept-btn" data-id="${d.id}" title="Edit Department" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button class="delete-dept-btn" data-id="${d.id}" title="Delete Department" style="background: none; border: none; cursor: pointer; color: var(--status-danger); padding: 2px; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 13px; height: 13px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ` : ''}
                <span class="small-text" style="font-weight: 700; color: var(--accent-navy-primary); text-transform: uppercase; font-size: 10px; display:block; margin-bottom: 8px; padding-right: 28px; text-align: left;">${escapeHTML(d.name)}</span>
                <div style="display:flex;align-items:center;gap:12px;text-align:left;">
                  <img src="/avatars/user-${headUser?.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;display:${headUser ? 'block' : 'none'};" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:${headUser ? 'none' : 'flex'};align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${escapeHTML(headName[0] || '?')}</div>
                  <div>
                    <h4 class="card-title" style="font-size: 13px; font-weight: 600; text-align: left;">${escapeHTML(headName)}</h4>
                    <p class="small-text" style="color: var(--text-secondary); font-size:11px; text-align: left;">${escapeHTML(headTitle)}</p>
                  </div>
                </div>
              </div>

              <!-- Connector Line to Department Members -->
              ${members.length > 0 ? `
                <div style="width: 2px; height: 24px; background-color: var(--tree-line-color);"></div>
                
                <!-- Members vertical tree stack -->
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%;">
                  ${members.map(m => `
                    <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                      <div style="width: 2px; height: 12px; background-color: var(--tree-line-color);"></div>
                      <div style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-sm); text-align: left; background-color: var(--bg-primary); min-width: 140px; max-width: 200px; display: flex; align-items: center; gap: 8px;">
                        <img src="/avatars/user-${m.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:24px;height:24px;border-radius:50%;object-fit:cover;display:block;" />
                        <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-weight:bold;font-size:10px;flex-shrink:0;">${escapeHTML(m.firstName[0] || '?')}</div>
                        <div>
                          <strong class="data-number" style="font-size: 12px; display:block;">${escapeHTML(m.firstName)} ${escapeHTML(m.lastName)}</strong>
                          <div class="small-text" style="font-size:10px; margin-top:2px;">${escapeHTML(m.rank?.title || 'Employee')}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    treeHtml += `<p class="small-text" style="color:var(--text-secondary)">No departments configured.</p>`;
  }

  rootEl.innerHTML = treeHtml;
}
