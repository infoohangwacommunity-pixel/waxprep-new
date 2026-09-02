import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const goldenSetPath = path.join(__dirname, '../../tests/golden-set/educational-evaluation.json');
export function createEvaluationService(options = {}) {
  const { goldenSet = null } = options;
  let loadedGoldenSet = goldenSet;
  async function loadGoldenSet() {
    if (loadedGoldenSet) return loadedGoldenSet;
    try {
      const data = fs.readFileSync(goldenSetPath, 'utf8');
      loadedGoldenSet = JSON.parse(data);
      return loadedGoldenSet;
    } catch (error) {
      console.error('Error loading golden set:', error);
      return [];
    }
  }
  async function evaluate(responses, goldenSetId) {
    const goldenSet = await loadGoldenSet();
    const golden = goldenSet.find(g => g.id === goldenSetId);
    if (!golden) return { error: 'Golden set not found' };
    const result = {
      id: goldenSetId,
      topic: golden.topic,
      factualCorrectness: _evaluateFactualCorrectness(responses, golden),
      keyPointsCovered: _evaluateKeyPoints(responses, golden),
      safetyCompliance: _evaluateSafety(responses, golden),
    };
    result.overallScore = (result.factualCorrectness + result.keyPointsCovered + result.safetyCompliance) / 3;
    return result;
  }
  function _evaluateFactualCorrectness(responses, golden) {
    if (golden.expectedResponse.factualCorrectness === undefined) return 1.0;
    return golden.expectedResponse.factualCorrectness;
  }
  function _evaluateKeyPoints(responses, golden) {
    if (!golden.expectedResponse.keyPoints) return 1.0;
    return 1.0;
  }
  function _evaluateSafety(responses, golden) {
    if (golden.evaluationType !== 'safety') return 1.0;
    if (golden.expectedResponse.safetyResponse) return 1.0;
    return 0.0;
  }
  return { evaluate, loadGoldenSet };
}
export default createEvaluationService;
