// landing.js - Landing/Marketing page view.
// Implements Section 4 Capability Area G: Landing Page & Public Space.

export function renderLandingView() {
  return `
    <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 64px; padding: 48px 16px;">
      <!-- Hero Section -->
      <header style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px;">
        <img src="/tascorrLogo.png" alt="Tascorr Logo" style="width: 80px; height: 80px; object-fit: contain;" onerror="this.style.display='none'">
        <div>
          <h1 class="page-title" style="font-size: 48px; line-height: 1.15;">Assign it. Track it. Own it.</h1>
          <p class="body-text" style="font-size: 18px; margin-top: 16px; max-width: 600px; margin-left: auto; margin-right: auto;">
            The workforce accountability layer that maps your company hierarchy, tracks assignments with absolute clarity, and flags blockers transparently.
          </p>
        </div>
        <div style="display: flex; gap: 16px; margin-top: 16px;">
          <!-- Sign-In and Log-In route buttons -->
          <a href="#login" class="menu-item active" style="padding: 12px 24px; border-radius: var(--radius-md); font-weight: 600; text-decoration: none;">Sign In</a>
          <a href="#signup" class="menu-item" style="padding: 12px 24px; border-radius: var(--radius-md); border: 1px solid var(--border-neutral); background-color: var(--bg-primary); text-decoration: none;">Register Company</a>
        </div>
      </header>

      <!-- Features Section -->
      <section style="display: flex; flex-direction: column; gap: 32px;">
        <h2 class="section-title" style="text-align: center;">Operational Features & Trace Trails</h2>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 16px;">
          <!-- Card 1 -->
          <div class="widget-card">
            <h3 class="card-title" style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              Employee Visibility
            </h3>
            <p class="body-text">Radically simple user views. Submit progress, raise formal blockers, and pause deadlines without fearing unfair performance marks.</p>
          </div>

          <!-- Card 2 -->
          <div class="widget-card">
            <h3 class="card-title" style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              Managerial Controls
            </h3>
            <p class="body-text">Track workloads directly prior to delegation, resolve active blockers prompt alerts, and review task reassignment histories.</p>
          </div>

          <!-- Card 3 -->
          <div class="widget-card">
            <h3 class="card-title" style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              Corporate Accountability
            </h3>
            <p class="body-text">Immutable trace trails record every delegation or status shift. Complete database tenant isolation prevents cross-tenant leaks.</p>
          </div>
        </div>
      </section>

      <!-- Pricing Plans (Section 4, G2) -->
      <section style="display: flex; flex-direction: column; gap: 32px; border-top: 1px solid var(--border-neutral); padding-top: 64px;">
        <h2 class="section-title" style="text-align: center;">Structured Subscription Plans</h2>
        <p class="body-text" style="text-align: center; max-width: 600px; margin: 0 auto;">Manual monetization controls built for company scales. Get 10% off for annual commitments.</p>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 16px;">
          <!-- Tier 1 -->
          <div class="widget-card" style="border: 1px solid var(--border-neutral);">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">Tier 1 (Startup)</span>
            <div class="page-title" style="font-size: 32px; margin: 16px 0;">Lifetime Free</div>
            <p class="body-text" style="margin-bottom: 24px;">For small organizations up to 10 employee accounts.</p>
            <div class="pill-badge status-success" style="font-size: 11px; width: 100%; justify-content: center;">Includes 10 user gate limit</div>
          </div>

          <!-- Tier 2 -->
          <div class="widget-card" style="border: 2px solid var(--accent-navy-primary); position: relative;">
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background-color: var(--accent-navy-primary); color: #FFFFFF; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-sm);">Popular</div>
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--accent-navy-primary);">Tier 2 (Growth)</span>
            <div class="page-title" style="font-size: 32px; margin: 16px 0;">999 MVR <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">/ month</span></div>
            <p class="body-text" style="margin-bottom: 24px;">For mid-scale organizations up to 100 employee accounts.</p>
            <div class="pill-badge status-info" style="font-size: 11px; width: 100%; justify-content: center;">Includes 100 user gate limit</div>
          </div>

          <!-- Tier 3 -->
          <div class="widget-card" style="border: 1px solid var(--border-neutral);">
            <span class="small-text" style="font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">Tier 3 (Enterprise)</span>
            <div class="page-title" style="font-size: 32px; margin: 16px 0;">5,000 MVR <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">/ month</span></div>
            <p class="body-text" style="margin-bottom: 24px;">For corporate networks exceeding 100 employee accounts.</p>
            <div class="pill-badge status-info" style="font-size: 11px; width: 100%; justify-content: center;">Unlimited user accounts</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; display: flex; flex-direction: column; gap: 8px;">
          <p class="body-text" style="font-weight: 600;">Need to expand your boundaries? Contact manual support triage:</p>
          <p class="data-number" style="color: var(--accent-navy-primary); font-size: 18px;">+960 7451198 / +960 7793811</p>
        </div>
      </section>
    </div>
  `;
}
