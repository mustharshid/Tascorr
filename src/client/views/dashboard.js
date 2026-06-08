// dashboard.js - Executive Dashboard live view renderer and data orchestrator.
// Conforms to Section 6.2 Executive Dashboard visual specifications.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';

export function renderDashboardView() {
  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1600px; margin: 0 auto;">
      <!-- Page Title -->
      <div>
        <h1 class="page-title">Executive Dashboard</h1>
        <p class="body-text" style="margin-top: 8px;">Real-time organizational health assessment at a glance.</p>
      </div>

      <!-- Loading skeleton -->
      <div id="dashboard-loading" style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
          ${Array(4).fill(0).map(() => `
            <div class="widget-card" style="height: 120px; background-color: var(--bg-primary); display: flex; flex-direction: column; gap: 12px;">
              <div style="width: 40%; height: 16px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm);"></div>
              <div style="width: 25%; height: 32px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm);"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Live Dashboard Content Container -->
      <div id="dashboard-content" style="display: none; flex-direction: column; gap: 32px;">
        <!-- TOP ROW: Summary Metrics -->
        <div class="dashboard-grid" id="dashboard-metrics-grid">
          <!-- Populated dynamically -->
        </div>

        <!-- SECOND ROW: Analytics & Activity -->
        <div class="dashboard-grid">
          <!-- Team Workload Allocation -->
          <div class="grid-col-6 widget-card" style="display: flex; flex-direction: column;">
            <h3 class="card-title" style="margin-bottom: 16px;">Team Workload Allocation</h3>
            <div id="workload-list" style="display: flex; flex-direction: column; gap: 16px; flex: 1;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Departmental Activity -->
          <div class="grid-col-6 widget-card">
            <h3 class="card-title" style="margin-bottom: 16px;">Departmental Productivity Index</h3>
            <div id="departmental-list" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- THIRD ROW: Recent Logs & Notifications -->
        <div class="dashboard-grid">
          <!-- Recent Task Activity Log -->
          <div class="grid-col-8 widget-card">
            <h3 class="card-title" style="margin-bottom: 16px;">Recent Organizational Activity</h3>
            <div id="activity-log-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Notification Matrix -->
          <div class="grid-col-4 widget-card">
            <h3 class="card-title" style="margin-bottom: 16px;">Notification Matrix</h3>
            <div id="notifications-list" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Fetch and mount live data on dashboard view init
 */
export async function initDashboard() {
  const loadingEl = document.getElementById('dashboard-loading');
  const contentEl = document.getElementById('dashboard-content');
  if (!contentEl) return;

  try {
    // Parallel fetches for performance
    const [tasksRes, usersRes, deptsRes, notificationsRes] = await Promise.all([
      fetchApi('GET', '/tasks'),
      fetchApi('GET', '/users'),
      fetchApi('GET', '/departments'),
      fetchApi('GET', '/notifications').catch(() => ({ notifications: [] })) // Safe fallback if route errors
    ]);

    const tasks = tasksRes.tasks || [];
    const users = usersRes.users || [];
    const departments = deptsRes.departments || [];
    const notifications = notificationsRes.notifications || [];

    // Compute metrics
    const today = new Date();
    today.setHours(0,0,0,0);

    const attentionTasks = tasks.filter(t => t.status === 'Blocked' || t.status === 'Under Review');
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < today);
    const pendingApprovals = tasks.filter(t => t.status === 'Under Review');
    
    // WTD Completed (within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completedWtd = tasks.filter(t => t.status === 'Completed' && new Date(t.updatedAt) >= sevenDaysAgo);

    // 1. Mount Top Row Metrics
    const metricsGrid = document.getElementById('dashboard-metrics-grid');
    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Attention Required</span>
            <div class="pill-badge ${attentionTasks.length > 0 ? 'status-danger' : 'status-success'}">
              <span class="badge-dot"></span>${attentionTasks.length > 0 ? 'Action Needed' : 'Healthy'}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${attentionTasks.length}</div>
          <p class="small-text" style="margin-top: 8px;">Blocked or Under Review task items</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Overdue Tasks</span>
            <div class="pill-badge ${overdueTasks.length > 0 ? 'status-danger' : 'status-success'}">
              <span class="badge-dot"></span>${overdueTasks.length > 0 ? 'Overdue' : 'On Track'}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${overdueTasks.length}</div>
          <p class="small-text" style="margin-top: 8px;">Active tasks past target due dates</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Pending Approvals</span>
            <div class="pill-badge ${pendingApprovals.length > 0 ? 'status-warning' : 'status-success'}">
              <span class="badge-dot"></span>${pendingApprovals.length > 0 ? 'Awaiting Action' : 'Clear'}
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${pendingApprovals.length}</div>
          <p class="small-text" style="margin-top: 8px;">Tasks awaiting manager authorization</p>
        </div>

        <div class="grid-col-3 widget-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Completed (WTD)</span>
            <div class="pill-badge status-success">
              <span class="badge-dot"></span>Completed
            </div>
          </div>
          <div class="page-title" style="font-size: 36px; line-height: 1.1;">${completedWtd.length}</div>
          <p class="small-text" style="margin-top: 8px;">Work closed within the last 7 days</p>
        </div>
      `;
    }

    // 2. Mount Team Workload Allocation
    const workloadList = document.getElementById('workload-list');
    if (workloadList) {
      if (users.length === 0) {
        workloadList.innerHTML = `<p class="small-text" style="padding: 16px 0; text-align: center;">No team members registered.</p>`;
      } else {
        // Compute workloads: count active tasks per user
        const workloadMap = {};
        users.forEach(u => { workloadMap[u.id] = { user: u, count: 0, blocked: 0 }; });

        tasks.forEach(t => {
          if (t.status !== 'Completed') {
            t.assignments?.forEach(a => {
              if (a.isActive && workloadMap[a.userId]) {
                workloadMap[a.userId].count++;
                if (t.status === 'Blocked') {
                  workloadMap[a.userId].blocked++;
                }
              }
            });
          }
        });

        // Convert to array and render
        const workloadData = Object.values(workloadMap);
        workloadList.innerHTML = workloadData.slice(0, 5).map(item => {
          const u = item.user;
          const pct = Math.min((item.count / 10) * 100, 100);
          const isOverloaded = item.count >= 10;
          const barColor = isOverloaded ? 'var(--status-danger)' : 'var(--accent-navy-primary)';
          
          return `
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="data-number" style="font-size: 13px;">${u.firstName} ${u.lastName} (${u.rank?.title || 'Employee'})</span>
                <span class="small-text">${item.count} active, ${item.blocked} blocked ${isOverloaded ? '<span style="color: var(--status-danger); font-weight: 600;">(Overloaded)</span>' : ''}</span>
              </div>
              <div style="height: 6px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background-color: ${barColor}; border-radius: var(--radius-sm); transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Mount Departmental Activity
    const deptList = document.getElementById('departmental-list');
    if (deptList) {
      if (departments.length === 0) {
        deptList.innerHTML = `<p class="small-text" style="padding: 16px 0; text-align: center;">No department nodes configured.</p>`;
      } else {
        deptList.innerHTML = departments.map(d => {
          const deptTasks = tasks.filter(t => t.departmentId === d.id);
          const completedCount = deptTasks.filter(t => t.status === 'Completed').length;
          const slaScore = deptTasks.length > 0 ? Math.round((completedCount / deptTasks.length) * 100) : 100;
          const isAlert = slaScore < 80;
          const badgeClass = isAlert ? 'status-warning' : 'status-success';

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <span class="data-number" style="font-size: 13px;">${d.name}</span>
              <span class="pill-badge ${badgeClass}"><span class="badge-dot"></span>${slaScore}% SLA score</span>
            </div>
          `;
        }).join('');
      }
    }

    // 4. Mount Recent Organizational Activity (Compute simple change logs from tasks)
    const activityList = document.getElementById('activity-log-list');
    if (activityList) {
      // Find all blockers, status updates, or task assignments
      const logs = [];
      tasks.forEach(t => {
        logs.push({
          type: 'INFO',
          label: 'CREATION',
          text: `Task <strong>#${t.id} (${t.title})</strong> was created.`,
          time: new Date(t.createdAt),
          badge: 'status-info'
        });

        // Populate blocker events
        t.blockers?.forEach(b => {
          logs.push({
            type: 'DANGER',
            label: 'BLOCK',
            text: `Task <strong>#${t.id} (${t.title})</strong> flagged as <strong>Blocked</strong>.`,
            time: new Date(b.createdAt),
            badge: 'status-danger'
          });
          if (b.resolvedAt) {
            logs.push({
              type: 'SUCCESS',
              label: 'RESOLVED',
              text: `Blocker on Task <strong>#${t.id}</strong> resolved.`,
              time: new Date(b.resolvedAt),
              badge: 'status-success'
            });
          }
        });
      });

      // Sort chronological descending
      logs.sort((a,b) => b.time.getTime() - a.time.getTime());

      if (logs.length === 0) {
        activityList.innerHTML = `<p class="small-text" style="padding: 16px 0; text-align: center;">No activity recorded yet.</p>`;
      } else {
        activityList.innerHTML = logs.slice(0, 10).map(log => {
          const minsAgo = Math.round((new Date().getTime() - log.time.getTime()) / (60 * 1000));
          const timeText = minsAgo < 60 ? `${minsAgo} mins ago` : `${Math.round(minsAgo / 60)} hours ago`;

          return `
            <div style="display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid var(--border-neutral);">
              <div class="pill-badge ${log.badge}" style="padding: 2px 6px; font-size: 10px;">${log.label}</div>
              <div>
                <p class="body-text" style="color: var(--text-primary); font-size: 13px;">${log.text}</p>
                <span class="small-text">${timeText}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 5. Mount In-App Notifications Matrix
    const notifList = document.getElementById('notifications-list');
    if (notifList) {
      const activeNotifs = notifications.filter(n => !n.isRead);
      if (activeNotifs.length === 0) {
        notifList.innerHTML = `
          <div style="padding: 16px; background-color: var(--bg-secondary); border-radius: var(--radius-md); text-align: center; border: 1px dashed var(--border-neutral);">
            <p class="small-text">No pending notifications in your queue.</p>
          </div>
        `;
      } else {
        notifList.innerHTML = activeNotifs.slice(0, 3).map(n => `
          <div style="padding: 10px; background-color: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 3px solid var(--status-info); position: relative;">
            <p class="small-text" style="font-weight: 600; color: var(--text-primary);">${n.title}</p>
            <p class="small-text" style="margin-top: 4px;">${n.message}</p>
            <button class="mark-read-btn" data-id="${n.id}" style="background: none; border: none; font-size: 10px; color: var(--accent-navy-primary); cursor: pointer; margin-top: 6px; padding: 0;">Mark as Read</button>
          </div>
        `).join('');

        // Wire listeners
        notifList.querySelectorAll('.mark-read-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const notifId = Number(btn.dataset.id);
            try {
              await fetchApi('PATCH', `/notifications/${notifId}/read`);
              // Reload
              initDashboard();
            } catch (e) {
              console.error(e);
            }
          });
        });
      }
    }

    // Toggle layouts
    if (loadingEl) loadingEl.style.display = 'none';
    contentEl.style.display = 'flex';

  } catch (err) {
    console.error(err);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="padding: 32px; background-color: rgba(220, 38, 38, 0.05); border-radius: var(--radius-lg); text-align: center; border: 1px dashed var(--status-danger);">
          <p class="body-text" style="color: var(--status-danger); font-weight: 600;">Failed to load live dashboard statistics.</p>
          <p class="small-text" style="margin-top: 8px;">Error: ${err.message || 'Server connection issue.'}</p>
        </div>
      `;
    }
  }
}
// For initial load
export function initDashboardListeners() {
  initDashboard();
}
