const { db } = require('../db');

class ReportService {
  getDailySummary(dateUnix) {
    // Expected dateUnix in milliseconds (start of the day)
    const startOfDay = dateUnix;
    const endOfDay = dateUnix + 86400000;

    // SQLite doesn't natively do nice Date comparisons on millisecond unix timestamps out of the box
    // so we pass boundaries in milliseconds directly.
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as sessions,
        COALESCE(SUM(duration_seconds), 0) / 60 as focus_minutes
      FROM pomodoro_sessions
      WHERE is_completed = 1 AND start_time >= ? AND start_time < ?
    `);

    return stmt.get(startOfDay, endOfDay);
  }

  getWeeklySummary() {
    // Past 7 days
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 86400000);

    // Aggregate by day string (YYYY-MM-DD)
    const stmt = db.prepare(`
      SELECT
        date(start_time/1000, 'unixepoch', 'localtime') as day,
        COUNT(*) as sessions,
        COALESCE(SUM(duration_seconds), 0) / 60 as focus_minutes
      FROM pomodoro_sessions
      WHERE is_completed = 1 AND start_time >= ?
      GROUP BY day
      ORDER BY day ASC
    `);

    return stmt.all(sevenDaysAgo);
  }
}

module.exports = new ReportService();
