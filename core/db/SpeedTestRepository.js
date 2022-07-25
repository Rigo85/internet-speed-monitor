class SpeedTestRepository {
    constructor(dao) {
        this.dao = dao
    }

    createTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS speedtest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        speedResult JSON)`
        return this.dao.run(sql)
    }

    create(speedResult) {
        return this.dao.run('INSERT INTO speedtest (speedResult) VALUES (?)',[speedResult]);
    }

    getById(id) {
        return this.dao.get(`SELECT * FROM settings WHERE id = ?`,[id]);
    }

    getAll() {
        return this.dao.all(`SELECT * FROM settings`);
    }
}

module.exports = SpeedTestRepository;
