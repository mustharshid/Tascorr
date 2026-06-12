// main.js - Core client coordinator for Tascorr.
// Manages routing, auth guards, sidebar rendering, mobile layouts, theme toggling, and global error boundaries.

import { renderDashboardView, initDashboardListeners } from './views/dashboard.js';
import { renderTasksView, initTasksListeners } from './views/tasks.js';
import { renderDepartmentsView, initDepartmentsListeners } from './views/departments.js';
import { renderEmployeesView, initEmployeesListeners } from './views/employees.js';
import { renderReportsView, initReportsListeners } from './views/reports.js';
import { renderSettingsView, initSettingsListeners } from './views/settings.js';
import { renderProfileView, initProfileListeners } from './views/profile.js';
import { renderLandingView } from './views/landing.js';
import { renderSuperadminView, initSuperadminListeners } from './views/superadmin.js';
import { renderLoginView, initLoginListeners } from './views/login.js';
import { renderSignupView, initSignupListeners } from './views/signup.js';

import { AuthState } from './services/auth-state.js';
import { Notifications } from './services/notifications.js';

// 1. Navigation definitions
const ROUTES = {
  landing: { title: 'Marketing', render: renderLandingView, icon: 'home', isPublic: true },
  login: { title: 'Sign In', render: renderLoginView, icon: 'user', isPublic: true },
  signup: { title: 'Register', render: renderSignupView, icon: 'users', isPublic: true },
  
  dashboard: { title: 'Dashboard', render: renderDashboardView, icon: 'chart-pie' },
  tasks: { title: 'Tasks', render: renderTasksView, icon: 'list-check' },
  departments: { title: 'Departments', render: renderDepartmentsView, icon: 'sitemap' },
  employees: { title: 'Employees', render: renderEmployeesView, icon: 'users' },
  reports: { title: 'Reports', render: renderReportsView, icon: 'chart-bar' },
  settings: { title: 'Settings', render: renderSettingsView, icon: 'cog', isBottom: true },
  profile: { title: 'Profile', render: renderProfileView, icon: 'user', isBottom: true },
  superadmin: { title: 'Superadmin', render: renderSuperadminView, icon: 'key' }
};

// SVG Icons mapping for clean look
const ICONS = {
  'home': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`,
  'chart-pie': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>`,
  'list-check': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 011 1v3.875a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-3.875z" /></svg>`,
  'sitemap': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM21 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9 18.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM9.75 10.5c0 .621-.504 1.125-1.125 1.125H6.75a2.25 2.25 0 01-2.25-2.25V6.75m11.25 3.75c0 .621-.504 1.125-1.125 1.125H12" /></svg>`,
  'users': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 019.374 15c2.24 0 4.332.596 6.136 1.631M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM4 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
  'chart-bar': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`,
  'cog': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
  'user': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
  'key': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>`,
  'logout': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>`
};

// 2. Navigation foundations initialization
function initNavigation() {
  const desktopNav = document.getElementById('desktop-nav');
  const desktopBottomNav = document.getElementById('desktop-bottom-nav');
  const mobileNav = document.getElementById('mobile-nav');

  if (!desktopNav || !mobileNav || !desktopBottomNav) return;

  // Clear menus
  desktopNav.innerHTML = '';
  desktopBottomNav.innerHTML = '';
  mobileNav.innerHTML = '';

  if (!AuthState.isAuthenticated) return;

  // Build Desktop navigation links according to rank level authorizations (Section 5 / NNR-5)
  let middleHtml = '';
  let bottomHtml = '';
  
  const rank = AuthState.currentUser?.rankLevel ?? 4;
  const isSuper = AuthState.isSuperadmin();

  Object.keys(ROUTES).forEach(key => {
    const route = ROUTES[key];
    if (route.isPublic) return; 

    // Hierarchy visibility logic
    if (isSuper) {
      // Superadmin sees only superadmin and settings
      if (key !== 'superadmin' && key !== 'settings') return;
    } else {
      // Non-superadmin cannot see superadmin console
      if (key === 'superadmin') return;

      // Employee hides employees registry and SLA reports
      if (rank > 2) {
        if (key === 'employees' || key === 'reports') return;
      }
    }

    const iconSvg = ICONS[route.icon] || '';
    const itemHtml = `
      <a href="#${key}" class="menu-item" id="nav-${key}">
        ${iconSvg}
        <span class="menu-item-text">${route.title}</span>
      </a>
    `;

    if (route.isBottom) {
      bottomHtml += itemHtml;
    } else {
      middleHtml += itemHtml;
    }
  });

  // Append Sign Out button at the very bottom
  bottomHtml += `
    <a class="menu-item" id="nav-logout-action" style="color: var(--status-danger);">
      ${ICONS['logout']}
      <span class="menu-item-text">Sign Out</span>
    </a>
  `;

  desktopNav.innerHTML = middleHtml;
  desktopBottomNav.innerHTML = bottomHtml;

  // Wire logout trigger
  document.getElementById('nav-logout-action')?.addEventListener('click', () => {
    AuthState.logout();
  });

  // Build Mobile Bottom Navigation (four priority items + center quick action)
  if (!isSuper) {
    const mobileKeys = ['dashboard', 'tasks', 'quickAction', 'settings', 'logout'];
    let mobileHtml = '';

    mobileKeys.forEach(key => {
      if (key === 'quickAction') {
        // Only managers or above can create tasks
        const canCreate = rank <= 3;
        if (canCreate) {
          mobileHtml += `
            <div class="mobile-quick-action" id="mobile-task-create" aria-label="Create Task">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          `;
        } else {
          // Placeholder to maintain spacing if user cannot create tasks
          mobileHtml += `<div style="width: 56px; height: 56px;"></div>`;
        }
      } else if (key === 'logout') {
        mobileHtml += `
          <a href="#" class="mobile-nav-item" id="mobile-nav-logout" style="color: var(--status-danger);">
            ${ICONS['logout']}
            <span>Sign Out</span>
          </a>
        `;
      } else {
        const route = ROUTES[key];
        const iconSvg = ICONS[route.icon] || '';
        mobileHtml += `
          <a href="#${key}" class="mobile-nav-item" id="mobile-nav-${key}">
            ${iconSvg}
            <span>${route.title}</span>
          </a>
        `;
      }
    });

    mobileNav.innerHTML = mobileHtml;

    // Center task trigger listener
    document.getElementById('mobile-task-create')?.addEventListener('click', () => {
      const drawer = new TaskCreateDrawer(() => {
        if (window.location.hash === '#tasks') {
          window.location.reload();
        } else {
          window.location.hash = 'tasks';
        }
      });
      drawer.open();
    });

    // Mobile logout trigger
    document.getElementById('mobile-nav-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      AuthState.logout();
    });
  }
}

/**
 * Global router logic with guards and initializer boots
 */
function router() {
  const hash = window.location.hash.substring(1) || 'landing';
  let route = ROUTES[hash] || ROUTES['landing'];

  // Auth Guard Boundary Enforcement
  if (!route.isPublic && !AuthState.isAuthenticated) {
    window.location.hash = 'login';
    return;
  }

  // Redirect to dashboard if logged in and accessing landing/auth screens
  if (route.isPublic && AuthState.isAuthenticated && hash !== 'landing') {
    window.location.hash = 'dashboard';
    return;
  }

  // Superadmin guard
  if (hash === 'superadmin' && !AuthState.isSuperadmin()) {
    window.location.hash = 'dashboard';
    return;
  }

  // Render view
  const viewRoot = document.getElementById('view-root');
  if (viewRoot) {
    viewRoot.style.animation = 'none';
    void viewRoot.offsetHeight; /* Trigger reflow to restart animation */
    viewRoot.style.animation = '';
    viewRoot.innerHTML = route.render();
  }

  // Update Breadcrumbs
  const breadcrumbs = document.getElementById('breadcrumbs');
  if (breadcrumbs) {
    const companyLabel = (AuthState.currentUser && AuthState.currentUser.tenantName) || 'Workspace';
    breadcrumbs.innerHTML = `
      <span class="body-text" style="font-weight: 500;">${companyLabel}</span>
      <span class="small-text" style="margin: 0 8px; color: var(--text-secondary);">&rarr;</span>
      <span class="body-text" style="font-weight: 600; color: var(--text-primary);">${route.title}</span>
    `;
  }

  // Sidebar link highlight
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const desktopActive = document.getElementById(`nav-${hash}`);
  if (desktopActive) {
    desktopActive.classList.add('active');
  }

  // Mobile navigation highlight
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const mobileActive = document.getElementById(`mobile-nav-${hash}`);
  if (mobileActive) {
    mobileActive.classList.add('active');
  }

  // Show/Hide shell structural containers based on public scope
  const sidebar = document.getElementById('sidebar');
  const header = document.querySelector('.app-header');
  const layout = document.getElementById('app-layout');

  if (route.isPublic) {
    document.body.classList.add('public-route');
    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';
    if (layout) layout.style.backgroundColor = 'var(--bg-primary)';
  } else {
    document.body.classList.remove('public-route');
    if (sidebar) {
      sidebar.style.display = window.innerWidth > 768 ? 'flex' : 'none';
    }
    if (header) header.style.display = 'flex';
    if (layout) layout.style.backgroundColor = 'var(--bg-secondary)';
  }

  // Boot view controller initializers
  if (hash === 'login') initLoginListeners();
  if (hash === 'signup') initSignupListeners();
  if (hash === 'dashboard') initDashboardListeners();
  if (hash === 'tasks') initTasksListeners();
  if (hash === 'employees') initEmployeesListeners();
  if (hash === 'departments') initDepartmentsListeners();
  if (hash === 'reports') initReportsListeners();
  if (hash === 'settings') initSettingsListeners();
  if (hash === 'profile') initProfileListeners();
  if (hash === 'superadmin') initSuperadminListeners();
}

/**
 * Layout styling listeners
 */
function initLayout() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const themeToggle = document.getElementById('theme-toggle');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // ── Theme persistence ──────────────────────────────────────────────────
  // Restore saved theme on load (default: light)
  const savedTheme = localStorage.getItem('tascorr_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function syncThemeIcon(theme) {
    const iconDesktop = document.getElementById('theme-icon');
    const iconMobile = document.getElementById('mobile-theme-icon');
    
    const updateIcon = (iconEl) => {
      if (!iconEl) return;
      const isDarkMode = ['dark', 'midnight'].includes(theme);
      if (isDarkMode) {
        // Show sun icon
        iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />`;
      } else {
        // Show moon icon
        iconEl.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />`;
      }
    };

    updateIcon(iconDesktop);
    updateIcon(iconMobile);
  }

  // Apply correct icon for restored theme
  syncThemeIcon(savedTheme);

  const handleThemeToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const isDarkMode = ['dark', 'midnight'].includes(currentTheme);
    const targetTheme = isDarkMode ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('tascorr_theme', targetTheme);
    syncThemeIcon(targetTheme);
    
    // Dispatch a custom event so settings view can update if open
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: targetTheme }));
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
  }
  
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', handleThemeToggle);
  }

  window.addEventListener('resize', () => {
    const hash = window.location.hash.substring(1) || 'landing';
    const route = ROUTES[hash] || ROUTES['landing'];
    if (!route.isPublic && sidebar) {
      sidebar.style.display = window.innerWidth > 768 ? 'flex' : 'none';
    }
  });

  // Dynamic user badges
  updateUserHeaderBadge();
}

function updateUserHeaderBadge() {
  const badge = document.getElementById('header-user-role');
  if (badge) {
    if (AuthState.isAuthenticated && AuthState.currentUser) {
      const user = AuthState.currentUser;
      const companyLabel = user.tenantName || `${user.firstName} ${user.lastName}`;
      badge.innerText = `${companyLabel} (${user.rankTitle})`;
    } else {
      badge.innerText = 'Guest';
    }
  }

  // Populate mobile header
  const mobileName = document.getElementById('mobile-user-name');
  const mobileGreeting = document.getElementById('mobile-greeting');
  const mobileAvatar = document.getElementById('mobile-header-avatar');
  
  if (mobileName && AuthState.isAuthenticated && AuthState.currentUser) {
    const user = AuthState.currentUser;
    mobileName.innerText = user.firstName;
    
    // Fun multi-language greeting
    const greetings = [
      { text: "Good morning,", hint: "en" },
      { text: "Buenos días,", hint: "es" },
      { text: "Bonjour,", hint: "fr" },
      { text: "Guten Morgen,", hint: "de" },
      { text: "Buongiorno,", hint: "it" },
      { text: "Ohayō,", hint: "jp" },
      { text: "Anyoung,", hint: "kr" },
      { text: "Zǎo ān,", hint: "cn" },
      { text: "Namaste,", hint: "in" },
      { text: "Bom dia,", hint: "pt" }
    ];
    const rand = greetings[Math.floor(Math.random() * greetings.length)];
    if (mobileGreeting) {
      mobileGreeting.innerHTML = `${rand.text} <span style="font-size:10px; opacity:0.6; text-transform:uppercase; margin-left:4px;" title="Language: ${rand.hint}">${rand.hint}</span>`;
    }
    
    if (mobileAvatar) {
      const initials = `${user.firstName ? user.firstName.charAt(0) : ''}${user.lastName ? user.lastName.charAt(0) : ''}`;
      mobileAvatar.innerHTML = `
        <img src="/avatars/user-${user.id}.jpg?t=${Date.now()}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
        <div style="width:40px;height:40px;border-radius:50%;background:#F3F4F6;color:#111827;display:none;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:1px solid #E5E7EB;">${initials || '?'}</div>
      `;
    }
  }

  // Populate sidebar user card
  const userCard = document.getElementById('sidebar-user-card');
  const avatar = document.getElementById('sidebar-user-avatar');
  const avatarImg = document.getElementById('sidebar-user-avatar-img');
  const nameLabel = document.getElementById('sidebar-user-name');
  const roleLabel = document.getElementById('sidebar-user-role');

  if (userCard && avatar && nameLabel && roleLabel) {
    if (AuthState.isAuthenticated && AuthState.currentUser) {
      const user = AuthState.currentUser;
      const initials = `${user.firstName ? user.firstName.charAt(0) : ''}${user.lastName ? user.lastName.charAt(0) : ''}`;
      
      avatar.innerText = initials || '??';
      
      if (avatarImg) {
        avatarImg.src = `/avatars/user-${user.id}.jpg?t=${Date.now()}`;
        avatarImg.onload = () => {
          avatarImg.style.display = 'block';
          avatar.style.display = 'none';
        };
        avatarImg.onerror = () => {
          avatarImg.style.display = 'none';
          avatar.style.display = 'flex';
        };
      }
      
      nameLabel.innerText = `${user.firstName} ${user.lastName}`;
      roleLabel.innerText = user.rankTitle || 'Employee';
      userCard.style.display = 'flex';
    } else {
      userCard.style.display = 'none';
    }
  }
}

// Global Error boundary handling to prevent silent crash screen locks
window.addEventListener('error', (event) => {
  console.error('Captured Global Frontend Error:', event.error);
  Notifications.error('App Runtime Exception', event.message || 'An unexpected client error occurred.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Captured Global Promise Rejection:', event.reason);
  Notifications.error('API Error Response', event.reason?.message || 'Server request returned error.');
});

// Initialize client
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session verification check
  await AuthState.checkSession();
  
  // 2. Initialize layouts
  initLayout();
  initNavigation();

  window.addEventListener('hashchange', () => {
    initNavigation();
    updateUserHeaderBadge();
    router();
  });

  router();
});
