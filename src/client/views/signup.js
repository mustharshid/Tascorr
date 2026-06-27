// signup.js - Company self-registration signup view.
// Enforces password security validations (mixed case, numbers, symbols, 12+ characters).

import { AuthState } from '../services/auth-state.js';
import { Notifications } from '../services/notifications.js';

export function renderSignupView() {
  return `
    <div style="max-width: 480px; margin: 40px auto; padding: 32px; background-color: var(--bg-primary); border: 1px solid var(--border-neutral); border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; gap: 24px;">
      
      <!-- Logo & Header -->
      <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <img src="/tascorrLogo.png" alt="Tascorr Logo" style="width: 48px; height: 48px; object-fit: contain;" onerror="this.style.display='none'">
        <div>
          <h2 class="section-title" style="font-size: 24px; font-weight: 700;">Register your company</h2>
          <p class="small-text" style="margin-top: 4px;">Set up a new isolated organization tenant workspace.</p>
        </div>
      </div>

      <!-- Alert -->
      <div id="signup-error-alert" style="display: none; padding: 12px; background-color: rgba(220, 38, 38, 0.1); color: var(--status-danger); font-size: 13px; font-weight: 500; border-radius: var(--radius-md); border-left: 3px solid var(--status-danger);">
      </div>

      <!-- Signup Form -->
      <form id="signup-form" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Company Name -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-company" class="small-text" style="font-weight: 600; color: var(--text-primary);">Company / Organization Name</label>
          <input type="text" id="signup-company" required maxlength="100" placeholder="Acme Corporation" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <!-- Admin Email -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-email" class="small-text" style="font-weight: 600; color: var(--text-primary);">Administrator Email Address</label>
          <input type="email" id="signup-email" required maxlength="254" autocomplete="email" placeholder="admin@company.com" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
        </div>

        <!-- Admin Password -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-password" class="small-text" style="font-weight: 600; color: var(--text-primary);">Administrator Password</label>
          <div style="position: relative; width: 100%;">
            <input type="password" id="signup-password" required maxlength="128" autocomplete="new-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="width: 100%; padding: 10px 40px 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
            <button type="button" class="password-toggle-btn" data-target="signup-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; z-index: 5;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          
          <!-- Password Checklist -->
          <div style="margin-top: 6px; padding: 10px; background-color: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-neutral); display: flex; flex-direction: column; gap: 4px;">
            <div class="small-text" style="font-weight: 600; margin-bottom: 2px;">Complexity Requirements:</div>
            <div id="req-length" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least 12 characters</div>
            <div id="req-case" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; Mixed case (uppercase & lowercase)</div>
            <div id="req-number" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least one number</div>
            <div id="req-symbol" class="small-text" style="color: var(--status-danger); display: flex; align-items: center; gap: 6px;">&bull; At least one special symbol</div>
          </div>
        </div>

        <!-- Confirm Password -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label for="signup-confirm-password" class="small-text" style="font-weight: 600; color: var(--text-primary);">Confirm Password</label>
          <div style="position: relative; width: 100%;">
            <input type="password" id="signup-confirm-password" required maxlength="128" autocomplete="new-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" style="width: 100%; padding: 10px 40px 10px 12px; border: 1px solid var(--border-neutral); border-radius: var(--radius-md); font-family: var(--font-text); font-size: 13px; background-color: var(--bg-secondary); color: var(--text-primary); outline: none; transition: border-color 0.15s ease;" />
            <button type="button" class="password-toggle-btn" data-target="signup-confirm-password" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; z-index: 5;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="justify-content: center; padding: 12px; border: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
          Register & Create Workspace
        </button>
      </form>

      <div style="text-align: center; border-top: 1px solid var(--border-neutral); padding-top: 16px;">
        <span class="small-text">Already registered?</span>
        <a href="#login" class="small-text" style="color: var(--accent-navy-primary); font-weight: 600; text-decoration: none; margin-left: 4px;">Sign In</a>
      </div>
    </div>
  `;
}

/**
 * Handle form submission and real-time password strength checks
 */
export function initSignupListeners() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const companyInput = document.getElementById('signup-company');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  const errorAlert = document.getElementById('signup-error-alert');

  // Regex rules matching custom validation helper
  const rules = {
    length: (val) => val.length >= 12,
    case: (val) => /[a-z]/.test(val) && /[A-Z]/.test(val),
    number: (val) => /[0-9]/.test(val),
    symbol: (val) => /[^a-zA-Z0-9]/.test(val),
  };

  // Real-time password check
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    updateRuleStyle('req-length', rules.length(val));
    updateRuleStyle('req-case', rules.case(val));
    updateRuleStyle('req-number', rules.number(val));
    updateRuleStyle('req-symbol', rules.symbol(val));
  });

  function updateRuleStyle(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isValid) {
      el.style.color = 'var(--status-success)';
      el.innerHTML = `&#10003; ${el.innerText.replace('✓', '').replace('•', '').trim()}`;
    } else {
      el.style.color = 'var(--status-danger)';
      el.innerHTML = `&bull; ${el.innerText.replace('✓', '').replace('•', '').trim()}`;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const companyName = companyInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.innerText = '';
    }

    // Edge-case input validation
    if (!companyName || !email || !password || !confirmPassword) {
      showError('Please populate all required details.');
      return;
    }

    // Company name constraints
    if (companyName.length < 2) {
      showError('Company name must be at least 2 characters.');
      return;
    }
    if (companyName.length > 100) {
      showError('Company name cannot exceed 100 characters.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    // Enforce constraints
    if (!rules.length(password) || !rules.case(password) || !rules.number(password) || !rules.symbol(password)) {
      showError('Password does not meet all required complexity parameters.');
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Workspace...';
      }

      await AuthState.signup(companyName, email, password);

      Notifications.success('Account Created', 'Company registered successfully. Please log in.');
      window.location.hash = 'login';
    } catch (err) {
      console.error(err);
      showError(err.message || 'Workspace signup failed. Please try again.');
      Notifications.error('Signup Failed', err.message || 'Check submission details.');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Register & Create Workspace';
      }
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.innerText = msg;
      errorAlert.style.display = 'block';
    }
  }
}
