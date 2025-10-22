class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

const sanitizeTaskId = (id) => {
  return id.replace(/[^a-zA-Z0-9-]/g, '');
};

const sanitizeDomain = (domain) => {
  return domain.replace(/[^a-zA-Z0-9.-]/g, '');
};


module.exports = {
  sanitizeTaskId,
  sanitizeDomain,
  ValidationError,
};
