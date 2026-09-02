export function createKnowledgeStore(db, options = {}) {
  const { embeddingModel } = options;
  async function storeKnowledge(waxId, subject, topic, content, metadata = {}) {
    const waxIdResult = await db.query('SELECT id FROM students WHERE wax_id = $1', [waxId]);
    if (waxIdResult.rows.length === 0) return { error: 'Student not found' };
    const studentId = waxIdResult.rows[0].id;
    const chunk = {
      wax_id: waxId,
      student_id: studentId,
      subject,
      topic,
      content,
      metadata: JSON.stringify(metadata),
      embedding: embeddingModel ? await _generateEmbedding(content) : null,
    };
    const r = await db.query(`
      INSERT INTO knowledge_chunks (wax_id, student_id, subject, topic, content, metadata, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `, [chunk.wax_id, chunk.student_id, chunk.subject, chunk.topic, chunk.content, chunk.metadata, chunk.embedding]);
    return { id: r.rows[0].id, createdAt: r.rows[0].created_at };
  }
  async function _generateEmbedding(text) {
    if (!embeddingModel) return null;
    try { return await embeddingModel.embed(text); } catch (e) { console.error('Embedding error:', e); return null; }
  }
  async function findSimilarKnowledge(waxId, query, options = {}) {
    const { topK = 5, minSimilarity = 0.7 } = options;
    const waxIdResult = await db.query('SELECT id FROM students WHERE wax_id = $1', [waxId]);
    if (waxIdResult.rows.length === 0) return { results: [], waxId };
    const studentId = waxIdResult.rows[0].id;
    const queryEmbedding = embeddingModel ? await _generateEmbedding(query) : null;
    if (queryEmbedding) {
      const r = await db.query(`
        SELECT id, subject, topic, content, metadata, embedding <=> $1 AS similarity
        FROM knowledge_chunks
        WHERE wax_id = $2 AND student_id = $3
        ORDER BY similarity
        LIMIT $4
      `, [queryEmbedding, waxId, studentId, topK]);
      return { results: r.rows.map(r => ({ id: r.id, subject: r.subject, topic: r.topic, content: r.content, metadata: JSON.parse(r.metadata), similarity: parseFloat(r.similarity) })), waxId };
    }
    return { results: [], waxId };
  }
  return { storeKnowledge, findSimilarKnowledge };
}
export default createKnowledgeStore;
