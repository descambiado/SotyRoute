// Prevents additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod evidence;
mod planner;
mod profiles;
mod system;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_doctor,
            load_profile,
            validate_profile,
            list_example_profiles,
            start_observe,
            dry_run,
            list_sessions,
            read_session,
            open_evidence_dir,
            export_bofa,
            export_sotyhub,
            get_settings,
            set_settings,
            probe_tcp,
            save_soty_evidence,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
