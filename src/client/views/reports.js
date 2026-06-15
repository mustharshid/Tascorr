// reports.js - Reports and SLA Analytics View.
// Implements Section D5 / SLA rules and data display.
// Phase 2: Staff Performance Reporting (per-employee metrics for managers+)

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { escapeHTML } from '../services/sanitize.js';

export function renderReportsView() {
  const user = AuthState.currentUser;
  const rankLevel = user?.rankLevel ?? 99;
  // Staff performance section is visible to managers and above (rank <= 3), but NOT employees
  const canSeeStaffPerformance = rankLevel <= 3;

  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Title -->
      <div>
        <h1 class="page-title">SLA Analytics</h1>
        <p class="body-text">Assess workforce performance metrics, blocker delays, and operational closure indices.</p>
      </div>

      <!-- SLA Performance Grid -->
      <div id="reports-loading" style="padding: 48px; text-align: center; color: var(--text-secondary);">
        Calculating performance index statistics...
      </div>

      <div id="reports-content" style="display: none; flex-direction: column; gap: 32px;">
        <!-- KPI Cards Row -->
        <div class="dashboard-grid">
          <!-- Avg Completion Time -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Avg Task Closure Time
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Average time taken from task creation to final completion.</span>
              </div>
            </span>
            <div id="kpi-closure-time" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Average duration from creation to closure state</p>
          </div>

          <!-- Blocker Resolve Speed -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Avg Blocker Duration
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Average time tasks spend in the Blocked state.</span>
              </div>
            </span>
            <div id="kpi-blocker-time" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Average duration of suspended blockers</p>
          </div>

          <!-- Reassignment Frequency -->
          <div class="grid-col-4 widget-card">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">
              Reassignment Ratio
              <div class="tooltip-container" style="margin-left: 6px;">
                <span class="help-icon">?</span>
                <span class="tooltip-text" style="text-transform: none;">Percentage of tasks that were reassigned after initial assignment.</span>
              </div>
            </span>
            <div id="kpi-reassign-rate" class="page-title" style="font-size: 32px; margin: 12px 0;">--</div>
            <p class="small-text">Percentage of tasks requiring reassignment</p>
          </div>
        </div>

        <!-- Departmental Ranking Table & SLA Progress Chart -->
        <div class="dashboard-grid">
          <!-- Departmental SLA Completion Charts -->
          <div class="grid-col-6 widget-card" style="display: flex; flex-direction: column;">
            <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">
              SLA Met Percentage
              <div class="tooltip-container">
                <span class="help-icon">?</span>
                <span class="tooltip-text">Service Level Agreement - Percentage of tasks completed on or before their due dates.</span>
              </div>
            </h3>
            <div id="sla-chart-list" style="display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center;">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Priority Allocation Index -->
          <div class="grid-col-6 widget-card">
            <h3 class="card-title" style="margin-bottom: 16px; display: flex; align-items: center;">
              Task Completion by Priority
              <div class="tooltip-container">
                <span class="help-icon">?</span>
                <span class="tooltip-text">Breakdown of tasks closed based on urgency levels.</span>
              </div>
            </h3>
            <div id="priority-list" style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════ -->
        <!-- STAFF PERFORMANCE TABLE (managers + above only)   -->
        <!-- ══════════════════════════════════════════════════ -->
        ${canSeeStaffPerformance ? `
        <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 class="card-title" style="margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                Staff Performance
                <div class="tooltip-container">
                  <span class="help-icon">?</span>
                  <span class="tooltip-text">Individual staff performance based on task completion rate, on-time delivery, and active blockers. Score is 0–100.</span>
                </div>
              </h3>
              <p class="small-text" style="margin: 0;">Ranked by composite performance score. Scoped to your accessible team members.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <select id="perf-dept-filter" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="">All Departments</option>
              </select>
              <select id="perf-sort" style="padding: 8px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-size: 13px; background: var(--bg-secondary); color: var(--text-primary); outline: none;">
                <option value="score">Sort: Score</option>
                <option value="completed">Sort: Completed</option>
                <option value="ontime">Sort: On-Time Rate</option>
                <option value="overdue">Sort: Overdue</option>
              </select>
            </div>
          </div>

          <!-- Score legend -->
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-success);"></span> 75–100: High Performer
            </span>
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-warning);"></span> 50–74: Needs Attention
            </span>
            <span class="small-text" style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--status-danger);"></span> 0–49: At Risk
            </span>
          </div>

          <!-- Table header (desktop only) -->
          <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; padding: 8px 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Staff Member</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Completed</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">On-Time %</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Avg Days</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Overdue</span>
            <span class="small-text" style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Score</span>
          </div>

          <!-- Table rows -->
          <div id="staff-performance-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Populated dynamically -->
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Compute a composite performance score (0–100) for a staff member.
 * Weights:
 *   50% — On-time completion rate
 *   30% — Task completion volume (normalised against highest performer)
 *   -10% — Blocked task penalty (per blocked task, capped at -30)
 *   -10% — Overdue task penalty (per overdue task, capped at -20)
 */
function computeScore(metrics, maxCompleted) {
  const onTimeScore = metrics.onTimeRate;
  const volumeScore = maxCompleted > 0 ? (metrics.completed / maxCompleted) * 100 : 0;
  const blockerPenalty = Math.min(metrics.blocked * 10, 30);
  const overduePenalty = Math.min(metrics.overdue * 10, 20);

  const raw = (onTimeScore * 0.5) + (volumeScore * 0.3) - blockerPenalty - overduePenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Fetch and calculate SLA details + staff performance
 */
export async function initReportsListeners() {
  const loading = document.getElementById('reports-loading');
  const content = document.getElementById('reports-content');
  if (!content) return;

  const user = AuthState.currentUser;
  const rankLevel = user?.rankLevel ?? 99;
  const canSeeStaffPerformance = rankLevel <= 3;

  try {
    const promises = [
      fetchApi('GET', '/tasks'),
      fetchApi('GET', '/departments'),
    ];
    if (canSeeStaffPerformance) {
      promises.push(fetchApi('GET', '/users'));
    }

    const results = await Promise.all(promises);
    const tasks = results[0].tasks || [];
    const depts = results[1].departments || [];
    const allUsers = canSeeStaffPerformance ? (results[2].users || []) : [];

    // Scope users: managers see only their dept; execs/admins see all (except admin rank 0)
    let visibleUsers = allUsers.filter(u => u.rank?.level !== 0);
    if (rankLevel >= 3 && rankLevel <= 4 && user?.departmentId) {
      visibleUsers = visibleUsers.filter(u => u.departmentId === user.departmentId);
    }

    // ── Existing KPI calculations ─────────────────────────────────────────────
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    let avgClosureText = 'N/A';
    if (completedTasks.length > 0) {
      const totalMs = completedTasks.reduce((acc, t) =>
        acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0);
      const avgHours = Math.round((totalMs / completedTasks.length) / (1000 * 60 * 60));
      avgClosureText = avgHours < 24 ? `${avgHours} hrs` : `${Math.round(avgHours / 24)} days`;
    }

    let avgBlockerText = 'N/A';
    const resolvedBlockers = tasks.flatMap(t => (t.blockers || []).filter(b => b.resolvedAt));
    if (resolvedBlockers.length > 0) {
      const totalMs = resolvedBlockers.reduce((acc, b) =>
        acc + (new Date(b.resolvedAt) - new Date(b.createdAt)), 0);
      const avgHours = Math.round((totalMs / resolvedBlockers.length) / (1000 * 60 * 60));
      avgBlockerText = avgHours < 24 ? `${avgHours} hrs` : `${Math.round(avgHours / 24)} days`;
    }

    let reassignRateText = '0%';
    if (tasks.length > 0) {
      const reassigned = tasks.filter(t => t.assignments?.some(a => a.reassignedAt !== null)).length;
      reassignRateText = `${Math.round((reassigned / tasks.length) * 100)}%`;
    }

    document.getElementById('kpi-closure-time').innerText = avgClosureText;
    document.getElementById('kpi-blocker-time').innerText = avgBlockerText;
    document.getElementById('kpi-reassign-rate').innerText = reassignRateText;

    // SLA chart list
    const slaChartList = document.getElementById('sla-chart-list');
    if (slaChartList) {
      if (depts.length === 0) {
        slaChartList.innerHTML = `<p class="small-text" style="text-align: center;">No department data configured.</p>`;
      } else {
        slaChartList.innerHTML = depts.map(d => {
          const deptTasks = tasks.filter(t => t.departmentId === d.id);
          const completed = deptTasks.filter(t => t.status === 'Completed').length;
          const rate = deptTasks.length > 0 ? Math.round((completed / deptTasks.length) * 100) : 100;
          const pct = Math.max(rate, 4);
          const barColor = rate >= 80 ? 'var(--status-success)' : rate >= 60 ? 'var(--status-warning)' : 'var(--status-danger)';
          return `
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${escapeHTML(d.name)}</span>
                <span class="small-text" style="font-weight: 600;">${rate}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background-color: ${barColor}; border-radius: var(--radius-sm); transition: width 0.6s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Priority breakdown
    const priorityList = document.getElementById('priority-list');
    if (priorityList) {
      const priorities = ['Critical', 'High', 'Medium', 'Low'];
      priorityList.innerHTML = priorities.map(p => {
        const pTasks = tasks.filter(t => t.priority === p);
        const completed = pTasks.filter(t => t.status === 'Completed').length;
        const rate = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
        const colors = { Critical: 'var(--status-danger)', High: 'var(--status-warning)', Medium: 'var(--status-info)', Low: 'var(--status-success)' };
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${colors[p]};"></span>
              <span class="data-number">${p} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${rate}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${completed} / ${pTasks.length} completed</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // ── Staff Performance Section ─────────────────────────────────────────────
    if (canSeeStaffPerformance && visibleUsers.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Build per-user metrics
      const userMetrics = visibleUsers.map(u => {
        const assignedTasks = tasks.filter(t =>
          t.assignments?.some(a => a.userId === u.id && a.isActive)
        );
        const userCompleted = assignedTasks.filter(t => t.status === 'Completed');
        const onTimeTasks = userCompleted.filter(t => new Date(t.updatedAt) <= new Date(t.dueDate));
        const onTimeRate = userCompleted.length > 0
          ? Math.round((onTimeTasks.length / userCompleted.length) * 100)
          : 0;

        // Avg closure days
        let avgDays = '--';
        if (userCompleted.length > 0) {
          const totalMs = userCompleted.reduce((acc, t) =>
            acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0);
          avgDays = Math.round(totalMs / userCompleted.length / (1000 * 60 * 60 * 24));
        }

        const blocked = assignedTasks.filter(t => t.status === 'Blocked').length;
        const overdue = assignedTasks.filter(t =>
          t.status !== 'Completed' && new Date(t.dueDate) < today
        ).length;

        return {
          user: u,
          completed: userCompleted.length,
          total: assignedTasks.length,
          onTimeRate,
          avgDays,
          blocked,
          overdue,
        };
      });

      // Compute scores (needs max completed for normalisation)
      const maxCompleted = Math.max(...userMetrics.map(m => m.completed), 1);
      const scoredMetrics = userMetrics.map(m => ({
        ...m,
        score: computeScore(m, maxCompleted),
      }));

      // Populate dept filter dropdown
      const deptFilter = document.getElementById('perf-dept-filter');
      if (deptFilter) {
        depts.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.name;
          deptFilter.appendChild(opt);
        });
      }

      function renderStaffTable(metrics) {
        const list = document.getElementById('staff-performance-list');
        if (!list) return;

        if (metrics.length === 0) {
          list.innerHTML = `<p class="small-text" style="text-align: center; padding: 24px;">No staff members match the current filter.</p>`;
          return;
        }

        list.innerHTML = metrics.map((m, idx) => {
          const scoreColor = m.score >= 75
            ? 'var(--status-success)'
            : m.score >= 50
            ? 'var(--status-warning)'
            : 'var(--status-danger)';

          const scoreBg = m.score >= 75
            ? 'rgba(34,197,94,0.08)'
            : m.score >= 50
            ? 'rgba(234,179,8,0.08)'
            : 'rgba(239,68,68,0.08)';

          const rankBadge = idx === 0
            ? '<span style="font-size:14px;" title="Top performer">🥇</span>'
            : idx === 1
            ? '<span style="font-size:14px;" title="Second place">🥈</span>'
            : idx === 2
            ? '<span style="font-size:14px;" title="Third place">🥉</span>'
            : '';

          const dept = depts.find(d => d.id === m.user.departmentId);
          const deptName = dept ? escapeHTML(dept.name) : 'Unassigned';

          // Desktop row
          const desktopRow = `
            <div class="desktop-only" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr; gap: 8px; align-items: center; padding: 14px 16px; border-radius: var(--radius-md); background: var(--bg-primary); border: 1px solid var(--border-neutral); transition: box-shadow 0.15s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                  <img src="/avatars/user-${m.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--text-primary);">${escapeHTML(m.user.firstName[0])}${escapeHTML(m.user.lastName[0] || '')}</div>
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    ${escapeHTML(m.user.firstName)} ${escapeHTML(m.user.lastName)} ${rankBadge}
                  </div>
                  <div class="small-text" style="font-size: 11px;">${escapeHTML(m.user.rank?.title || 'Employee')} · ${deptName}</div>
                </div>
              </div>
              <div style="text-align: center; font-size: 15px; font-weight: 700; color: var(--text-primary);">${m.completed}<span class="small-text" style="font-size:11px; font-weight:400;"> / ${m.total}</span></div>
              <div style="text-align: center;">
                <span style="font-size: 15px; font-weight: 700; color: ${m.onTimeRate >= 75 ? 'var(--status-success)' : m.onTimeRate >= 50 ? 'var(--status-warning)' : 'var(--status-danger)'};">${m.onTimeRate}%</span>
              </div>
              <div style="text-align: center; font-size: 14px; color: var(--text-secondary);">${m.avgDays === '--' ? '--' : m.avgDays + 'd'}</div>
              <div style="text-align: center;">
                ${m.overdue > 0
                  ? `<span style="font-size:14px;font-weight:700;color:var(--status-danger);">${m.overdue}</span>`
                  : `<span style="font-size:14px;color:var(--text-secondary);">0</span>`}
              </div>
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <div style="flex: 1; max-width: 80px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${m.score}%; height: 100%; background: ${scoreColor}; border-radius: 3px; transition: width 0.6s ease;"></div>
                </div>
                <span style="font-size: 15px; font-weight: 800; color: ${scoreColor}; min-width: 32px; text-align: right;">${m.score}</span>
              </div>
            </div>
          `;

          // Mobile card
          const mobileCard = `
            <div class="mobile-only" style="background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="position: relative; width: 40px; height: 40px; flex-shrink: 0;">
                    <img src="/avatars/user-${m.user.id}.jpg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--sidebar-bg);display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:var(--text-primary);">${escapeHTML(m.user.firstName[0])}${escapeHTML(m.user.lastName[0] || '')}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${escapeHTML(m.user.firstName)} ${escapeHTML(m.user.lastName)} ${rankBadge}</div>
                    <div class="small-text" style="font-size: 11px;">${escapeHTML(m.user.rank?.title || 'Employee')}</div>
                  </div>
                </div>
                <div style="background: ${scoreBg}; border: 1.5px solid ${scoreColor}; border-radius: 12px; padding: 6px 14px; text-align: center;">
                  <div style="font-size: 20px; font-weight: 800; color: ${scoreColor}; line-height: 1;">${m.score}</div>
                  <div style="font-size: 9px; color: ${scoreColor}; font-weight: 600; text-transform: uppercase;">Score</div>
                </div>
              </div>
              <div style="display: flex; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                <div style="width: ${m.score}%; background: ${scoreColor}; border-radius: 3px; transition: width 0.6s ease;"></div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; text-align: center;">
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${m.completed}</div>
                  <div class="small-text" style="font-size: 10px;">Done</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${m.onTimeRate >= 75 ? 'var(--status-success)' : m.onTimeRate >= 50 ? 'var(--status-warning)' : 'var(--status-danger)'};">${m.onTimeRate}%</div>
                  <div class="small-text" style="font-size: 10px;">On-time</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: var(--text-secondary);">${m.avgDays === '--' ? '--' : m.avgDays + 'd'}</div>
                  <div class="small-text" style="font-size: 10px;">Avg</div>
                </div>
                <div style="background: var(--bg-secondary); border-radius: 10px; padding: 10px 4px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${m.overdue > 0 ? 'var(--status-danger)' : 'var(--text-secondary)'};">${m.overdue}</div>
                  <div class="small-text" style="font-size: 10px;">Overdue</div>
                </div>
              </div>
            </div>
          `;

          return desktopRow + mobileCard;
        }).join('');
      }

      function applyFiltersAndSort() {
        const deptId = parseInt(document.getElementById('perf-dept-filter')?.value) || null;
        const sortBy = document.getElementById('perf-sort')?.value || 'score';

        let filtered = [...scoredMetrics];
        if (deptId) {
          filtered = filtered.filter(m => m.user.departmentId === deptId);
        }
        filtered.sort((a, b) => {
          if (sortBy === 'score') return b.score - a.score;
          if (sortBy === 'completed') return b.completed - a.completed;
          if (sortBy === 'ontime') return b.onTimeRate - a.onTimeRate;
          if (sortBy === 'overdue') return b.overdue - a.overdue;
          return 0;
        });
        renderStaffTable(filtered);
      }

      // Initial render (sorted by score desc)
      applyFiltersAndSort();

      // Wire up filter/sort controls
      document.getElementById('perf-dept-filter')?.addEventListener('change', applyFiltersAndSort);
      document.getElementById('perf-sort')?.addEventListener('change', applyFiltersAndSort);
    }

    if (loading) loading.style.display = 'none';
    content.style.display = 'flex';
  } catch (err) {
    console.error(err);
    if (loading) {
      loading.innerHTML = `<span style="color:var(--status-danger)">Failed to compute reports: ${escapeHTML(err.message)}</span>`;
    }
  }
}
