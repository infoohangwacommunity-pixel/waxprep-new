export function createDataExportManager(db) {
  async function exportStudentData(waxId, options = {}) {
    const { format = 'json', collections = null } = options;
    const exportData = {
      metadata: { exportDate: new Date().toISOString(), waxId, format, version: '1.0' },
      collections: {},
    };
    if (!collections || collections.includes('profile')) exportData.collections.profile = await _exportProfile(waxId);
    if (!collections || collections.includes('memories')) exportData.collections.memories = await _exportMemories(waxId);
    if (!collections || collections.includes('conversations')) exportData.collections.conversations = await _exportConversations(waxId);
    if (!collections || collections.includes('knowledge')) exportData.collections.knowledge = await _exportKnowledge(waxId);
    return exportData;
  }
  async function _exportProfile(waxId) {
    const r = await db.query(`SELECT s.*, ci.channel_id, ci.provider FROM students s LEFT JOIN channel_identities ci ON s.id = ci.student_id WHERE s.wax_id = $1`, [waxId]);
    if (r.rows.length === 0) return { error: 'Student not found' };
    const s = r.rows[0];
    return { displayName: s.display_name, languagePreference: s.language_preference, timezone: s.timezone, createdAt: s.created_at, lastActiveAt: s.last_active_at };
  }
  async function _exportMemories(waxId) {
    const waxIdResult = await db.query('SELECT id FROM students WHERE wax_id = $1', [waxId]);
    if (waxIdResult.rows.length === 0) return { error: 'Student not found' };
    const studentId = waxIdResult.rows[0].id;
    const semanticResult = await db.query(`SELECT id, content, category, tags, confidence, created_at FROM memories_semantic WHERE student_id = $1 ORDER BY created_at DESC`, [studentId]);
    const coreResult = await db.query(`SELECT id, content, category, created_at, expires_at FROM core_memory WHERE student_id = $1 ORDER BY created_at DESC`, [studentId]);
    return {
      semantic: semanticResult.rows.map(r => ({ id: r.id, content: r.content, category: r.category, tags: r.tags, confidence: parseFloat(r.confidence), createdAt: r.created_at })),
      core: coreResult.rows.map(r => ({ id: r.id, content: r.content, category: r.category, createdAt: r.created_at, expiresAt: r.expires_at })),
    };
  }
  async function _exportConversations(waxId) {
    const r = await db.query(`SELECT id, wax_id, created_at, updated_at, thread_id FROM conversations WHERE wax_id = $1 ORDER BY created_at DESC`, [waxId]);
    return { count: r.rows.length, conversations: r.rows.map(r => ({ id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, threadId: r.thread_id })) };
  }
  async function _exportKnowledge(waxId) {
    const r = await db.query(`SELECT subject, topic, mastery_level, attempts, correct, last_practiced_at FROM student_knowledge WHERE wax_id = $1 ORDER BY subject, topic`, [waxId]);
    return {
      topics: r.rows.map(r => ({ subject: r.subject, topic: r.topic, masteryLevel: parseFloat(r.mastery_level), attempts: parseInt(r.attempts), correct: parseInt(r.correct), lastPracticedAt: r.last_practiced_at })),
      summary: { totalTopics: r.rows.length, averageMastery: r.rows.length > 0 ? r.rows.reduce((sum, r) => sum + parseFloat(r.mastery_level), 0) / r.rows.length : 0 },
    };
  }
  return { exportStudentData };
}
export default createDataExportManager;
