export function createDataDeletionManager(db, options = {}) {
  const { redis, deleteEmbeddings } = options;
  async function deleteStudentData(waxId, options = {}) {
    const { verifyOwnership = true } = options;
    if (verifyOwnership) {
      const r = await db.query('SELECT id FROM students WHERE wax_id = $1', [waxId]);
      if (r.rows.length === 0) return { success: true, message: 'Student not found', deleted: [] };
    }
    const studentResult = await db.query('SELECT id, wax_id FROM students WHERE wax_id = $1', [waxId]);
    if (studentResult.rows.length === 0) return { success: true, message: 'Student not found', deleted: [] };
    const studentId = studentResult.rows[0].id;
    const deleted = [];
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const semanticResult = await client.query('DELETE FROM memories_semantic WHERE student_id = $1 RETURNING id', [studentId]);
      if (semanticResult.rowCount > 0) deleted.push(`semantic_memories: ${semanticResult.rowCount}`);
      const coreResult = await client.query('DELETE FROM core_memory WHERE student_id = $1 RETURNING id', [studentId]);
      if (coreResult.rowCount > 0) deleted.push(`core_memories: ${coreResult.rowCount}`);
      const episodicResult = await client.query('DELETE FROM memories_episodic WHERE student_id = $1 RETURNING id', [studentId]);
      if (episodicResult.rowCount > 0) deleted.push(`episodic_memories: ${episodicResult.rowCount}`);
      const knowledgeResult = await client.query('DELETE FROM student_knowledge WHERE wax_id = $1 RETURNING id', [waxId]);
      if (knowledgeResult.rowCount > 0) deleted.push(`knowledge_state: ${knowledgeResult.rowCount}`);
      const conversationsResult = await client.query('DELETE FROM conversations WHERE wax_id = $1 RETURNING id', [waxId]);
      if (conversationsResult.rowCount > 0) deleted.push(`conversations: ${conversationsResult.rowCount}`);
      const messagesResult = await client.query('DELETE FROM messages WHERE wax_id = $1 RETURNING id', [waxId]);
      if (messagesResult.rowCount > 0) deleted.push(`messages: ${messagesResult.rowCount}`);
      const toolCallsResult = await client.query('DELETE FROM tool_calls WHERE wax_id = $1 RETURNING id', [waxId]);
      if (toolCallsResult.rowCount > 0) deleted.push(`tool_calls: ${toolCallsResult.rowCount}`);
      const consentResult = await client.query('DELETE FROM consent_records WHERE student_id = $1 RETURNING id', [studentId]);
      if (consentResult.rowCount > 0) deleted.push(`consent_records: ${consentResult.rowCount}`);
      const taskResult = await client.query('DELETE FROM task_session_state WHERE wax_id = $1 RETURNING id', [waxId]);
      if (taskResult.rowCount > 0) deleted.push(`task_session_state: ${taskResult.rowCount}`);
      const guardianResult = await client.query('DELETE FROM guardian_relationships WHERE student_id = $1 RETURNING id', [studentId]);
      if (guardianResult.rowCount > 0) deleted.push(`guardian_relationships: ${guardianResult.rowCount}`);
      const identityResult = await client.query('DELETE FROM channel_identities WHERE student_id = $1 RETURNING id', [studentId]);
      if (identityResult.rowCount > 0) deleted.push(`channel_identities: ${identityResult.rowCount}`);
      const threadsResult = await client.query(`DELETE FROM conversation_threads WHERE wax_id = $1 AND NOT EXISTS (SELECT 1 FROM conversations WHERE thread_id = conversation_threads.id) RETURNING id`, [waxId]);
      if (threadsResult.rowCount > 0) deleted.push(`conversation_threads: ${threadsResult.rowCount}`);
      const studentDeleteResult = await client.query('DELETE FROM students WHERE wax_id = $1 RETURNING wax_id', [waxId]);
      if (studentDeleteResult.rowCount > 0) deleted.push(`student_record: 1`);
      await client.query('COMMIT');
      if (deleteEmbeddings) { try { await deleteEmbeddings(waxId); deleted.push('embeddings: deleted'); } catch (e) { console.error('Error deleting embeddings:', e); } }
      if (redis) { try { const cacheKeys = await redis.keys(`wax:${waxId}:*`); if (cacheKeys.length > 0) { await redis.del(...cacheKeys); deleted.push(`redis_cache: ${cacheKeys.length}`); } } catch (e) { console.error('Error cleaning up Redis:', e); } }
      await _logDeletion(waxId, deleted);
      return { success: true, message: 'All student data has been permanently deleted', deleted, deletedAt: new Date().toISOString() };
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Deletion failed', details: error.message };
    } finally { client.release(); }
  }
  async function _logDeletion(waxId, deleted) {
    try { await db.query(`INSERT INTO identity_audit_log (wax_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`, [waxId, 'DATA_DELETED', JSON.stringify({ deleted })]); } catch (e) { console.error('Error logging deletion:', e); }
  }
  return { deleteStudentData };
}
export default createDataDeletionManager;
