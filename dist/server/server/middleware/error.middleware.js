"use strict";
// error.middleware.ts - Catch-all middleware for handling server exception boundaries.
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error('[Unhandled Server Error]:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected server error occurred.';
    // In production, mask stack traces. In development, include them for diagnostics.
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(status).json({
        error: isProduction ? 'Internal Server Error' : message,
        message: message,
        stack: isProduction ? undefined : err.stack,
    });
}
