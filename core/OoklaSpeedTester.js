'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function speedTest() {
    try {
        const {stdout, stderr} = await exec(`core/ookla-speedtest/${process.platform}/speedtest -f json`);
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
