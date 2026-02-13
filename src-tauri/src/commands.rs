use std::fs;
use std::path::PathBuf;

use base64::Engine;
use tauri::State;

use crate::watcher;
use crate::workspace;

pub struct WorkspacePath(pub PathBuf);

#[tauri::command]
pub fn get_initial_sb3(state: State<'_, WorkspacePath>) -> Result<String, String> {
    let sb3 = workspace::build_sb3(&state.0).ok_or("Failed to build SB3")?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&sb3);
    Ok(encoded)
}

#[tauri::command]
pub fn save_project_from_editor(
    state: State<'_, WorkspacePath>,
    sb3_base64: String,
) -> Result<(), String> {
    let data = base64::engine::general_purpose::STANDARD
        .decode(&sb3_base64)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    log::info!(
        "[live-scratch] received sb3 from editor ({} bytes)",
        data.len()
    );

    watcher::set_ignore(true);
    workspace::extract_sb3(&state.0, &data);

    // Reset ignore flag after a delay (matches server.js behavior)
    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(1000));
        watcher::set_ignore(false);
    });

    Ok(())
}

#[tauri::command]
pub fn get_workspace_path(state: State<'_, WorkspacePath>) -> String {
    state.0.to_string_lossy().to_string()
}

#[tauri::command]
pub async fn open_sb3_file(
    app: tauri::AppHandle,
    state: State<'_, WorkspacePath>,
) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Scratch 3 Project", &["sb3"])
        .blocking_pick_file();

    let file_path = match file_path {
        Some(f) => f,
        None => return Ok(()), // User cancelled
    };

    let path = file_path.as_path().ok_or("Invalid file path")?;
    let data = fs::read(path).map_err(|e| format!("Failed to read file: {}", e))?;

    watcher::set_ignore(true);
    workspace::extract_sb3(&state.0, &data);

    // Build new SB3 and emit to frontend
    if let Some(sb3) = workspace::build_sb3(&state.0) {
        let encoded = base64::engine::general_purpose::STANDARD.encode(&sb3);
        use tauri::Emitter;
        app.emit("sb3-updated", &encoded)
            .map_err(|e| format!("Failed to emit: {}", e))?;
    }

    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(1000));
        watcher::set_ignore(false);
    });

    Ok(())
}

#[tauri::command]
pub async fn export_sb3_file(
    app: tauri::AppHandle,
    state: State<'_, WorkspacePath>,
) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Scratch 3 Project", &["sb3"])
        .set_file_name("project.sb3")
        .blocking_save_file();

    let file_path = match file_path {
        Some(f) => f,
        None => return Ok(()), // User cancelled
    };

    let sb3 = workspace::build_sb3(&state.0).ok_or("Failed to build SB3")?;
    fs::write(file_path.as_path().unwrap(), &sb3)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    log::info!("[live-scratch] exported SB3 to {:?}", file_path);
    Ok(())
}

#[tauri::command]
pub fn open_workspace_in_finder(state: State<'_, WorkspacePath>) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(&*state.0)
        .spawn()
        .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    Ok(())
}
