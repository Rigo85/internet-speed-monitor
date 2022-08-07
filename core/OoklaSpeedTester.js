'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require("path");

async function speedTest() {
    let ext;
    switch (process.platform) {
        case 'darwin':
            ext = '';
            break;
        case 'win32':
            ext = '.exe';
            break;
        default:
            ext = '';
            break;
    }

    try {
        const speedTestPath = path.join("core","ookla-speedtest",process.platform,`speedtest${ext}`);
        const {stdout, stderr} = await exec(`${speedTestPath} -f json`);
        if (stderr) {
            console.info("speedTest", stderr);
            return undefined;
        } else {
            const result = JSON.parse(stdout);
            return result.type === "result" ? {...result, updateAt: new Date()} : undefined;
        }
    } catch (e) {
        console.error("speedTest", e);
        return undefined;
    }
}

module.exports = {
    speedTest
};
