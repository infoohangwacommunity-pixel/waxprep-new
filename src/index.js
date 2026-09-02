import express from 'express';
import { createAuthMiddleware } from './auth/middleware.js';
import { createRequestValidator } from './middleware/requestValidator.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { createLogger } from './utils/logger.js';
import { createCrisisDetector } from './safety/crisisDetector.js';
import { createDataExportManager } from './data/export.js';
import { createDataDeletionManager } from './data/deletion.js';
import { createKnowledgeStore } from './knowledge/knowledgeStore.js';
import { createAssessmentVerifier } from './tools/educational/assessmentVerify.js';
import { createToolRegistry } from './tools/registry.js';
import { createAIEngine } from './ai/engine.js';
import { createEvaluationService } from './ai/evaluation.js';
const app = express();
const logger = createLogger();
const authMiddleware = createAuthMiddleware();
const requestValidator = createRequestValidator();
const rateLimiter = createRateLimiter();
const crisisDetector = createCrisisDetector();
const dataExportManager = createDataExportManager();
const dataDeletionManager = createDataDeletionManager();
const knowledgeStore = createKnowledgeStore();
const assessmentVerifier = createAssessmentVerifier();
const toolRegistry = createToolRegistry();
const aiEngine = createAIEngine();
const evaluationService = createEvaluationService();
app.use(express.json());
app.use('/api/data/export', authMiddleware, rateLimiter, requestValidator, async (req, res) => {
  try {
    const waxId = req.user.waxId;
    const exportData = await dataExportManager.exportStudentData(waxId, req.query);
    res.json(exportData);
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});
app.use('/api/data/delete', authMiddleware, rateLimiter, requestValidator, async (req, res) => {
  try {
    const waxId = req.user.waxId;
    const result = await dataDeletionManager.deleteStudentData(waxId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Deletion error:', error);
    res.status(500).json({ error: 'Deletion failed' });
  }
});
app.use('/api/ai/chat', authMiddleware, rateLimiter, requestValidator, async (req, res) => {
  try {
    const { message, context } = req.body;
    const crisis = crisisDetector.detectCrisis(message);
    if (crisis.isCrisis) {
      const response = crisisDetector.getCrisisResponse(crisis.type);
      return res.json({ response, crisis: true });
    }
    const aiResponse = await aiEngine.processMessage(waxId, message, context);
    res.json(aiResponse);
  } catch (error) {
    logger.error('AI error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});
app.use('/api/tools/assessment_verify', authMiddleware, rateLimiter, requestValidator, async (req, res) => {
  try {
    const { assessment } = req.body;
    const result = assessmentVerifier.validateFull(assessment);
    res.json(result);
  } catch (error) {
    logger.error('Assessment verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});
app.use('/api/evaluate', authMiddleware, rateLimiter, requestValidator, async (req, res) => {
  try {
    const { responses, goldenSetId } = req.body;
    const result = await evaluationService.evaluate(responses, goldenSetId);
    res.json(result);
  } catch (error) {
    logger.error('Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
export default app;
