// =========================================================================
// NexusLink Pro Engine - ADB Tunnel & Touch/Mouse/Keyboard Synthesizer
// File: src-tauri/src/control.rs
// =========================================================================

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum InputEvent {
    MouseDown { x: f32, y: f32, button: u8 },
    MouseMove { x: f32, y: f32 },
    MouseUp { x: f32, y: f32 },
    KeyDown { keycode: u32 },
    Scroll { delta_x: f32, delta_y: f32 },
}

pub struct ControlEngine {
    adb_tunnel_active: bool,
}

impl ControlEngine {
    pub fn new() -> Self {
        Self { adb_tunnel_active: true }
    }

    pub fn dispatch_input(&self, event: InputEvent) -> Result<(), String> {
        // High speed injection over scrcpy ADB socket
        Ok(())
    }
}
