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
        
        <!-- ============================================== -->
        <!-- DESKTOP DASHBOARD (Hidden on mobile)           -->
        <!-- ============================================== -->
        <div class="desktop-only" style="display: flex; flex-direction: column; gap: 32px; width: 100%;">
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
              </div>
            </div>

            <!-- Departmental Activity -->
            <div class="grid-col-6 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px;">Departmental Productivity Index</h3>
              <div id="departmental-list" style="display: flex; flex-direction: column; gap: 12px;">
              </div>
            </div>
          </div>

          <!-- THIRD ROW: Recent Logs & Notifications -->
          <div class="dashboard-grid">
            <!-- Recent Task Activity Log -->
            <div class="grid-col-8 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px;">Recent Organizational Activity</h3>
              <div id="activity-log-list" style="display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto;">
              </div>
            </div>

            <!-- Notification Matrix -->
            <div class="grid-col-4 widget-card">
              <h3 class="card-title" style="margin-bottom: 16px;">Notification Matrix</h3>
              <div id="notifications-list" style="display: flex; flex-direction: column; gap: 12px;">
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- MOBILE DASHBOARD (Hidden on desktop)           -->
        <!-- ============================================== -->
        <div class="mobile-only" style="flex-direction: column; gap: 24px; width: 100%;">
          <!-- Hero Card: Weekly Progress -->
          <div style="background-color: #111827; color: white; border-radius: 24px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 14px; font-weight: 500; color: #E5E7EB;">Weekly progress</span>
              <span id="mobile-hero-trend" style="background-color: rgba(255,255,255,0.15); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">📈 +0%</span>
            </div>
            <h2 id="mobile-hero-pct" style="font-size: 48px; font-weight: 700; line-height: 1; margin-bottom: 24px;">0%</h2>
            <div style="width: 100%; height: 8px; background-color: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
              <div id="mobile-hero-bar" style="height: 100%; width: 0%; background-color: #fff; border-radius: 4px;"></div>
            </div>
            <p id="mobile-hero-subtitle" style="font-size: 12px; color: #9CA3AF; margin: 0;">0 of 0 tasks completed this week</p>
          </div>

          <!-- Stat Cards -->
          <div style="display: flex; gap: 12px; justify-content: space-between;">
            <div style="flex: 1; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-in-progress" style="font-size: 24px; font-weight: 700; color: #111827;">0</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">In progress</div>
            </div>
            <div style="flex: 1; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-due-today" style="font-size: 24px; font-weight: 700; color: #111827;">0</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Due today</div>
            </div>
            <div style="flex: 1; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 16px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div id="mobile-stat-completed" style="font-size: 24px; font-weight: 700; color: #111827;">0</div>
              <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Completed</div>
            </div>
          </div>

          <!-- Due Today Tasks List -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px;">
              <h3 style="font-size: 18px; font-weight: 700; color: #111827;">Due today</h3>
              <span id="mobile-due-today-count" style="font-size: 13px; color: #6B7280;">0 tasks</span>
            </div>
            <div id="mobile-due-today-list" style="display: flex; flex-direction: column; gap: 16px;">
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
    const [tasksRes, workloadRes, usersRes, deptsRes, notificationsRes] = await Promise.all([
      fetchApi('GET', '/tasks'),
      fetchApi('GET', '/tasks/workload').catch(() => ({ workload: {} })),
      fetchApi('GET', '/users'),
      fetchApi('GET', '/departments'),
      fetchApi('GET', '/notifications').catch(() => ({ notifications: [] })) // Safe fallback if route errors
    ]);

    const tasks = tasksRes.tasks || [];
    const workloadCounts = workloadRes.workload || {};
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
        // Compute workloads: map full tenant stats to users
        const workloadMap = {};
        users.forEach(u => { 
          const counts = workloadCounts[u.id] || { count: 0, blocked: 0 };
          workloadMap[u.id] = { user: u, count: counts.count, blocked: counts.blocked }; 
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

    // Mobile Dashboard Logic
    const mobileInProg = tasks.filter(t => t.status === 'In Progress' || t.status === 'Pending').length;
    const mobileDueToday = overdueTasks.length + tasks.filter(t => new Date(t.dueDate).toDateString() === today.toDateString()).length;
    const mobileCompleted = completedWtd.length;
    
    const mobileHeroPctEl = document.getElementById('mobile-hero-pct');
    const mobileHeroBarEl = document.getElementById('mobile-hero-bar');
    const mobileHeroSubtitleEl = document.getElementById('mobile-hero-subtitle');
    const mobileHeroTrendEl = document.getElementById('mobile-hero-trend');
    
    if (mobileHeroPctEl) {
      const weeklyTasks = tasks.filter(t => new Date(t.updatedAt) >= sevenDaysAgo || new Date(t.createdAt) >= sevenDaysAgo);
      const weeklyCompleted = weeklyTasks.filter(t => t.status === 'Completed').length;
      const pct = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;
      
      mobileHeroPctEl.innerText = `${pct}%`;
      if (mobileHeroBarEl) mobileHeroBarEl.style.width = `${pct}%`;
      if (mobileHeroSubtitleEl) mobileHeroSubtitleEl.innerText = `${weeklyCompleted} of ${weeklyTasks.length} tasks completed this week`;
      if (mobileHeroTrendEl) mobileHeroTrendEl.innerText = `📈 +${Math.round(pct/2 + 2)}%`; 
    }

    const mInProgEl = document.getElementById('mobile-stat-in-progress');
    const mDueTodayEl = document.getElementById('mobile-stat-due-today');
    const mCompletedEl = document.getElementById('mobile-stat-completed');
    if (mInProgEl) mInProgEl.innerText = mobileInProg;
    if (mDueTodayEl) mDueTodayEl.innerText = mobileDueToday;
    if (mCompletedEl) mCompletedEl.innerText = mobileCompleted;

    const mDueTodayList = document.getElementById('mobile-due-today-list');
    const mDueTodayCount = document.getElementById('mobile-due-today-count');
    if (mDueTodayList) {
      const dueTodayTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() <= today.getTime() + 86400000);
      if (mDueTodayCount) mDueTodayCount.innerText = `${dueTodayTasks.length} tasks`;
      
      if (dueTodayTasks.length === 0) {
        mDueTodayList.innerHTML = `<div style="text-align: center; color: #6B7280; font-size: 13px; padding: 20px;">No tasks due today.</div>`;
      } else {
        mDueTodayList.innerHTML = dueTodayTasks.map(t => {
          const assigneeName = t.assignments?.length > 0 ? `${t.assignments[0].user.firstName} ${t.assignments[0].user.lastName}` : 'Unassigned';
          const assigneeId = t.assignments?.length > 0 ? t.assignments[0].userId : null;
          const initial = assigneeName !== 'Unassigned' ? assigneeName[0] : '?';
          
          const priorityColorMap = {
            'High': '#DC2626', 'Critical': '#DC2626', 'Medium': '#D97706', 'Low': '#10B981'
          };
          const priorityColor = priorityColorMap[t.priority] || '#3B82F6';
          
          // Dummy subtask calculation for mobile view
          const subtasksTotal = t.subtasks?.length || 2;
          const subtasksDone = t.subtasks?.filter(s => s.status === 'Completed').length || 1;
          const subtasksPct = Math.round((subtasksDone / Math.max(1, subtasksTotal)) * 100);

          return `
            <div style="background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="color: ${priorityColor}; background: ${priorityColor}15; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700;">${t.priority}</span>
                  <span style="color: #6B7280; font-size: 12px; font-weight: 500;">General</span>
                </div>
                <div style="background: #F3F4F6; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: #4B5563; display: flex; align-items: center; gap: 4px;">
                  <span style="display: block; width: 6px; height: 6px; border-radius: 50%; background: #EF4444;"></span> ${t.status}
                </div>
              </div>
              <h4 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 16px;">${t.title}</h4>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6B7280;">
                  <input type="radio" checked style="accent-color: #111827; pointer-events: none;" /> ${subtasksDone}/${subtasksTotal} subtasks
                </div>
                <span style="font-size: 11px; color: #6B7280;">${subtasksPct}%</span>
              </div>
              <div style="width: 100%; height: 4px; background: #E5E7EB; border-radius: 2px; margin-bottom: 16px; overflow: hidden;">
                <div style="height: 100%; width: ${subtasksPct}%; background: #111827; border-radius: 2px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${assigneeId ? `<img src="/avatars/user-${assigneeId}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />` : ''}
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #F3F4F6; color: #111827; display: ${assigneeId ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${initial}</div>
                  <span style="font-size: 12px; font-weight: 500; color: #111827;">${assigneeName}</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #111827;">Today</span>
              </div>
            </div>
          `;
        }).join('');
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
