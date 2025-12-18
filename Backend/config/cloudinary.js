const cloudinary = require('cloudinary').v2;

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  // Quick startup auth check to validate credentials and avoid confusing 502s later.
  const sanitizeError = (err) => {
    try {
      const raw = (err && err.message) ? err.message : String(err);
      const apiKey = process.env.CLOUDINARY_API_KEY;
      if (apiKey && raw.includes(apiKey)) {
        return raw.replace(new RegExp(apiKey, 'g'), '***REDACTED***');
      }
      return raw;
    } catch (e) {
      return 'Error (unable to sanitize)';
    }
  };

  // Run a harmless API call to verify credentials (max_results=1) and log result.
  cloudinary.api.resources({ max_results: 1 })
    .then(() => {
      console.log('[Cloudinary] credentials verified');
    })
    .catch((err) => {
      const sanitized = sanitizeError(err);
      // If Cloudinary returns 401, give a clear message
      if (err && err.http_code === 401) {
        console.error('[Cloudinary] Authentication failed on startup:', sanitized);
      } else {
        console.warn('[Cloudinary] Warning during startup:', sanitized);
      }
    });

} else {
  console.warn('[Cloudinary] Missing env vars. Uploads will fail until CLOUDINARY_* are set.');
}

module.exports = { cloudinary };
