// profile.js - Personal Profile and workforce performance metrics tracking.
// Conforms to Section 4 Capability C5 and Section 6.5.

import { fetchApi } from '../services/api.js';
import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';

let profileUser = null;
let profileTasks = [];

export function renderProfileView() {
  return `
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 1200px; margin: 0 auto;">
      <!-- Profile Header widget -->
      <div class="widget-card" style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
        <!-- Avatar Upload / Display -->
        <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0;">
          <img id="profile-avatar-img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: none;" />
          <div id="profile-avatar" style="width: 100%; height: 100%; border-radius: 50%; background-color: var(--accent-navy-light); color: var(--accent-navy-primary); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; font-family: var(--font-display);">
            T
          </div>
          <label id="upload-avatar-btn" style="display: none; position: absolute; bottom: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: 50%; width: 24px; height: 24px; cursor: pointer; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="Upload Avatar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px; color: var(--text-secondary);">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <input type="file" id="avatar-upload-input" accept="image/*" style="display: none;" />
          </label>
        </div>

        <div style="flex: 1; min-width: 200px;">
          <h1 id="profile-name" class="page-title" style="font-size: 28px;">--</h1>
          <p id="profile-rank" class="body-text" style="font-weight: 600; color: var(--accent-navy-primary); margin-top: 4px;">--</p>
          <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
            <span id="profile-dept-badge" class="pill-badge status-info">--</span>
            <span id="profile-status-badge" class="pill-badge status-success">--</span>
          </div>
        </div>

        <!-- Contact details -->
        <div style="padding-left: 24px; border-left: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 6px; min-width: 220px;">
          <span class="small-text">Email Address: <strong id="profile-email-label" style="color: var(--text-primary);">--</strong></span>
          <span class="small-text">Member Since: <strong id="profile-joined-label" style="color: var(--text-primary);">--</strong></span>
        </div>
      </div>

      <!-- Task History and Performance Matrix -->
      <div class="widget-card" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h3 class="card-title">Assigned Workforce History</h3>
          
          <!-- Interval filtering (Section 4 C5 requirement) -->
          <div style="display: flex; gap: 4px; background-color: var(--bg-secondary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral);">
            <button class="profile-filter-btn active" data-range="week" style="padding: 6px 12px; border:none; background:var(--bg-primary); border-radius:var(--radius-sm); font-size:11px; font-weight:600; cursor:pointer; color:var(--accent-navy-primary);">This Week</button>
            <button class="profile-filter-btn" data-range="month" style="padding: 6px 12px; border:none; background:none; border-radius:var(--radius-sm); font-size:11px; font-weight:500; cursor:pointer; color:var(--text-secondary);">This Month</button>
            <button class="profile-filter-btn" data-range="year" style="padding: 6px 12px; border:none; background:none; border-radius:var(--radius-sm); font-size:11px; font-weight:500; cursor:pointer; color:var(--text-secondary);">This Year</button>
          </div>
        </div>

        <!-- Task table -->
        <div style="overflow-x: auto;">
          <table style="width:100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-neutral); background-color: var(--bg-secondary);">
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Task Details</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Priority</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">Target Due Date</th>
                <th style="padding: 12px; font-weight:600; color:var(--text-secondary);">SLA Status</th>
              </tr>
            </thead>
            <tbody id="profile-tasks-body">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Load user details and calculate history
 */
export async function initProfileListeners() {
  const nameEl = document.getElementById('profile-name');
  if (!nameEl) return;

  // Check if we are viewing a target profile from employee list row selection
  const targetId = localStorage.getItem('target_profile_id');
  const userId = targetId ? Number(targetId) : AuthState.currentUser?.id;
  localStorage.removeItem('target_profile_id'); // clear cache

  try {
    const [userRes, tasksRes] = await Promise.all([
      fetchApi('GET', `/users/${userId}`),
      fetchApi('GET', '/tasks')
    ]);

    profileUser = userRes.user;
    
    // Filter tasks assigned to this target user
    const allTasks = tasksRes.tasks || [];
    profileTasks = allTasks.filter(t => t.assignments?.some(a => a.userId === userId && a.isActive));

    // Populate header
    nameEl.innerText = `${profileUser.firstName} ${profileUser.lastName}`;
    
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarFallback = document.getElementById('profile-avatar');
    
    avatarImg.src = `/avatars/user-${profileUser.id}.jpg?t=${Date.now()}`;
    avatarImg.onload = () => {
      avatarImg.style.display = 'block';
      avatarFallback.style.display = 'none';
    };
    avatarImg.onerror = () => {
      avatarImg.style.display = 'none';
      avatarFallback.style.display = 'flex';
      avatarFallback.innerText = profileUser.firstName[0];
    };

    document.getElementById('profile-rank').innerText = `${profileUser.rank} (Hierarchy level ${profileUser.rankLevel})`;
    document.getElementById('profile-dept-badge').innerText = profileUser.department || 'General / Corporate';
    document.getElementById('profile-status-badge').innerText = profileUser.status;
    document.getElementById('profile-email-label').innerText = profileUser.email;
    document.getElementById('profile-joined-label').innerText = new Date(profileUser.createdAt).toLocaleDateString();

    // Show upload button only if it's the current user or admin
    if (userId === AuthState.currentUser?.id || AuthState.isAdmin()) {
      const uploadBtn = document.getElementById('upload-avatar-btn');
      const uploadInput = document.getElementById('avatar-upload-input');
      
      if (uploadBtn) uploadBtn.style.display = 'flex';
      
      uploadInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          try {
            uploadBtn.style.opacity = '0.5';
            const res = await fetchApi('POST', '/upload/avatar', {
              imageBase64: base64String,
              targetUserId: userId
            });
            Notifications.success('Avatar Updated', 'Profile picture updated successfully.');
            avatarImg.src = res.avatarUrl;
            avatarImg.style.display = 'block';
            avatarFallback.style.display = 'none';
          } catch (err) {
            console.error(err);
            Notifications.error('Upload Failed', err.message);
          } finally {
            uploadBtn.style.opacity = '1';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    renderTasksTable('week');

    // Hook filters
    const filterBtns = document.querySelectorAll('.profile-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'none';
          b.style.color = 'var(--text-secondary)';
          b.style.fontWeight = '500';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--bg-primary)';
        btn.style.color = 'var(--accent-navy-primary)';
        btn.style.fontWeight = '600';

        renderTasksTable(btn.dataset.range);
      });
    });
  } catch (err) {
    console.error(err);
    Notifications.error('Profile Load Failed', err.message);
  }
}

/**
 * Filter and layout historical rows
 */
function renderTasksTable(range) {
  const tbody = document.getElementById('profile-tasks-body');
  if (!tbody) return;

  const now = new Date();
  const limitDate = new Date();

  if (range === 'week') {
    limitDate.setDate(now.getDate() - 7);
  } else if (range === 'month') {
    limitDate.setMonth(now.getMonth() - 1);
  } else if (range === 'year') {
    limitDate.setFullYear(now.getFullYear() - 1);
  }

  const filtered = profileTasks.filter(t => new Date(t.createdAt) >= limitDate);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-secondary);">No workforce history found for this range.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const statusMap = {
      'Pending': 'status-info',
      'In Progress': 'status-info',
      'Blocked': 'status-danger',
      'Under Review': 'status-warning',
      'Completed': 'status-success'
    };
    const statusClass = statusMap[t.status] || 'status-info';

    return `
      <tr style="border-bottom: 1px solid var(--border-neutral);">
        <td style="padding: 12px; font-weight:600;">
          <div style="font-size:13px; color:var(--text-primary);">${t.title}</div>
          <div class="small-text" style="font-size:10px; margin-top:2px;">#${t.id}</div>
        </td>
        <td style="padding: 12px;">
          <span class="pill-badge status-info" style="font-size:10px; padding:2px 6px;">${t.priority}</span>
        </td>
        <td style="padding: 12px; color: var(--text-secondary);">${new Date(t.dueDate).toLocaleDateString()}</td>
        <td style="padding: 12px;">
          <span class="pill-badge ${statusClass}"><span class="badge-dot"></span>${t.status}</span>
        </td>
      </tr>
    `;
  }).join('');
}
