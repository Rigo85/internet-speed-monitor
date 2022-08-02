'use strict';

const SettingsRepository = require("./db/SettingsRepository");
const SpeedTestRepository = require("./db/SpeedTestRepository");
const AppDAO = require("./db/AppDAO");

class Settings {
    constructor() {
        try {
            this.dao = new AppDAO('./database.sqlite3');
            this.settingsRepository = new SettingsRepository(this.dao);
            this.speedTestRepository = new SpeedTestRepository(this.dao);
            Promise.all([
                this.settingsRepository.createTable(),
                this.speedTestRepository.createTable()
            ]).then(() => {
                    this.settingsRepository.initSettings();
                }
            );
        } catch (e) {
            console.error("Settings Constructor", e);
        }
    }

    setIntervalId(intervalId) {
        return this.settingsRepository.updateIntervalId(intervalId);
    }

    getIntervalId() {
        return this.settingsRepository.getSettings();
    }

    getRefreshTime() {
        return this.settingsRepository.getSettings()
            .then(settings => {
                return (settings || {refreshTime: 5 * 60 * 1000}).refreshTime;
            })
            .catch(e => {
                console.error("getRefreshTime", e);
                return 5 * 60 * 1000;
            });
    }

    setRefreshTime(refreshTime) {
        return this.settingsRepository.updateRefreshTime(refreshTime);
    }

    addSpeedTest(speedResult) {
        return this.speedTestRepository.create(speedResult);
    }

    getSettings() {
        return this.settingsRepository.getSettings();
    }

    getSpeedHistory() {
        return this.speedTestRepository.getAllData()
            .then(data => data.map(d => ({
                    ...d,
                    UpdateAt: Intl.DateTimeFormat('en', {
                        day: "2-digit",
                        dayPeriod: "long",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true
                    }).format(new Date(d.UpdateAt))
                }))
            );
    }
}

module.exports = Settings;
