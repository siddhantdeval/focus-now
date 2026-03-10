const { db } = require('../db');

class SettingsService {
  constructor() {
    this.getStmt = db.prepare(`SELECT value FROM app_settings WHERE key = ?`);
    this.setStmt = db.prepare(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`);
    this.getAllStmt = db.prepare(`SELECT key, value FROM app_settings`);
  }

  getSetting(key) {
    const row = this.getStmt.get(key);
    return row ? row.value : null;
  }

  setSetting(key, value) {
    this.setStmt.run(key, String(value));
    return true;
  }

  getAllSettings() {
    const rows = this.getAllStmt.all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  }
}

module.exports = new SettingsService();
