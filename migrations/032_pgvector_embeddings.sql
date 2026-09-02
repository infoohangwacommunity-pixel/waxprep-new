CREATE EXTENSION IF NOT EXISTS pgvector;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_chunks' AND column_name = 'embedding') THEN
        ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector(1536);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_wax_id_embedding ON knowledge_chunks (wax_id, embedding vector_cosine_ops);
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 vector, vec2 vector) RETURNS FLOAT AS $$ SELECT 1 - (vec1 <=> vec2); $$ LANGUAGE SQL IMMUTABLE;
