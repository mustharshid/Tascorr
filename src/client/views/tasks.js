// tasks.js - Task Workspace View implementing split-pane layout and dynamic work execution.
// Aligned with Section 6.3 and Section 7.3 specifications.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';
import { TaskCreateDrawer } from './task-create-modal.js';
import { escapeHTML } from '../services/sanitize.js';

let allTasks = [];
let selectedTask = null;
let createDrawer = null;
let allUsers = [];

export function renderTasksView() {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px; height: calc(100vh - var(--header-height) - 64px); overflow: hidden;">
      <!-- Title & Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div>
          <h1 class="page-title" style="font-size: 28px;">Tasks</h1>
          <p class="body-text">Manage, delegate, track work items and dependencies.</p>
        </div>
        <button id="workspace-create-task-btn" class="menu-item active" style="padding: 10px 18px; border-radius: var(--radius-md); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Task
        </button>
      </div>

      <!-- High-Density Split Workspace Engine -->
      <div id="tasks-workspace-container" style="display: flex; gap: 24px; flex: 1; overflow: hidden; min-height: 0;">
        <!-- Left Side: Task List Master Pane -->
        <div id="tasks-master-pane" style="flex: 1; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden;">
          <!-- Search & Filter Controls -->
          <div style="padding: 16px; border-bottom: 1px solid var(--border-neutral); display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap;">
            <input type="text" id="task-search-input" placeholder="Search tasks, descriptions..." style="flex: 1; min-width: 150px; padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);" />
            <select id="task-status-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
            <select id="task-priority-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary);">
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <!-- Task List Items -->
          <div id="task-items-container" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column;">
            <div style="padding: 24px; text-align: center; color: var(--text-secondary);">Loading tasks...</div>
          </div>
        </div>

        <!-- Right Side: Task Detail Action Pane -->
        <div id="task-details-container" style="width: 480px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
          <div style="padding: 32px; text-align: center; color: var(--text-secondary); margin: auto;">
            Select a task item to view full operational details.
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize listeners and load live tasks
 */
export async function initTasksListeners() {
  const container = document.getElementById('task-items-container');
  if (!container) return;

  // Cache user list for reassignments
  try {
    const uData = await fetchApi('GET', '/users');
    allUsers = uData.users || [];
  } catch (err) {
    console.error(err);
  }

  // Hook Create Task Drawer
  createDrawer = new TaskCreateDrawer(() => {
    loadTasks();
  });
  
  const createBtn = document.getElementById('workspace-create-task-btn');
  createBtn?.addEventListener('click', () => {
    createDrawer.open();
  });

  // Filter listeners
  const searchInput = document.getElementById('task-search-input');
  const statusFilter = document.getElementById('task-status-filter');
  const priorityFilter = document.getElementById('task-priority-filter');

  [searchInput, statusFilter, priorityFilter].forEach(el => {
    el?.addEventListener('input', () => {
      renderTaskList();
    });
  });

  await loadTasks();
}

/**
 * Load tasks from server
 */
async function loadTasks() {
  const container = document.getElementById('task-items-container');
  if (!container) return;

  try {
    const data = await fetchApi('GET', '/tasks');
    allTasks = data.tasks || [];
    renderTaskList();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--status-danger);">Error fetching tasks: ${err.message}</div>`;
  }
}

/**
 * Render list based on filters
 */
function renderTaskList() {
  const container = document.getElementById('task-items-container');
  if (!container) return;

  const query = document.getElementById('task-search-input')?.value.toLowerCase() || '';
  const status = document.getElementById('task-status-filter')?.value || 'ALL';
  const priority = document.getElementById('task-priority-filter')?.value || 'ALL';

  const filtered = allTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
    const matchesStatus = status === 'ALL' || t.status === status;
    const matchesPriority = priority === 'ALL' || t.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 48px 24px; text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <p class="body-text" style="font-weight: 600;">No tasks found.</p>
        <p class="small-text">Clear filters or create a new task workspace.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isSelected = selectedTask && selectedTask.id === t.id;
    const bg = isSelected ? 'var(--bg-tertiary)' : 'transparent';
    const borderLeft = isSelected ? '4px solid var(--accent-navy-primary)' : '4px solid transparent';
    
    // Status colors
    const statusMap = {
      'Pending': 'status-info',
      'In Progress': 'status-info',
      'Blocked': 'status-danger',
      'Under Review': 'status-warning',
      'Completed': 'status-success'
    };
    const statusClass = statusMap[t.status] || 'status-info';
    
    // Priority badge
    const priorityMap = {
      'Critical': 'status-danger',
      'High': 'status-warning',
      'Medium': 'status-info',
      'Low': 'status-success'
    };
    const priorityClass = priorityMap[t.priority] || 'status-info';
    
    const assigneeName = t.assignments?.length > 0 
      ? `${t.assignments[0].user.firstName} ${t.assignments[0].user.lastName}` 
      : 'Unassigned';
    const assigneeId = t.assignments?.length > 0 ? t.assignments[0].userId : null;
    const assigneeInitial = assigneeName !== 'Unassigned' ? t.assignments[0].user.firstName[0] : '?';

    return `
      <div class="task-list-item" data-id="${t.id}" style="padding: 16px; border-bottom: 1px solid var(--border-neutral); cursor: pointer; background-color: ${bg}; border-left: ${borderLeft}; display: flex; flex-direction: column; gap: 8px; transition: background-color 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="small-text" style="font-weight: 600;">TASK-#${t.id}</span>
          <span class="pill-badge ${statusClass}"><span class="badge-dot"></span>${escapeHTML(t.status)}</span>
        </div>
        <h4 class="card-title" style="font-size: 15px; font-weight: 600; line-height: 1.3;">${escapeHTML(t.title)}</h4>
        <p class="body-text" style="font-size: 12px; max-height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapeHTML(t.description)}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            ${assigneeId ? `
              <img src="/avatars/user-${assigneeId}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;">${escapeHTML(assigneeInitial)}</div>
            ` : ''}
            <span class="small-text">Assignee: <strong>${escapeHTML(assigneeName)}</strong></span>
          </div>
          <span class="pill-badge ${priorityClass}" style="padding: 2px 6px; font-size: 10px;">${escapeHTML(t.priority)}</span>
        </div>
        <div style="margin-top: 4px; border-top: 1px dashed var(--border-neutral); padding-top: 6px;">
          <span class="small-text" style="color: var(--text-secondary); font-size: 10px;">
            Assigned by ${t.creator ? escapeHTML(t.creator.firstName + ' ' + t.creator.lastName) : 'System'} on ${new Date(t.createdAt).toLocaleDateString()} at ${new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners
  container.querySelectorAll('.task-list-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = Number(item.dataset.id);
      await loadTaskDetails(id);
      const ws = document.getElementById('tasks-workspace-container');
      if (ws) {
        ws.classList.add('task-selected');
      }
      renderTaskList(); // re-render to update selected indicator highlight
    });
  });
}

/**
 * Fetch specific task details and build details panel
 */
async function loadTaskDetails(id) {
  const panel = document.getElementById('task-details-container');
  if (!panel) return;

  panel.innerHTML = `<div style="margin: auto; color: var(--text-secondary);">Loading task details...</div>`;

  try {
    const data = await fetchApi('GET', `/tasks/${id}`);
    selectedTask = data.task;
    
    const t = selectedTask;

    const statusMap = {
      'Pending': 'status-info',
      'In Progress': 'status-info',
      'Blocked': 'status-danger',
      'Under Review': 'status-warning',
      'Completed': 'status-success'
    };
    const statusClass = statusMap[t.status] || 'status-info';
    const activeAssignee = t.assignments?.find(a => a.isActive);
    const assigneeName = activeAssignee 
      ? `${activeAssignee.user.firstName} ${activeAssignee.user.lastName}` 
      : 'Unassigned';
    const assigneeId = activeAssignee ? activeAssignee.userId : null;
    const assigneeInitial = activeAssignee ? activeAssignee.user.firstName[0] : '?';

    // Check permissions (lower rank level means higher authority)
    const isAdmin = AuthState.isAdmin();
    const isCreator = t.createdById === AuthState.currentUser?.id;
    const isAssignee = activeAssignee && activeAssignee.userId === AuthState.currentUser?.id;
    
    // Check resolve blocker privilege (creator, deptHead, or admin)
    const canResolveBlocker = isAdmin || isCreator;

    // Build Subtask lists
    const subtaskHtml = t.subtasks?.length > 0 
      ? t.subtasks.map(s => {
          const checked = s.status === 'Completed' ? 'checked' : '';
          const lineThrough = s.status === 'Completed' ? 'text-decoration: line-through; color: var(--text-secondary);' : '';
          return `
            <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; ${lineThrough}">
              <input type="checkbox" class="subtask-chk" data-sid="${s.id}" ${checked} style="accent-color: var(--accent-navy-primary);" />
              <span>${escapeHTML(s.title)}</span>
            </label>
          `;
        }).join('')
      : `<p class="small-text" style="color: var(--text-secondary);">No subtask checklist items defined.</p>`;

    // Build Assignment Audit Trails
    const activeBlocker = t.blockers?.find(b => !b.resolvedAt);
    
    // Actions block: 
    // If completed, terminal! Cannot update status anymore.
    const isCompleted = t.status === 'Completed';

    // Check if user is department head
    const isDeptHead = AuthState.currentUser?.rankLevel <= 4 && AuthState.currentUser?.rankLevel > 0;
    const canComplete = isCreator || isAdmin || isDeptHead;

    let actionButtons = '';
    if (!isCompleted) {
      if (isAssignee || canComplete) {
        // Status toggle options
        actionButtons += `
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
            <label class="small-text" style="font-weight:600;">Update Task Status</label>
            <select id="task-status-update" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-primary);">
              <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Under Review" ${t.status === 'Under Review' ? 'selected' : ''}>${canComplete ? 'Under Review' : 'Request Completion (Under Review)'}</option>
              ${canComplete ? `<option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed (Close Task)</option>` : ''}
            </select>
          </div>
        `;
      }

      if (isAssignee && !activeBlocker) {
        actionButtons += `
          <button id="flag-blocker-btn" style="padding: 10px; background-color: transparent; border: 1px solid var(--status-danger); color: var(--status-danger); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:var(--status-danger);"></span> Flag Blocker
          </button>
        `;
      }

      if (isCreator || isAdmin) {
        actionButtons += `
          <button id="reassign-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Reassign Task
          </button>
          <button id="edit-task-btn" style="padding: 10px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-weight: 600; cursor: pointer; font-size: 13px;">
            Edit Task
          </button>
        `;
      }
    }

    panel.innerHTML = `
      <!-- ================== DESKTOP ================== -->
      <div class="desktop-only" style="display:flex; flex-direction:column; height:100%; width: 100%;">
        <!-- Detail Header -->
      <div style="padding: 24px; border-bottom: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 12px; flex-shrink: 0;">
        <button id="task-detail-back-btn" class="btn btn-secondary" style="display: none; align-items: center; gap: 6px; width: fit-content; margin-bottom: 8px; font-size: 12px; padding: 6px 12px; height: 32px; min-height: 32px;">
          &larr; Back to Tasks
        </button>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="data-number" style="color: var(--text-secondary); font-size: 13px;">TASK-#${t.id}</span>
          <span class="pill-badge ${statusClass}"><span class="badge-dot"></span>${escapeHTML(t.status)}</span>
        </div>
        <h2 class="section-title" style="font-size: 20px; line-height: 1.3;">${escapeHTML(t.title)}</h2>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <div class="pill-badge status-info" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px;">
            ${assigneeId ? `
              <img src="/avatars/user-${assigneeId}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:16px;height:16px;border-radius:50%;object-fit:cover;" />
              <div style="width:16px;height:16px;border-radius:50%;background:var(--accent-navy-primary);color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:bold;margin-left:-2px;">${escapeHTML(assigneeInitial)}</div>
            ` : ''}
            Assigned to: ${escapeHTML(assigneeName)}
          </div>
          <div class="pill-badge" style="font-size: 11px; display: flex; align-items: center; gap: 6px; padding-left: 6px; background-color: var(--bg-secondary); border: 1px solid var(--border-neutral); color: var(--text-secondary);">
            Assigned by: ${t.creator ? escapeHTML(t.creator.firstName + ' ' + t.creator.lastName) : 'System'}
          </div>
          <div class="pill-badge status-danger" style="font-size: 11px;">${escapeHTML(t.priority)} Priority</div>
          <div class="pill-badge status-warning" style="font-size: 11px;">Due: ${new Date(t.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      <!-- Detail Contents -->
      <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px;">
        <!-- Blocker warning banner -->
        ${activeBlocker ? `
          <div style="padding: 16px; background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--status-danger); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
            <strong class="data-number" style="color: var(--status-danger);">Task is Blocked</strong>
            <p class="small-text" style="color: var(--text-primary); margin:0;">${escapeHTML(activeBlocker.description)}</p>
            ${canResolveBlocker ? `
              <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="blocker-resolution-text" placeholder="Mandatory resolution comment..." style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 12px;" />
                <button id="resolve-blocker-btn" data-bid="${activeBlocker.id}" style="padding: 6px 12px; background-color: var(--status-success); color:#fff; border:none; border-radius:var(--radius-md); font-weight:600; font-size:12px; cursor:pointer;">Resolve Blocker</button>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Description -->
        <div>
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--text-secondary);">Description</h4>
          <p class="body-text" style="color: var(--text-primary);">${escapeHTML(t.description)}</p>
        </div>

        <!-- Subtasks Block -->
        <div>
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; color: var(--text-secondary);">Subtasks Checklist</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${subtaskHtml}
          </div>
        </div>

        <!-- Blocker Reporting form (hidden by default) -->
        <div id="blocker-report-form" style="display: none; padding: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); flex-direction: column; gap: 8px;">
          <h4 class="small-text" style="font-weight: 600;">Flag Operational Blocker</h4>
          <textarea id="blocker-desc" placeholder="Explain the dependency blocker clearly..." rows="3" style="width:100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px;"></textarea>
          <div style="display: flex; gap: 8px;">
            <button id="submit-blocker-btn" style="padding: 6px 12px; background-color: var(--status-danger); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer;">Submit Report</button>
            <button id="cancel-blocker-btn" style="padding: 6px 12px; background-color: transparent; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); cursor:pointer;">Cancel</button>
          </div>
        </div>

        <!-- Reassignment form (hidden by default) -->
        <div id="reassignment-form" style="display: none; padding: 16px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); background-color: var(--bg-secondary); flex-direction: column; gap: 8px;">
          <h4 class="small-text" style="font-weight: 600;">Reassign Workforce Scope</h4>
          
          <select id="reassign-user" style="width:100%; padding: 8px 10px; border:1px solid var(--border-neutral); border-radius: var(--radius-md);">
            <option value="" disabled selected>Select new assignee...</option>
            ${allUsers.map(u => `<option value="${u.id}">${u.firstName} ${u.lastName}</option>`).join('')}
          </select>
          <input type="text" id="reassign-reason" placeholder="Mandatory reason..." style="width:100%; padding: 8px 10px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px;" />
          <div style="display: flex; gap: 8px;">
            <button id="submit-reassign-btn" style="padding: 6px 12px; background-color: var(--accent-navy-primary); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer;">Assign User</button>
            <button id="cancel-reassign-btn" style="padding: 6px 12px; background-color: transparent; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); cursor:pointer;">Cancel</button>
          </div>
        </div>

        <!-- Comments & Activity Threads -->
        <div style="border-top: 1px solid var(--border-neutral); padding-top: 16px;">
          <h4 class="small-text" style="font-weight: 600; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; color: var(--text-secondary);">Operational Activity & Comments</h4>
          
          <!-- Comments List -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; max-height: 200px; overflow-y: auto;">
            ${t.comments?.length > 0 
              ? t.comments.map(c => `
                  <div style="background-color: var(--bg-secondary); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span class="small-text" style="font-weight: 600; color: var(--text-primary);">${c.author ? escapeHTML(c.author.firstName + ' ' + c.author.lastName) : 'Unknown User'}</span>
                      <span class="small-text" style="font-size:10px;">${new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="body-text" style="font-size: 12px; color: var(--text-primary); margin:0;">${escapeHTML(c.content)}</p>
                  </div>
                `).join('')
              : `<p class="small-text" style="color: var(--text-secondary); text-align: center; padding: 12px 0;">No logs or comments posted.</p>`}
          </div>

          <!-- Add comment input -->
          <div style="display: flex; gap: 8px;">
            <input type="text" id="new-comment-text" placeholder="Add detailed comment note..." style="flex:1; padding: 8px 12px; border:1px solid var(--border-neutral); border-radius: var(--radius-md); font-size:12px; outline:none;" />
            <button id="submit-comment-btn" style="padding: 8px 16px; background-color: var(--accent-navy-primary); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; font-size:12px; cursor:pointer;">Send</button>
          </div>
        </div>
      </div>

      <!-- Action Buttons Footer -->
      <div style="padding: 16px 24px; border-top: 1px solid var(--border-neutral); background-color: var(--bg-secondary); display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap;">
        ${actionButtons}
      </div>
      </div>

      <!-- ================== MOBILE BOTTOM SHEET ================== -->
      <div class="mobile-only" style="display:flex; flex-direction:column; height:100%; width: 100%; background: #fff; padding: 24px; padding-bottom: 0; position: relative; border-radius: 32px 32px 0 0;">
        <!-- Drag Handle -->
        <div style="width: 48px; height: 5px; background: #E5E7EB; border-radius: 3px; margin: 0 auto 20px auto; flex-shrink: 0;"></div>
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-shrink: 0;">
          <div style="background: #F3F4F6; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #4B5563; display: flex; align-items: center; gap: 6px;">
            <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: #EF4444;"></span> ${escapeHTML(t.status)}
          </div>
          <button id="mobile-task-detail-close" style="background: #F3F4F6; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px; line-height: 1.2; flex-shrink: 0;">${escapeHTML(t.title)}</h2>
        <p style="font-size: 14px; color: #6B7280; line-height: 1.5; margin-bottom: 24px; flex-shrink: 0;">${escapeHTML(t.description)}</p>

        <!-- Info Cards -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-shrink: 0;">
          <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px;">
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">Project</div>
            <div style="font-size: 13px; font-weight: 600; color: #111827;">General</div>
          </div>
          <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px;">
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">Priority</div>
            <div style="font-size: 13px; font-weight: 600; color: #DC2626;">${escapeHTML(t.priority)}</div>
          </div>
          <div style="flex: 1; border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px;">
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">Due</div>
            <div style="font-size: 13px; font-weight: 600; color: #111827;">Today</div>
          </div>
        </div>

        <!-- Assigned To -->
        <div style="background: #F9FAFB; border-radius: 16px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-shrink: 0;">
          ${assigneeId ? `<img src="/avatars/user-${assigneeId}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />` : ''}
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #E5E7EB; color: #111827; display: ${assigneeId ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">${escapeHTML(assigneeInitial)}</div>
          <div>
            <div style="font-size: 10px; color: #6B7280; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Assigned to</div>
            <div style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHTML(assigneeName)}</div>
          </div>
        </div>

        <!-- Subtasks -->
        <div style="flex: 1; overflow-y: auto; padding-bottom: 100px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px;">Subtasks</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${t.subtasks?.length > 0 ? t.subtasks.map(s => {
              const isDone = s.status === 'Completed';
              return `
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="mobile-subtask-toggle" data-sid="${s.id}" data-done="${isDone}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isDone ? '#3B82F6' : '#D1D5DB'}; background: ${isDone ? '#3B82F6' : 'transparent'}; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    ${isDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                  </div>
                  <span style="font-size: 14px; color: ${isDone ? '#9CA3AF' : '#111827'}; text-decoration: ${isDone ? 'line-through' : 'none'};">${escapeHTML(s.title)}</span>
                </div>
              `;
            }).join('') : `<p style="font-size: 13px; color: #6B7280;">No subtasks.</p>`}
          </div>
        </div>

        <!-- Fixed Bottom Button -->
        ${!isCompleted ? `
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 16px 24px; background: linear-gradient(to top, rgba(255,255,255,1) 80%, rgba(255,255,255,0)); border-radius: 0 0 32px 32px;">
            <button id="mobile-mark-complete-btn" style="width: 100%; background: #3B82F6; color: white; padding: 16px; border: none; border-radius: 100px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
              Mark as Complete
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Edit task modal form
    const editTaskModal = `
      <div id="edit-task-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:9999; align-items:center; justify-content:center;">
        <div class="widget-card" style="width:100%; max-width:500px; padding:24px; display:flex; flex-direction:column; gap:16px;">
          <h3 class="card-title">Edit Task</h3>
          <div class="form-group">
            <label class="small-text">Task Title</label>
            <input type="text" id="edit-task-title" value="${escapeHTML(t.title)}" class="tascorr-input" />
          </div>
          <div class="form-group">
            <label class="small-text">Description</label>
            <textarea id="edit-task-desc" class="tascorr-input" rows="4">${escapeHTML(t.description)}</textarea>
          </div>
          <div class="form-group" style="display:flex; gap:12px;">
            <div style="flex:1;">
              <label class="small-text">Due Date</label>
              <input type="date" id="edit-task-due" value="${new Date(t.dueDate).toISOString().split('T')[0]}" class="tascorr-input" />
            </div>
            <div style="flex:1;">
              <label class="small-text">Priority</label>
              <select id="edit-task-priority" class="tascorr-input">
                <option value="Low" ${t.priority === 'Low' ? 'selected' : ''}>Low</option>
                <option value="Medium" ${t.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="High" ${t.priority === 'High' ? 'selected' : ''}>High</option>
                <option value="Critical" ${t.priority === 'Critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
            <button id="cancel-edit-task" class="btn btn-secondary">Cancel</button>
            <button id="save-edit-task" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    panel.innerHTML += editTaskModal;

    // Slide up animation for mobile
    setTimeout(() => {
      const mobilePanel = panel.querySelector('.mobile-only');
      if (mobilePanel) {
        mobilePanel.style.transform = 'translateY(100%)';
        // Force reflow
        void mobilePanel.offsetWidth;
        mobilePanel.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        mobilePanel.style.transform = 'translateY(0)';
      }
    }, 10);
    
    setupDetailListeners(t);
  } catch (err) {
    console.error(err);
    panel.innerHTML = `<div style="margin: auto; color: var(--status-danger);">Failed to fetch task details: ${err.message}</div>`;
  }
}

/**
 * Hook action listeners in detail pane
 */
function setupDetailListeners(t) {
  // Mobile Back/Close Button
  document.getElementById('mobile-task-detail-close')?.addEventListener('click', () => {
    const ws = document.getElementById('tasks-workspace-container');
    if (ws) {
      ws.classList.remove('task-selected');
    }
  });
  document.getElementById('task-detail-back-btn')?.addEventListener('click', () => {
    const ws = document.getElementById('tasks-workspace-container');
    if (ws) {
      ws.classList.remove('task-selected');
    }
  });

  // Mobile Complete Button
  document.getElementById('mobile-mark-complete-btn')?.addEventListener('click', async () => {
    try {
      await fetchApi('PATCH', `/tasks/${t.id}/status`, { status: 'Completed' });
      // update all subtasks to completed
      if (t.subtasks && t.subtasks.length > 0) {
        for (const sub of t.subtasks) {
          if (sub.status !== 'Completed') {
            await fetchApi('PATCH', `/tasks/${t.id}/subtasks/${sub.id}`, { status: 'Completed' });
          }
        }
      }
      loadTaskDetails(t.id);
      renderTaskList();
    } catch (e) {
      alert(e.message);
    }
  });

  // 1. Status Update selector
  const statusSelect = document.getElementById('task-status-update');
  statusSelect?.addEventListener('change', async () => {
    const val = statusSelect.value;
    try {
      await fetchApi('PATCH', `/tasks/${t.id}/status`, { status: val });
      Notifications.success('Status Updated', `Task set to ${val}.`);
      await loadTaskDetails(t.id);
      loadTasks();
    } catch (err) {
      Notifications.error('Update Failed', err.message);
      statusSelect.value = t.status; // restore
    }
  });

  // 2. Subtasks Checkboxes
  document.querySelectorAll('.subtask-chk').forEach(chk => {
    chk.addEventListener('change', async () => {
      const sid = Number(chk.dataset.sid);
      const isChecked = chk.checked;
      const val = isChecked ? 'Completed' : 'Pending';
      try {
        await fetchApi('PATCH', `/tasks/${t.id}/subtasks/${sid}`, { status: val });
        Notifications.success('Subtask Updated', `Subtask marked as ${val}.`);
        await loadTaskDetails(t.id);
      } catch (err) {
        Notifications.error('Update Failed', err.message);
        chk.checked = !isChecked; // restore
      }
    });
  });

  // 3. Flag Blocker forms
  const flagBtn = document.getElementById('flag-blocker-btn');
  const blockerForm = document.getElementById('blocker-report-form');
  const submitBlocker = document.getElementById('submit-blocker-btn');
  const cancelBlocker = document.getElementById('cancel-blocker-btn');

  flagBtn?.addEventListener('click', () => {
    blockerForm.style.display = 'flex';
  });

  cancelBlocker?.addEventListener('click', () => {
    blockerForm.style.display = 'none';
  });

  submitBlocker?.addEventListener('click', async () => {
    const desc = document.getElementById('blocker-desc').value.trim();
    if (!desc) {
      Notifications.warning('Validation Check', 'Blocker explanation content is mandatory.');
      return;
    }
    try {
      await fetchApi('POST', `/tasks/${t.id}/blockers`, { description: desc });
      Notifications.success('Blocker Logged', 'Task flagged as blocked.');
      await loadTaskDetails(t.id);
      loadTasks();
    } catch (err) {
      Notifications.error('Submission Failed', err.message);
    }
  });

  // 4. Resolve Blocker
  const resolveBtn = document.getElementById('resolve-blocker-btn');
  resolveBtn?.addEventListener('click', async () => {
    const bid = Number(resolveBtn.dataset.bid);
    const comment = document.getElementById('blocker-resolution-text')?.value?.trim();
    if (!comment) {
      Notifications.warning('Validation', 'Resolution comment is mandatory.');
      return;
    }
    try {
      await fetchApi('PATCH', `/tasks/${t.id}/blockers/${bid}/resolve`, { resolutionComment: comment });
      Notifications.success('Blocker Resolved', 'Task is back in progress.');
      await loadTaskDetails(t.id);
      loadTasks();
    } catch (err) {
      Notifications.error('Resolution Failed', err.message);
    }
  });

  // 5. Edit Task
  const editTaskBtn = document.getElementById('edit-task-btn');
  const editTaskModal = document.getElementById('edit-task-modal');
  const cancelEditBtn = document.getElementById('cancel-edit-task');
  const saveEditBtn = document.getElementById('save-edit-task');

  editTaskBtn?.addEventListener('click', () => {
    editTaskModal.style.display = 'flex';
  });

  cancelEditBtn?.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
  });

  saveEditBtn?.addEventListener('click', async () => {
    const title = document.getElementById('edit-task-title').value.trim();
    const desc = document.getElementById('edit-task-desc').value.trim();
    const due = document.getElementById('edit-task-due').value;
    const priority = document.getElementById('edit-task-priority').value;

    if (!title || !desc || !due) {
      Notifications.warning('Validation Check', 'Title, description, and due date are mandatory.');
      return;
    }

    try {
      await fetchApi('PATCH', `/tasks/${t.id}`, { title, description: desc, dueDate: due, priority });
      Notifications.success('Task Updated', 'Task details have been successfully modified.');
      editTaskModal.style.display = 'none';
      await loadTaskDetails(t.id);
      loadTasks();
    } catch (err) {
      Notifications.error('Update Failed', err.message);
    }
  });

  // 6. Reassign Form
  const reassignBtn = document.getElementById('reassign-task-btn');
  const reassignmentForm = document.getElementById('reassignment-form');
  const submitReassign = document.getElementById('submit-reassign-btn');
  const cancelReassign = document.getElementById('cancel-reassign-btn');

  reassignBtn?.addEventListener('click', () => {
    reassignmentForm.style.display = 'flex';
  });

  cancelReassign?.addEventListener('click', () => {
    reassignmentForm.style.display = 'none';
  });

  submitReassign?.addEventListener('click', async () => {
    const targetId = document.getElementById('reassign-user').value;
    const reason = document.getElementById('reassign-reason').value.trim();

    if (!targetId || !reason) {
      Notifications.warning('Validation Check', 'New assignee selection and reason parameters are mandatory.');
      return;
    }

    try {
      await fetchApi('POST', `/tasks/${t.id}/reassign`, {
        targetAssigneeId: Number(targetId),
        reason
      });
      Notifications.success('Task Delegated', 'Assignee reassignment completed successfully.');
      await loadTaskDetails(t.id);
      loadTasks();
    } catch (err) {
      Notifications.error('Reassignment Failed', err.message);
    }
  });

  // 6. Comments
  const submitCommentBtn = document.getElementById('submit-comment-btn');
  submitCommentBtn?.addEventListener('click', async () => {
    const text = document.getElementById('new-comment-text').value.trim();
    if (!text) return;
    try {
      await fetchApi('POST', `/tasks/${t.id}/comments`, { content: text });
      Notifications.success('Comment Posted', 'Your message has been appended.');
      await loadTaskDetails(t.id);
    } catch (err) {
      Notifications.error('Send Failed', err.message);
    }
  });
}
