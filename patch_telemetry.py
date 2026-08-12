with open("src-tauri/src/main.rs", "r") as f:
    content = f.read()

# Add LiveTelemetry struct
telemetry_struct = """
#[derive(Serialize, Deserialize, Clone)]
pub struct LiveTelemetry {
    pub audio_latency_ms: f32,
    pub video_latency_ms: f32,
    pub fps: u32,
    pub jitter_ms: f32,
    pub packet_loss_percent: f32,
    pub throughput_mbps: f32,
}
"""

content = content.replace("#[tauri::command]\nasync fn start_telemetry_stream", telemetry_struct + "\n#[tauri::command]\nasync fn start_telemetry_stream")

with open("src-tauri/src/main.rs", "w") as f:
    f.write(content)
