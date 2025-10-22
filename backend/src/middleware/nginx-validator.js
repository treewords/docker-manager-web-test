const { body, validationResult } = require('express-validator');

const validateNginxTask = [
  body('domain').isFQDN().withMessage('Invalid domain format'),
  body('port').isInt({ min: 1024, max: 65535 }).withMessage('Port must be between 1024 and 65535'),
  body('cors_origins').optional().isArray().withMessage('CORS origins must be an array'),
  body('cors_origins.*').isURL().withMessage('Invalid URL in CORS origins'),
  body('upstreams').optional().isArray().withMessage('Upstreams must be an array'),
  body('upstreams.*.host').isIP().withMessage('Invalid IP address in upstreams'),
  body('upstreams.*.port').isInt({ min: 1, max: 65535 }).withMessage('Invalid port in upstreams'),
  body('ssl').optional().isObject().withMessage('SSL must be an object'),
  body('ssl.enabled').optional().isBoolean().withMessage('SSL enabled must be a boolean'),
  body('ssl.email').optional().isEmail().withMessage('Invalid email for SSL'),
  body('rateLimit').optional().isObject().withMessage('Rate limit must be an object'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  validateNginxTask,
};
