export function createAIEngine(options = {}) {
  const { knowledgeStore, assessmentVerifier } = options;
  async function processMessage(waxId, message, context = {}) {
    const response = {
      text: _generateResponse(message),
      context: { waxId, timestamp: new Date().toISOString() },
    };
    if (context.assessmentId && assessmentVerifier) {
      const assessment = context.assessment;
      const validation = assessmentVerifier.validateAssessment(assessment);
      if (!validation.valid) response.validationErrors = validation.errors;
    }
    return response;
  }
  function _generateResponse(message) {
    const lower = message.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) return 'Hello! How can I help you learn today?';
    if (lower.includes('help')) return 'I can help you with questions, practice problems, and learning resources. What would you like to explore?';
    return 'I understand. Tell me more about what you\'d like to learn or discuss.';
  }
  return { processMessage };
}
export default createAIEngine;
