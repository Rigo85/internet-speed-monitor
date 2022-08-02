class SettingsRepository {
    constructor(dao) {
        this.dao = dao
    }

    createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            refreshTime INTEGER,
            intervalId INTEGER)`;
        return this.dao.run(sql);
    }

    create(refreshTime, intervalId) {
        return this.dao.run(
            `INSERT INTO settings (refreshTime, intervalId)
        VALUES (?, ?)`,
            [refreshTime, intervalId]);
    }

    updateIntervalId(intervalId = 0) {
        this.getSettings()
            .then(settings => {
                if (settings) {
                    return this.dao.run(
                        `UPDATE settings SET intervalId = ? WHERE id = ?`,
                        [intervalId, settings.id]
                    )
                }
                return undefined;
            })
            .catch(e => {
                console.error("updateIntervalId", e);
                return undefined;
            });
    }

    updateRefreshTime(refreshTime = 5 * 60 * 1000) {
        return this.getSettings()
            .then(settings => {
                if (settings) {
                    return this.dao.run(
                        `UPDATE settings SET refreshTime = ? WHERE id = ?`,
                        [refreshTime, settings.id]
                    )
                }
                return undefined;
            })
            .catch(e => {
                console.error("updateRefreshTime", e);
                return undefined;
            });
    }

    initSettings() {
        this.getSettings()
            .then(settings => {
                if (!settings) {
                    return this.create(5 * 60 * 1000, 0);
                }
                return undefined;
            })
            .catch(e => {
                console.error("getSettings", e);
                return undefined;
            });
    }

    getSettings() {
        return this.dao.get(`SELECT * FROM settings ORDER BY id limit 1`);
    }
}

module.exports = SettingsRepository;