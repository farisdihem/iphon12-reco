// =========================================================================
// NexusLink Pro Engine - File Bridge Engine
// File: src-tauri/src/files.rs
// =========================================================================

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileChunk {
    pub transfer_id: String,
    pub chunk_index: u32,
    pub total_chunks: u32,
    pub sha256_hash: String,
    pub data_base64: String,
}

pub struct FileBridge {
    chunk_size_bytes: usize,
}

impl FileBridge {
    pub fn new(chunk_size_bytes: usize) -> Self {
        Self { chunk_size_bytes }
    }

    pub fn process_chunk(&self, chunk: FileChunk) -> Result<f32, String> {
        let progress = (chunk.chunk_index as f32 + 1.0) / (chunk.total_chunks as f32) * 100.0;
        Ok(progress)
    }
}
