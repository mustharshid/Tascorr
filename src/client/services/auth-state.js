// auth-state.js - Manages logged-in session state, user details, and client-side access control.

import { fetchApi } from './api.js';

class AuthStateService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.initialized = false;
    
    // Load cached session details
    const savedUser = localStorage.getItem('tascorr_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.isAuthenticated = true;
      } catch (e) {
        localStorage.removeItem('tascorr_user');
      }
    }
  }

  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const data = await fetchApi('POST', '/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('tascorr_token', data.token);
    }
    this.currentUser = data.user;
    this.isAuthenticated = true;
    localStorage.setItem('tascorr_user', JSON.stringify(data.user));
    return data;
  }

  /**
   * Register a new company (tenant) and its admin account
   * @param {string} companyName 
   * @param {string} adminEmail 
   * @param {string} adminPassword 
   */
  async signup(companyName, adminEmail, adminPassword) {
    // We can call a public signup endpoint
    const data = await fetchApi('POST', '/auth/signup', {
      name: companyName,
      adminEmail,
      adminPassword
    });
    return data;
  }

  /**
   * Log out user
   */
  async logout() {
    try {
      await fetchApi('POST', '/auth/logout');
    } catch (e) {
      // Ignore network errors on logout to ensure local state gets cleared anyway
      console.warn('Network error during logout', e);
    }
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('tascorr_token');
    localStorage.removeItem('tascorr_user');
    window.location.hash = 'landing';
  }

  /**
   * Sync active session with server
   */
  async checkSession() {
    if (!localStorage.getItem('tascorr_token')) {
      this.currentUser = null;
      this.isAuthenticated = false;
      return null;
    }
    try {
      const data = await fetchApi('GET', '/auth/session');
      this.currentUser = data.user;
      this.isAuthenticated = true;
      localStorage.setItem('tascorr_user', JSON.stringify(data.user));
      return data.user;
    } catch (e) {
      this.currentUser = null;
      this.isAuthenticated = false;
      localStorage.removeItem('tascorr_token');
      localStorage.removeItem('tascorr_user');
      return null;
    } finally {
      this.initialized = true;
    }
  }

  /**
   * Convenience hierarchy level checks
   * Lower rank level means higher authority (0 = Company Admin, 1 = Executive, 2 = Dept Head, etc.)
   */
  isAdmin() {
    return this.isAuthenticated && this.currentUser && this.currentUser.rankLevel === 0;
  }

  isExecutive() {
    return this.isAuthenticated && this.currentUser && this.currentUser.rankLevel <= 1;
  }

  isDeptHead() {
    return this.isAuthenticated && this.currentUser && this.currentUser.rankLevel <= 2;
  }

  isManager() {
    return this.isAuthenticated && this.currentUser && this.currentUser.rankLevel <= 3;
  }

  isSuperadmin() {
    // Superadmin has a special flag or has tenantId = 0
    // The session endpoint does not return tenantId to keep it lean, but we can verify it
    // from the email/profile or a flag in session.
    // If user has rankLevel 0 and is on tenant 0, but since we are multi-tenant, 
    // superadmin is marked specifically or has email containing superadmin.
    // Let's check if they have rankTitle = 'Global Superadmin' or similar, 
    // or rankLevel === 0 and email has superadmin domain.
    // Wait, the auth session middleware checks token decodes tenantId === 0. Let's make sure
    // we set rankLevel 0.
    return this.isAuthenticated && this.currentUser && this.currentUser.email === 'superadmin@tascorr.com';
  }
}

export const AuthState = new AuthStateService();
export default AuthState;
