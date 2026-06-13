// reports.js - Reports and SLA Analytics View.
// Implements Section D5 / SLA rules and data display.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';

export function renderReportsView() {
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
      </div>
    </div>
  `;
}

/**
 * Fetch and calculate SLA details
 */
export async function initReportsListeners() {
  const loading = document.getElementById('reports-loading');
  const content = document.getElementById('reports-content');
  if (!content) return;

  try {
    const [tasksRes, deptsRes] = await Promise.all([
      fetchApi('GET', '/tasks'),
      fetchApi('GET', '/departments')
    ]);

    const tasks = tasksRes.tasks || [];
    const depts = deptsRes.departments || [];

    // Calculate Completion rates
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    
    // Average Closure Time (ms)
    let avgClosureText = 'N/A';
    if (completedTasks.length > 0) {
      const totalClosureMs = completedTasks.reduce((acc, t) => {
        const create = new Date(t.createdAt).getTime();
        const close = new Date(t.updatedAt).getTime();
        return acc + (close - create);
      }, 0);
      const avgMs = totalClosureMs / completedTasks.length;
      const avgHours = Math.round(avgMs / (1000 * 60 * 60));
      avgClosureText = avgHours < 24 ? `${avgHours} Hours` : `${Math.round(avgHours / 24)} Days`;
    }

    // Average Blocker Duration
    let avgBlockerText = 'N/A';
    const resolvedBlockers = [];
    tasks.forEach(t => {
      t.blockers?.forEach(b => {
        if (b.resolvedAt) resolvedBlockers.push(b);
      });
    });

    if (resolvedBlockers.length > 0) {
      const totalBlockerMs = resolvedBlockers.reduce((acc, b) => {
        const start = new Date(b.createdAt).getTime();
        const end = new Date(b.resolvedAt).getTime();
        return acc + (end - start);
      }, 0);
      const avgMs = totalBlockerMs / resolvedBlockers.length;
      const avgHours = Math.round(avgMs / (1000 * 60 * 60));
      avgBlockerText = avgHours < 24 ? `${avgHours} Hours` : `${Math.round(avgHours / 24)} Days`;
    }

    // Reassignment Rate
    let reassignRateText = '0%';
    if (tasks.length > 0) {
      const reassignedCount = tasks.filter(t => t.assignments?.some(a => a.reassignedAt !== null)).length;
      const rate = Math.round((reassignedCount / tasks.length) * 100);
      reassignRateText = `${rate}%`;
    }

    // Populate KPI Elements
    document.getElementById('kpi-closure-time').innerText = avgClosureText;
    document.getElementById('kpi-blocker-time').innerText = avgBlockerText;
    document.getElementById('kpi-reassign-rate').innerText = reassignRateText;

    // Render SLA Chart List (Department completions)
    const slaChartList = document.getElementById('sla-chart-list');
    if (slaChartList) {
      if (depts.length === 0) {
        slaChartList.innerHTML = `<p class="small-text" style="text-align: center; color: var(--text-secondary);">No department data configured.</p>`;
      } else {
        slaChartList.innerHTML = depts.map(d => {
          const deptTasks = tasks.filter(t => t.departmentId === d.id);
          const completed = deptTasks.filter(t => t.status === 'Completed').length;
          const rate = deptTasks.length > 0 ? Math.round((completed / deptTasks.length) * 100) : 100;
          const pct = Math.max(rate, 4); // minimum bar width to look nice

          return `
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                <span class="data-number">${d.name}</span>
                <span class="small-text" style="font-weight: 600;">${rate}% SLA met</span>
              </div>
              <div style="height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background-color: var(--status-success); border-radius: var(--radius-sm);"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render completion rates by Priority
    const priorityList = document.getElementById('priority-list');
    if (priorityList) {
      const priorities = ['Critical', 'High', 'Medium', 'Low'];
      priorityList.innerHTML = priorities.map(p => {
        const pTasks = tasks.filter(t => t.priority === p);
        const completed = pTasks.filter(t => t.status === 'Completed').length;
        const rate = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
        const countText = `${completed} / ${pTasks.length} completed`;

        let color = 'var(--text-secondary)';
        if (p === 'Critical') color = 'var(--status-danger)';
        if (p === 'High') color = 'var(--status-warning)';
        if (p === 'Medium') color = 'var(--status-info)';
        if (p === 'Low') color = 'var(--status-success)';

        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-neutral);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${color};"></span>
              <span class="data-number">${p} Priority</span>
            </div>
            <div style="text-align: right;">
              <span class="pill-badge status-info" style="font-size: 11px;">${rate}% Rate</span>
              <div class="small-text" style="font-size: 10px; margin-top: 2px;">${countText}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (loading) loading.style.display = 'none';
    content.style.display = 'flex';
  } catch (err) {
    console.error(err);
    if (loading) {
      loading.innerHTML = `<span style="color:var(--status-danger)">Failed to compute reports: ${err.message}</span>`;
    }
  }
}
