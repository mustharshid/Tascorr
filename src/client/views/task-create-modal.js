// task-create-modal.js - Slide-out drawer panel for Task Creation.
// Adheres strictly to Section 6.3 and Section 4 Workload Awareness.

import { fetchApi } from '../services/api.js';
import { Notifications } from '../services/notifications.js';
import { escapeHTML } from '../services/sanitize.js';
import { AuthState } from '../services/auth-state.js';

export class TaskCreateDrawer {
  constructor(onSuccessCallback) {
    this.onSuccess = onSuccessCallback;
    this.drawerEl = null;
    this.overlayEl = null;
    this.users = [];
    this.departments = [];
    this.subtasks = [];
  }

  async render() {
    this.subtasks = [];
    // 1. Fetch available assignees and departments first
    try {
      const usersData = await fetchApi('GET', '/users?assignableOnly=true');
      this.users = usersData.users || [];
      
      // Derive assignable departments directly from the assignable users' departments
      const deptMap = new Map();
      this.users.forEach(u => {
        if (u.departmentId && u.department) {
          deptMap.set(u.departmentId, u.department.name);
        }
      });
      this.departments = Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
    } catch (err) {
      console.error(err);
      Notifications.error('Data Loading Failed', 'Could not load assignees list.');
    }

    // 2. Create elements if they do not exist
    if (!this.overlayEl) {
      this.overlayEl = document.createElement('div');
      this.overlayEl.id = 'drawer-overlay';
      this.overlayEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(17, 24, 39, 0.4);
        backdrop-filter: blur(4px);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      `;
      this.overlayEl.addEventListener('click', () => this.close());
      document.body.appendChild(this.overlayEl);
    }

    if (!this.drawerEl) {
      this.drawerEl = document.createElement('div');
      this.drawerEl.id = 'task-create-drawer';
      document.body.appendChild(this.drawerEl);
    }

    // Assignable users are already filtered by the backend via assignableOnly=true
    const filteredUsers = this.users;

    // Assignee option elements rendering
    const assigneeOptions = filteredUsers.map(u => 
      `<option value="${u.id}">${escapeHTML(u.firstName)} ${escapeHTML(u.lastName)} (${escapeHTML(u.rank?.title || 'Employee')})</option>`
    ).join('');

    // Department option elements rendering
    const deptOptions = this.departments.map(d => 
      `<option value="${d.id}">${escapeHTML(d.name)}</option>`
    ).join('');

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      this.drawerEl.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; width: 100%; background: inherit; padding: 20px; padding-bottom: 0; position: relative;">
          <!-- Drag Handle -->
          <div style="width: 48px; height: 5px; background: var(--border-neutral); border-radius: 3px; margin: 0 auto 16px auto; flex-shrink: 0; opacity: 0.5;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary);">New Task</h2>
            <button id="close-drawer-btn" style="background: var(--sidebar-bg); border: none; width: 32px; height: 32px; min-width: 32px; min-height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); flex-shrink: 0;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div id="drawer-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); margin-bottom: 16px;"></div>

          <form id="drawer-task-form" style="display: flex; flex-direction: column; gap: 16px; flex: 1; overflow-y: auto; padding-bottom: 100px;">
            <!-- Task Title -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Task Title</label>
              <div style="position: relative; width: 100%;">
                <input type="text" id="task-title" required maxlength="100" placeholder="What needs to be done?" style="padding: 12px 44px 12px 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 15px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; font-weight: 500; box-sizing: border-box; width: 100%;" />
                <button type="button" class="ai-refine-btn" data-target="task-title" data-type="title" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; z-index: 5;" title="AI Auto-format Title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai-sparkle-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/></svg>
                </button>
              </div>
            </div>

            <!-- Description -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Description</label>
              <div style="position: relative; width: 100%;">
                <textarea id="task-desc" maxlength="2000" placeholder="Add detailed notes..." style="padding: 12px 44px 12px 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 14px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: none; height: 70px; box-sizing: border-box; width: 100%;"></textarea>
                <button type="button" class="ai-refine-btn" data-target="task-desc" data-type="description" style="position: absolute; right: 12px; top: 20px; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; z-index: 5;" title="AI Auto-format Description">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai-sparkle-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/></svg>
                </button>
              </div>
            </div>

            <!-- Due Date & Priority Grid -->
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; flex-shrink: 0;">
              <!-- Due Date -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Due Date</label>
                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                  <div class="mobile-due-opt active" data-offset="0" style="padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer; flex: 1; text-align: center;">Today</div>
                  <div class="mobile-due-opt" data-offset="1" style="padding: 6px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer; flex: 1; text-align: center;">Tmrw</div>
                </div>
                <input type="date" id="task-due" value="${new Date().toISOString().split('T')[0]}" required style="padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;" />
              </div>

              <!-- Priority -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Priority</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                  <div class="mobile-priority-opt" data-val="Low" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Low</div>
                  <div class="mobile-priority-opt active" data-val="Medium" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: #E0E7FF; color: #4338CA; cursor: pointer;">Med</div>
                  <div class="mobile-priority-opt" data-val="High" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">High</div>
                  <div class="mobile-priority-opt" data-val="Critical" style="padding: 6px 4px; text-align: center; border-radius: 10px; font-size: 11px; font-weight: 600; background: var(--sidebar-bg); color: var(--text-secondary); cursor: pointer;">Crit</div>
                </div>
                <input type="hidden" id="task-priority" value="Medium" />
              </div>
            </div>

            <!-- Assign To -->
            <div style="display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Assign To</label>
              <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; -ms-overflow-style: none;">
                ${filteredUsers.map(u => `
                  <div class="mobile-assignee-opt" data-id="${u.id}" style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; padding: 6px 12px; background: var(--bg-secondary); border: 1px solid var(--border-neutral); border-radius: 20px; transition: all 0.2s;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid transparent; transition: all 0.2s; flex-shrink: 0;">
                      <img src="/avatars/user-${u.id}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />
                      <div style="width: 100%; height: 100%; border-radius: 50%; background: var(--sidebar-bg); color: var(--text-primary); display: none; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">
                        ${escapeHTML(u.firstName[0])}
                      </div>
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${escapeHTML(u.firstName)}</span>
                  </div>
                `).join('')}
              </div>
              <input type="hidden" id="task-assignee" required />
            </div>

            <!-- Subtasks Checklist -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="small-text" style="font-size: 10px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">Subtasks Checklist</label>
              <div id="mobile-subtasks-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 120px; overflow-y: auto;"></div>
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <input type="text" id="mobile-new-subtask" placeholder="Add a subtask..." style="flex: 1; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; box-sizing: border-box;" />
                <button type="button" id="mobile-add-subtask-btn" style="background: var(--bg-secondary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); padding: 0 16px; font-weight: 600; color: var(--text-primary); cursor: pointer; font-size: 13px;">Add</button>
              </div>
            </div>

            <input type="hidden" id="task-dept" value="" />
            <input type="checkbox" id="task-recurring" style="display: none;" />
          </form>

          <!-- Fixed Bottom Button -->
          <div class="mobile-drawer-bottom" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 20px; border-radius: 0 0 32px 32px; box-sizing: border-box;">
            <button id="submit-task-btn" style="width: 100%; background: #3B82F6; color: white; padding: 14px; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
              Create & Assign
            </button>
          </div>
        </div>
      `;
    } else {
      this.drawerEl.innerHTML = `
        <!-- Header -->
        <div style="padding: 24px; border-bottom: 1px solid var(--border-neutral); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
          <div>
            <h3 class="card-title" style="font-size: 20px;">Create New Task</h3>
            <p class="small-text">Publish and assign a new workforce task item</p>
          </div>
          <button id="close-drawer-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>

        <!-- Content Scroll Wells -->
        <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
          <div id="drawer-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md);"></div>

          <form id="drawer-task-form" style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Task Title -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-title" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Task Title
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">A concise, descriptive title for this task.</span>
                </div>
              </label>
              <div style="position: relative; width: 100%;">
                <input type="text" id="task-title" required maxlength="100" placeholder="Consolidated Financial Review" style="padding: 10px 44px 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;" />
                <button type="button" class="ai-refine-btn" data-target="task-title" data-type="title" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; z-index: 5;" title="AI Auto-format Title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai-sparkle-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/></svg>
                </button>
              </div>
            </div>

            <!-- Description -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-desc" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Description
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Detailed instructions or context required to complete the task.</span>
                </div>
              </label>
              <div style="position: relative; width: 100%;">
                <textarea id="task-desc" maxlength="2000" placeholder="Provide clear contextual description parameters..." rows="4" style="padding: 10px 44px 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; resize: vertical; width: 100%; box-sizing: border-box;"></textarea>
                <button type="button" class="ai-refine-btn" data-target="task-desc" data-type="description" style="position: absolute; right: 12px; top: 20px; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; z-index: 5;" title="AI Auto-format Description">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ai-sparkle-icon"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/></svg>
                </button>
              </div>
            </div>

            <!-- Subtasks Checklist -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Subtasks Checklist
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Add smaller actionable items required to complete this task.</span>
                </div>
              </label>
              <div id="desktop-subtasks-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="desktop-new-subtask" placeholder="e.g., Review quarter 1 metrics..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;" />
                <button type="button" id="desktop-add-subtask-btn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;">Add Subtask</button>
              </div>
            </div>

            <!-- Due Date & Priority Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="task-due" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Due Date
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The target deadline for task completion.</span>
                  </div>
                </label>
                <input type="date" id="task-due" required style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;" />
              </div>

              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label for="task-priority" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Priority
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">The urgency level. High priority tasks are flagged for immediate attention.</span>
                  </div>
                </label>
                <select id="task-priority" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                  <option value="Low">Low Priority</option>
                  <option value="Medium" selected>Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>
            </div>

            <!-- Department Scoping -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-dept" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Department Scoping
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Restrict visibility and assignment to a specific department.</span>
                </div>
              </label>
              <select id="task-dept" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="">General / Tenant Scope</option>
                ${deptOptions}
              </select>
            </div>

            <!-- Recurring Task Options -->
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="task-recurring" style="cursor: pointer; width: 16px; height: 16px;" />
                <label for="task-recurring" class="small-text" style="font-weight: 600; color: var(--text-primary); cursor: pointer; display: flex; align-items: center;">
                  Enable Task Recurrence
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">Automatically generate a new copy of this task when it is completed.</span>
                  </div>
                </label>
              </div>
              
              <div id="recurring-interval-wrapper" style="display: none; flex-direction: column; gap: 6px;">
                <label for="task-interval" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                  Recurrence Interval
                  <div class="tooltip-container">
                    <span class="help-icon">?</span>
                    <span class="tooltip-text">How frequently the task should repeat (e.g., Daily, Weekly).</span>
                  </div>
                </label>
                <select id="task-interval" style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary); color: var(--text-primary); outline: none;">
                  <option value="Daily">Daily</option>
                  <option value="Weekly" selected>Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <!-- Assignee & Workload Awareness Banner -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="task-assignee" class="small-text" style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center;">
                Assignee
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">The team member responsible for executing this task.</span>
                </div>
              </label>
              <select id="task-assignee" required style="padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="" disabled selected>Select an assignee...</option>
                ${assigneeOptions}
              </select>

              <!-- Dynamic Workload Info Block -->
              <div id="workload-banner" style="display: none; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral); margin-top: 6px; font-size: 12px;">
                <!-- Populate dynamically -->
              </div>
            </div>
          </form>
        </div>

        <!-- Action Footer -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-neutral); background-color: var(--bg-secondary); display: flex; gap: 12px; flex-shrink: 0;">
          <button id="submit-task-btn" type="button" class="btn btn-primary" style="flex: 1; justify-content: center; padding: 10px; border: none; font-weight: 600; font-size: 13px;">
            Create Task
          </button>
          <button id="cancel-drawer-btn" type="button" style="flex: 1; padding: 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; color: var(--text-primary); background-color: var(--bg-primary); cursor: pointer; text-align: center;">
            Cancel
          </button>
        </div>
      `;
    }

    this.initListeners();
  }

  initListeners() {
    const form = document.getElementById('drawer-task-form');
    const closeBtn = document.getElementById('close-drawer-btn');
    const cancelBtn = document.getElementById('cancel-drawer-btn');
    const submitBtn = document.getElementById('submit-task-btn');
    
    // Desktop specific elements
    const assigneeSelect = document.getElementById('task-assignee');
    const workloadBanner = document.getElementById('workload-banner');
    const recurringCheckbox = document.getElementById('task-recurring');
    const intervalWrapper = document.getElementById('recurring-interval-wrapper');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    if (recurringCheckbox && intervalWrapper) {
      recurringCheckbox.addEventListener('change', () => {
        intervalWrapper.style.display = recurringCheckbox.checked ? 'flex' : 'none';
      });
    }

    // Workload awareness listener (Desktop)
    if (assigneeSelect && workloadBanner) {
      assigneeSelect.addEventListener('change', () => {
        const selectedId = Number(assigneeSelect.value);
        const user = this.users.find(u => u.id === selectedId);
        
        if (user) {
          const title = user.rank?.title || 'Employee';
          workloadBanner.style.display = 'block';
          workloadBanner.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
          workloadBanner.style.borderColor = 'rgba(37, 99, 235, 0.2)';
          workloadBanner.innerHTML = `
            <strong style="color: var(--text-primary);">Workload awareness:</strong> 
            Assigned to <strong>${user.firstName}</strong> (${title}). 
            Verify availability before assigning critical operations.
          `;
        }
      });
    }

      // Open native date picker when clicking on the input field
      const dueInput = document.getElementById('task-due');
      if (dueInput) {
        dueInput.addEventListener('click', () => {
          try {
            dueInput.showPicker();
          } catch (e) {
            console.warn('showPicker not supported', e);
          }
        });
      }

    // Mobile Custom Selectors
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Priority Pills
      const priorityInput = document.getElementById('task-priority');
      document.querySelectorAll('.mobile-priority-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.mobile-priority-opt').forEach(o => {
            o.classList.remove('active');
            o.style.background = 'var(--sidebar-bg)';
            o.style.color = 'var(--text-secondary)';
          });
          opt.classList.add('active');
          opt.style.background = '#E0E7FF';
          opt.style.color = '#4338CA';
          if (priorityInput) priorityInput.value = opt.dataset.val;
        });
      });

      // Due Date Pills
      const dueInput = document.getElementById('task-due');
      document.querySelectorAll('.mobile-due-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.mobile-due-opt').forEach(o => {
            o.classList.remove('active');
            o.style.background = 'var(--sidebar-bg)';
            o.style.color = 'var(--text-secondary)';
          });
          opt.classList.add('active');
          opt.style.background = '#E0E7FF';
          opt.style.color = '#4338CA';
          
          if (dueInput) {
            const offset = parseInt(opt.dataset.offset, 10);
            const d = new Date();
            d.setDate(d.getDate() + offset);
            dueInput.value = d.toISOString().split('T')[0];
          }
        });
      });

      if (dueInput) {
        dueInput.addEventListener('change', () => {
          document.querySelectorAll('.mobile-due-opt').forEach(o => {
            o.classList.remove('active');
            o.style.background = 'var(--sidebar-bg)';
            o.style.color = 'var(--text-secondary)';
          });
        });
      }

      // Assignee Avatar Scroll
      const assigneeHidden = document.getElementById('task-assignee');
      document.querySelectorAll('.mobile-assignee-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.mobile-assignee-opt > div').forEach(avatar => {
            avatar.style.border = '2px solid transparent';
          });
          opt.firstElementChild.style.border = '2px solid #3B82F6';
          if (assigneeHidden) assigneeHidden.value = opt.dataset.id;
        });
      });
    }

    // Subtasks logic
    const renderSubtasks = () => {
      const listEl = isMobile ? document.getElementById('mobile-subtasks-list') : document.getElementById('desktop-subtasks-list');
      if (!listEl) return;
      listEl.innerHTML = this.subtasks.map((s, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md);">
          <span style="font-size: 13px; color: var(--text-primary);">${escapeHTML(s)}</span>
          <button type="button" data-index="${index}" class="remove-subtask-btn" style="background: none; border: none; color: var(--status-danger); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
      `).join('');

      listEl.querySelectorAll('.remove-subtask-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = Number(e.currentTarget.dataset.index);
          this.subtasks.splice(idx, 1);
          renderSubtasks();
        });
      });
    };

    const addSubtaskBtn = isMobile ? document.getElementById('mobile-add-subtask-btn') : document.getElementById('desktop-add-subtask-btn');
    const newSubtaskInput = isMobile ? document.getElementById('mobile-new-subtask') : document.getElementById('desktop-new-subtask');

    if (addSubtaskBtn && newSubtaskInput) {
      addSubtaskBtn.addEventListener('click', () => {
        const val = newSubtaskInput.value.trim();
        if (val) {
          this.subtasks.push(val);
          newSubtaskInput.value = '';
          renderSubtasks();
        }
      });
      newSubtaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSubtaskBtn.click();
        }
      });
    }

    renderSubtasks();

    submitBtn?.addEventListener('click', () => {
      // Ensure assignee is selected on mobile before submitting
      if (isMobile) {
        const assigneeHidden = document.getElementById('task-assignee');
        if (!assigneeHidden || !assigneeHidden.value) {
          const errorAlert = document.getElementById('drawer-error-alert');
          if (errorAlert) {
            errorAlert.innerText = 'Please assign someone by tapping an avatar.';
            errorAlert.style.display = 'block';
          }
          return;
        }
      }
      form?.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('task-title').value.trim();
      const description = document.getElementById('task-desc').value.trim();
      const dueDate = document.getElementById('task-due').value;
      const priority = document.getElementById('task-priority').value;
      const departmentId = document.getElementById('task-dept').value;
      const assigneeId = document.getElementById('task-assignee').value;
      const isRecurring = recurringCheckbox ? recurringCheckbox.checked : false;
      const recurrenceInterval = isRecurring && document.getElementById('task-interval') ? document.getElementById('task-interval').value : null;

      // Auto-add any pending subtask text that hasn't been added yet
      const isMobile = window.innerWidth <= 768;
      const newSubtaskInput = isMobile ? document.getElementById('mobile-new-subtask') : document.getElementById('desktop-new-subtask');
      if (newSubtaskInput && newSubtaskInput.value.trim()) {
        this.subtasks.push(newSubtaskInput.value.trim());
        newSubtaskInput.value = '';
      }

      const errorAlert = document.getElementById('drawer-error-alert');
      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.innerText = '';
      }

      // Validations
      if (!title || !dueDate || !assigneeId) {
        showError('Please populate all mandatory fields.');
        return;
      }

      if (title.length > 100) {
        showError('Task title cannot exceed 100 characters.');
        return;
      }

      if (description && description.length > 2000) {
        showError('Description cannot exceed 2000 characters.');
        return;
      }

      // Verify date is not in past or too far in future
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selectedDate < today) {
        showError('Due date cannot be set in the past.');
        return;
      }

      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(today.getFullYear() + 10);
      if (selectedDate > tenYearsFromNow) {
        showError('Due date cannot be set further than 10 years in the future.');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Creating...';
        }

        await fetchApi('POST', '/tasks', {
          title,
          description,
          dueDate,
          priority,
          departmentId: departmentId ? Number(departmentId) : null,
          assigneeIds: [Number(assigneeId)],
          isRecurring,
          recurrenceInterval,
          subtasks: this.subtasks,
        });

        Notifications.success('Task Created', 'Task assigned successfully.');
        this.close();
        if (this.onSuccess) {
          this.onSuccess();
        }
      } catch (err) {
        console.error(err);
        showError(err.message || 'Task creation failed.');
        Notifications.error('Task Creation Failed', err.message || 'Check parameters.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Create Task';
        }
      }
    });

    // AI Smart Assist text refinement click listeners
    const aiRefineBtns = this.drawerEl.querySelectorAll('.ai-refine-btn');
    aiRefineBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const type = btn.getAttribute('data-type');
        const input = document.getElementById(targetId);
        if (!input) return;

        const currentText = input.value.trim();
        if (!currentText) {
          Notifications.warn('Input Required', 'Please enter some draft text first before using AI formatting.');
          return;
        }

        const originalHtml = btn.innerHTML;
        try {
          // Show spinner and disable field
          btn.innerHTML = `<svg class="animate-spin" style="animation: spin 1s linear infinite;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;
          btn.disabled = true;
          input.disabled = true;

          const { fetchApi } = await import('../services/api.js');
          const res = await fetchApi('POST', '/ai/refine', { text: currentText, type });
          input.value = res.refinedText;

          // Trigger a beautiful success shimmer highlight on the input
          input.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
          input.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          input.style.borderColor = 'var(--status-success)';
          
          setTimeout(() => {
            input.style.backgroundColor = 'var(--bg-secondary)';
            input.style.borderColor = 'var(--border-neutral)';
          }, 1200);

          Notifications.success('AI Formatted', 'Text formatted and polished successfully.');

        } catch (err) {
          console.error(err);
          Notifications.error('Refinement Failed', err.message || 'Could not contact the AI service.');
        } finally {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          input.disabled = false;
        }
      });
    });

    function showError(msg) {
      const errorAlert = document.getElementById('drawer-error-alert');
      if (errorAlert) {
        errorAlert.innerText = msg;
        errorAlert.style.display = 'block';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  open() {
    this.render().then(() => {
      this.overlayEl.style.pointerEvents = 'auto';
      this.overlayEl.style.opacity = '1';
      this.drawerEl.classList.add('open');
    });
  }

  close() {
    if (this.overlayEl) {
      this.overlayEl.style.opacity = '0';
      this.overlayEl.style.pointerEvents = 'none';
    }
    if (this.drawerEl) {
      this.drawerEl.classList.remove('open');
    }
  }
}
