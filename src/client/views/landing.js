// landing.js - Landing/Marketing page view.
// Implements Section 4 Capability Area G: Landing Page & Public Space.

export function renderLandingView() {
  const features = [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>',
      title: "Smart Task Assignment",
      description: "Assign work across your team with full visibility into who's available, who's overloaded, and who's the right fit — before you hit assign."
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-list-tree\"><path d=\"M21 12h-8\"/><path d=\"M21 6H8\"/><path d=\"M21 18h-8\"/><path d=\"M8 6v14\"/><path d=\"M3 6v.01\"/><path d=\"M3 12v.01\"/><path d=\"M3 18v.01\"/></svg>',
      title: "Subtasks & Dependencies",
      description: "Break large initiatives into trackable pieces, and set up tasks that automatically wait their turn — no more starting work out of order."
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-building-2\"><path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/><path d=\"M10 6h4\"/><path d=\"M10 10h4\"/><path d=\"M10 14h4\"/><path d=\"M10 18h4\"/></svg>',
      title: "Cross-Department Collaboration",
      description: "Request access to assign work outside your department, with time-limited approvals and a full record of who authorized what."
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-line-chart\"><path d=\"M3 3v18h18\"/><path d=\"m19 9-5 5-4-4-3 3\"/></svg>',
      title: "Performance & SLA Analytics",
      description: "See how quickly blockers get resolved, how long approvals take, and where your organization needs attention — all in one view."
    }
  ];

  const steps = [
    { number: "01", title: "Set Up Your Structure", description: "Define your departments, ranks, and people once." },
    { number: "02", title: "Assign & Track", description: "Delegate tasks across your organization with full context." },
    { number: "03", title: "See What's Happening", description: "Get a real-time picture of what's done, what's stuck, and why." }
  ];

  const roles = [
    { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', name: "Employees", line: "A simple view of what's yours to do." },
    { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', name: "Managers", line: "Live visibility into your team's work." },
    { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-building\"><rect width=\"16\" height=\"20\" x=\"4\" y=\"2\" rx=\"2\" ry=\"2\"/><path d=\"M9 22v-4h6v4\"/><path d=\"M8 6h.01\"/><path d=\"M16 6h.01\"/><path d=\"M12 6h.01\"/><path d=\"M12 10h.01\"/><path d=\"M12 14h.01\"/><path d=\"M16 10h.01\"/><path d=\"M16 14h.01\"/><path d=\"M8 10h.01\"/><path d=\"M8 14h.01\"/></svg>', name: "Department Heads", line: "Full control across your department." },
    { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-briefcase\"><rect width=\"20\" height=\"14\" x=\"2\" y=\"7\" rx=\"2\" ry=\"2\"/><path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/></svg>', name: "Executives", line: "A real-time pulse on the whole organization." },
    { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-settings-2\"><path d=\"M20 7h-9\"/><path d=\"M14 17H5\"/><circle cx=\"17\" cy=\"17\" r=\"3\"/><circle cx=\"7\" cy=\"7\" r=\"3\"/></svg>', name: "Admins", line: "Configure your company without writing code." }
  ];

  const plans = [
    {
      name: "Tier 1 (Startup)",
      price: "Lifetime Free",
      description: "For small organizations up to 10 employee accounts.",
      features: ["Up to 10 employee accounts", "Basic task assignment", "Standard hierarchies"],
      featured: false
    },
    {
      name: "Tier 2 (Small Biz)",
      price: "499 MVR/mo",
      description: "For small organizations up to 30 employee accounts.",
      features: ["Up to 30 employee accounts", "Cross-department delegation", "Basic trace trails"],
      featured: false
    },
    {
      name: "Tier 3 (Growth)",
      price: "999 MVR/mo",
      description: "For mid-scale organizations up to 100 employee accounts.",
      features: ["Up to 100 employee accounts", "Advanced trace trails", "Priority support"],
      featured: true
    },
    {
      name: "Tier 4 (Enterprise)",
      price: "5,000 MVR/mo",
      description: "For corporate networks up to 1000 employee accounts.",
      features: ["Up to 1000 employee accounts", "SLA & analytics dashboard", "Dedicated account manager"],
      featured: false
    }
  ];

  const trustMetrics = [
    { name: "Companies Registered", value: "2+", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>' },
    { name: "Active Employees", value: "10+", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { name: "Tasks Delegated", value: "200+", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' },
    { name: "Blockers Resolved", value: "99%", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>' },
  ]

  return `
    <div id="v0-landing">
      
      <!-- HERO -->
      <section class="v0-hero">
        <div class="v0-hero-glow-1"></div>
        <div class="v0-hero-glow-2"></div>
        <div class="v0-container">
          <img src="/tassCorr_logo.png" class="v0-hero-logo" alt="Tascorr Logo" />
          <h1 class="v0-hero-title">Tascorr</h1>
          <p class="v0-hero-subtitle">Assign it. Track it. Own it.</p>
          <p class="v0-hero-desc">
            The workforce accountability layer that maps your company hierarchy,
            tracks assignments with absolute clarity, and flags blockers
            transparently.
          </p>
          <div class="v0-hero-actions">
            <a href="#login" class="v0-btn v0-btn-ghost">Sign In</a>
            <a href="#signup" class="v0-btn v0-btn-outline">Register Company</a>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 64rem;">
          <h2 class="v0-section-title">Operational Features & Trace Trails</h2>
          <div class="v0-grid-2">
            ${features.map(f => `
              <div class="v0-card">
                <div class="v0-icon-wrapper">
                  ${f.icon}
                </div>
                <h3 class="v0-card-title">${f.title}</h3>
                <p class="v0-card-desc">${f.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 64rem;">
          <h2 class="v0-section-title">How It Works</h2>
          <div class="v0-grid-3">
            ${steps.map(s => `
              <div class="v0-card">
                <span style="font-size: 1.875rem; font-weight: 700; color: #2d6cdf;">${s.number}</span>
                <h3 class="v0-card-title">${s.title}</h3>
                <p class="v0-card-desc">${s.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ROLES -->
      <section class="v0-section">
        <div class="v0-container" style="max-width: 72rem;">
          <h2 class="v0-section-title">Built For Every Role</h2>
          <div class="v0-grid-5">
            ${roles.map(r => `
              <div class="v0-card">
                <div class="v0-icon-wrapper small">
                  ${r.icon}
                </div>
                <h3 class="v0-card-title" style="font-size: 1.125rem;">${r.name}</h3>
                <p class="v0-card-desc" style="font-size: 0.875rem;">${r.line}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section class="v0-section" style="position: relative;">
        <div style="position: absolute; left: 50%; top: 0; width: 820px; height: 520px; border-radius: 50%; opacity: 0.12; transform: translateX(-50%); background: radial-gradient(circle, #2d6cdf 0%, transparent 70%); pointer-events: none;"></div>
        <div class="v0-container" style="max-width: 64rem;">
          <div style="text-align: center;">
            <h2 class="v0-section-title">Find the <span style="color: #2d6cdf;">Perfect Plan</span> for Your Business</h2>
            <p class="v0-hero-desc" style="margin-top: 1rem;">Start for free, then grow with us. Flexible plans for organisations of all sizes.</p>
          </div>
          <div class="v0-grid-4">
            ${plans.map(p => `
              <div class="v0-card ${p.featured ? 'v0-pricing-featured' : ''}" style="display: flex; flex-direction: column;">
                <h3 style="font-weight: 600; color: var(--text-primary);">${p.name}</h3>
                <div class="v0-pricing-price">${p.price}</div>
                <p class="v0-card-desc" style="margin-top: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1.5rem;">${p.description}</p>
                <ul style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; list-style: none; padding: 0;">
                  ${p.features.map(f => `
                    <li style="display: flex; gap: 0.75rem; color: var(--text-secondary); align-items: center;">
                      <svg class="size-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6cdf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ${f}
                    </li>
                  `).join('')}
                </ul>
                <div style="margin-top: auto; padding-top: 2rem;">
                  <a href="#signup" class="v0-btn ${p.featured ? 'v0-btn-primary' : 'v0-btn-secondary'}">Get Started</a>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="text-align: center; margin-top: 2rem; color: var(--text-secondary);">
            Have more than 1000 employees? Contact us for a custom enterprise package: <strong style="color: #2d6cdf;">+960 7451198 / +960 7793811</strong>
          </div>
        </div>
      </section>

      <!-- TRUST STRIP -->
      <section class="v0-section" style="padding: 4rem 1.5rem;">
        <div class="v0-container" style="max-width: 64rem;">
          <p style="text-align: center; margin-bottom: 2.5rem; color: #2d6cdf; font-size: 0.875rem;">
            Join us to raise these numbers.
          </p>
          <div class="trust-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; text-align: center;">
            ${trustMetrics.map(t => `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                <div style="color: #2d6cdf;">${t.icon}</div>
                <span style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">${t.name}</span>
                <span style="font-size: 1.5rem; font-weight: 700; color: var(--text-secondary);">${t.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <style>
        @media (min-width: 1024px) {
          .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      </style>

      <!-- FOOTER -->
      <footer class="v0-footer">
        <div class="v0-footer-content">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.625rem;">
              <img src="/tassCorr_logo.png" style="height: 2.5rem; width: auto; object-fit: contain;" alt="Tascorr Logo" />
              <span style="font-size: 1.125rem; font-weight: 700; color: var(--text-secondary);">Tascorr</span>
            </div>
            <p style="max-width: 25rem; font-size: 0.875rem; line-height: 1.625; color: var(--text-secondary);">
              Assign it. Track it. Own it. The workforce accountability layer for modern organizations. A product by ThinkSAFE Maldives Pvt Ltd.
            </p>
          </div>
          <nav style="display: flex; gap: 1.5rem;">
            <a href="#login" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Sign In</a>
            <a href="#signup" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Register</a>
            <a href="#pricing" style="font-size: 0.875rem; color: var(--text-secondary); text-decoration: none;">Pricing</a>
          </nav>
        </div>
      </footer>

    </div>
  `;
}
