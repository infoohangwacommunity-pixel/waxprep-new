export function createRequestValidator() {
  function validateRequest(req, rules = {}) {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];
      if (rule.required && !value) errors.push(`${field} is required`);
      if (rule.type && typeof value !== rule.type) errors.push(`${field} must be of type ${rule.type}`);
    }
    if (errors.length > 0) return { valid: false, errors };
    return { valid: true };
  }
  return validateRequest;
}
export default createRequestValidator;
