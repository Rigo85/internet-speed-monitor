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
        return this.dao.get(`SELECT * FROM speedtest WHERE id = ?`,[id]);
    }

    getAll() {
        return this.dao.all(`SELECT * FROM speedtest`);
    }

    getAllData() {
        return this.dao.all(`
            select
                id,
                "speedResult" ->> 'downloadSpeed' as "DownloadSpeed",
                "speedResult" ->> 'uploadSpeed' as "UploadSpeed",
                "speedResult" ->> 'ping' as "Ping",
                "speedResult" ->> 'jitter' as "Jitter",
                "speedResult" ->> 'updateAt' as "UpdateAt",
                "speedResult" -> 'client' ->> 'isp' as "ISP",
                "speedResult" -> 'server' ->> 'sponsor' as "Server",
                "speedResult" -> 'server' ->> 'country' as "Server Country",
                "speedResult" -> 'server' ->> 'city' as "Server City",
                "speedResult" -> 'server' ->> 'distance' as "Server Distance"
            from speedtest
            order by
                id desc ;
        `);
    }
}

module.exports = SpeedTestRepository;
