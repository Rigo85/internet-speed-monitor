'use strict';

const {UniversalSpeedtest, SpeedUnits} = require('universal-speedtest');

async function speedTest() {
    const universalSpeedtest = new UniversalSpeedtest({
        measureUpload: true,
        // downloadUnit: SpeedUnits.MBps,
        // uploadUnit: SpeedUnits.MBps,
        timeout: 120,
        wait: true
    });

    try {
        const result = await universalSpeedtest.runSpeedtestNet();
        return {...result, updateAt: new Date()}
    } catch (e) {
        console.error("speedTest", e);
        return undefined;
    }
}

module.exports = {
    speedTest
};
