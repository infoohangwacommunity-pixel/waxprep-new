export function createAssessmentVerifier() {
  function validateAssessment(assessment) {
    const result = { valid: true, errors: [], warnings: [] };
    if (!assessment) { result.valid = false; result.errors.push('Assessment object is required'); return result; }
    if (!Array.isArray(assessment.questions)) { result.valid = false; result.errors.push('Assessment must have a questions array'); return result; }
    if (assessment.questions.length === 0) { result.valid = false; result.errors.push('Assessment must have at least one question'); return result; }
    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const prefix = `Question ${i + 1}`;
      if (!question.questionId || question.questionId.trim() === '') { result.errors.push(`${prefix}: Missing or empty questionId`); result.valid = false; }
      if (!question.question || question.question.trim() === '') { result.errors.push(`${prefix}: Missing or empty question text`); result.valid = false; }
      if (question.question.includes('[Question') && question.question.includes('AI to generate')) { result.errors.push(`${prefix}: Question appears to be a placeholder`); result.valid = false; }
      if (question.question.includes('<script')) { result.errors.push(`${prefix}: Potential XSS attempt detected`); result.valid = false; }
    }
    return result;
  }
  function validateResponseConsistency(assessment) {
    const result = { consistent: true, issues: [] };
    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const prefix = `Question ${i + 1}`;
      if (question.correctAnswer && !question.explanation) { result.issues.push(`${prefix}: Has correctAnswer but no explanation`); }
    }
    return result;
  }
  function validateFull(assessment) {
    const structuralResult = validateAssessment(assessment);
    const consistencyResult = validateResponseConsistency(assessment);
    return { ...structuralResult, consistency: consistencyResult, fullyValid: structuralResult.valid && consistencyResult.consistent };
  }
  return { validateAssessment, validateResponseConsistency, validateFull };
}
export default createAssessmentVerifier;
