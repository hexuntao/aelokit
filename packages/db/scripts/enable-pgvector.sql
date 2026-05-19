-- Enable pgvector extension for knowledge/RAG vector storage
-- This must be run before using the knowledge ingestion feature

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is installed
-- Query: SELECT * FROM pg_extension WHERE extname = 'vector';
