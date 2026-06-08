// notifications.js - Non-intrusive floating toast notifications system.
// Aligns with design.md specifications for micro-interactions and status alert colors.

class NotificationService {
  constructor() {
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      max-width: 380px;
      width: calc(100vw - 48px);
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Display a notification toast
   * @param {string} type - 'success' | 'warning' | 'danger' | 'info'
   * @param {string} title - Heading text
   * @param {string} message - Body description
   * @param {number} [duration=4000] - Lifespan in ms
   */
  show(type, title, message, duration = 4000) {
    this.initContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.style.cssText = `
      background-color: var(--bg-primary);
      border: 1px solid var(--border-neutral);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      position: relative;
      overflow: hidden;
    `;

    // Left color accent bar
    const accentColors = {
      success: 'var(--status-success)',
      warning: 'var(--status-warning)',
      danger: 'var(--status-danger)',
      info: 'var(--status-info)'
    };
    const color = accentColors[type] || 'var(--text-secondary)';

    const borderBar = document.createElement('div');
    borderBar.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: ${color};
    `;
    toast.appendChild(borderBar);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: absolute;
      right: 12px;
      top: 12px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--text-secondary);
      line-height: 1;
      padding: 4px;
    `;
    closeBtn.addEventListener('click', () => this.dismiss(toast));
    toast.appendChild(closeBtn);

    // Title
    const titleEl = document.createElement('strong');
    titleEl.className = 'data-number';
    titleEl.style.cssText = `
      font-size: 14px;
      color: var(--text-primary);
      padding-right: 16px;
    `;
    titleEl.innerText = title;
    toast.appendChild(titleEl);

    // Message
    const msgEl = document.createElement('p');
    msgEl.className = 'small-text';
    msgEl.style.cssText = `
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    `;
    msgEl.innerText = message;
    toast.appendChild(msgEl);

    this.container.appendChild(toast);

    // Trigger animation frame
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }

  success(title, message, duration) {
    this.show('success', title, message, duration);
  }

  warning(title, message, duration) {
    this.show('warning', title, message, duration);
  }

  error(title, message, duration) {
    this.show('danger', title, message, duration);
  }

  info(title, message, duration) {
    this.show('info', title, message, duration);
  }

  dismiss(toast) {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

export const Notifications = new NotificationService();
export default Notifications;
