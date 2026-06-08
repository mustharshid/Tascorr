// sanitize.js - Simple client-side HTML escaping utility to prevent XSS.

/**
 * Escapes characters that could be executed as HTML, protecting against XSS injections.
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') {
    return str === null || str === undefined ? '' : String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
