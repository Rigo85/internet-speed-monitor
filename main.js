const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const log = require('electron-log');
Object.assign(console, log.functions);
const {speedTest} = require("./core/OoklaSpeedTester");
const Settings = require("./core/Settings");
const path = require("path");

let mainWindow, historyWindow, settingsWindow;
app.showExitPrompt = true;
const settings = new Settings();

app.whenReady().then(() => {
    setTimeout(() => {
        ipcMain.on("close-app", closeMainWindow);
        ipcMain.on("reload", reloadApp);
        ipcMain.on("speed-history", createHistoryWindow);
        ipcMain.on("app-settings", createAppSettingsWindow);
        ipcMain.on("update-refresh-time", updateRefreshTime);

        createMainWindow();

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        })

        refreshApp();
    }, 3000);
});

// ----------------------- Main Window --------------------
function formatSpeed(data) {
    return Number.parseFloat(`${data / 125000}`).toFixed(2);
}

function formatTime(date) {
    return Intl.DateTimeFormat('en', {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
    }).format(date);
}

function logging(data) {
    console.info("speed-update", JSON.stringify({
        time: formatTime(data.updateAt),
        downloadSpeed: formatSpeed(data.download.bandwidth),
        uploadSpeed: formatSpeed(data.upload.bandwidth)
    }));
}

function notify(data) {
    mainWindow.webContents.send(
        "speed-update",
        {
            time: formatTime(data.updateAt),
            downloadSpeed: formatSpeed(data.download.bandwidth),
            uploadSpeed: formatSpeed(data.upload.bandwidth)
        })
}

function saveOnDB(data) {
    settings.addSpeedTest(JSON.stringify(data));
}

function createMainWindow() {
    let width, height, icon;
    switch (process.platform) {
        case 'darwin':
            icon = 'resources/icon.icns';
            width = 400;
            height = 260;
            break;
        case 'win32':
            icon = 'resources/icon.ico';
            width = 400;
            height = 290;
            break;
        default:
            icon = 'resources/icon.png';
            width = 400;
            height = 260;
            break;
    }

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        // frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, "mvc/view/main/mainWindow.html"));
    mainWindow.removeMenu();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setResizable(false);
    mainWindow.setIcon(icon);
    mainWindow.on("close", closeMainWindow);
}

function closeMainWindow(event, value) {
    if (app.showExitPrompt) {
        if (process.platform !== 'darwin') {
            const buttons = {YES: 0, NO: 1};
            if (dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                type: "question",
                title: "Confirmation",
                message: "Are you sure you want to close the app?",
                buttons: ["Yes", "No"]
            }) === buttons.YES) {
                app.showExitPrompt = false;
                app.quit();
            } else {
                event.preventDefault();
            }
        }
    }
}

// todo crear un consumer que "haga algo" cuando un parámetro baje de un determinado umbral.
function reloadApp(event, value, consumers = [logging, notify, saveOnDB]) {
    console.info("reloading...");
    speedTest()
        .then(data => {
            if (data) {
                consumers.forEach(consumer => {
                    consumer(data);
                });
            }
        })
        .catch(e => {
            console.error("reloadApp", e);
            dialog.showErrorBox("Error", "Error testing internet speed.");
        });
}

function refreshApp() {
    try {
        settings.getSettings()
            .then(dbSettings => {
                if (dbSettings) {
                    if (dbSettings.intervalId) {
                        clearInterval(dbSettings.intervalId);
                        settings.setIntervalId(0);
                    }
                    const intervalId = setInterval(() => reloadApp(), dbSettings.refreshTime);
                    settings.setIntervalId(intervalId);
                }
            })
            .catch(e => {
                console.error("refreshApp", e);
            });
    } catch (e) {
        console.error("refreshApp", e);
    }
}

// ----------------------- History Window --------------------
function createHistoryWindow() {
    historyWindow = new BrowserWindow({
        width: 1050,
        height: 496,
        show: false,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    historyWindow.loadFile(path.join(__dirname, "mvc/view/history/historyWindow.html"));
    historyWindow.removeMenu();
    historyWindow.setResizable(true);
    historyWindow.on("ready-to-show", () => {
        historyWindow.show();
    });

    switch (process.platform) {
        case 'darwin':
            historyWindow.setIcon('resources/icon.icns');
            break;
        case 'win32':
            historyWindow.setIcon('resources/icon.ico');
            break;
        default:
            historyWindow.setIcon('resources/icon.png');
            break;
    }

    historyWindow.on("close", (event, args) => {
        mainWindow.webContents.send("toggle-button", "history");
    });

    historyWindow.on("show", (event, args) => {
        mainWindow.webContents.send("toggle-button", "history");
        setTimeout(() => {
            sendHistoryData();
        }, 500);
    });
}

function sendHistoryData() {
    settings.getSpeedHistory()
        .then(data => {
            historyWindow.webContents.send("speed-history-data", data);
        })
        .catch(error => {
            console.error("sendHistoryData", error);
        });
}

// ----------------------- Settings Window --------------------
function createAppSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 300,
        height: 300,
        show: false,
        parent: mainWindow,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    settingsWindow.loadFile(path.join(__dirname, "mvc/view/settings/settingsWindow.html"));
    settingsWindow.removeMenu();
    // settingsWindow.setResizable(true);
    settingsWindow.on("ready-to-show", () => {
        settingsWindow.show();
    });

    switch (process.platform) {
        case 'darwin':
            settingsWindow.setIcon('resources/icon.icns');
            break;
        case 'win32':
            settingsWindow.setIcon('resources/icon.ico');
            break;
        default:
            settingsWindow.setIcon('resources/icon.png');
            break;
    }

    settingsWindow.on("close", (event, args) => {
        mainWindow.webContents.send("toggle-button", "settings");
    });

    settingsWindow.on("show", (event, args) => {
        mainWindow.webContents.send("toggle-button", "settings");
        sendSettingsData();
    });
}

function sendSettingsData() {
    settings.getSettings()
        .then(dbSettings => {
            settingsWindow.webContents.send("settings-data", dbSettings);
        })
        .catch(error => {
            console.error("sendSettingsData", error);
        });
}

function updateRefreshTime(event, value) {
    console.info(`update refresh time: ${value || 0}`);
    settings.getSettings()
        .then(dbSettings => {
            console.info(JSON.stringify(dbSettings));
            if (value && dbSettings.refreshTime !== value * 60 * 1000) {
                return settings.setRefreshTime(value * 60 * 1000);
            }
            return undefined;
        })
        .then(value => {
            if (value) {
                refreshApp();
            }
        })
        .catch(error => {
            console.error("updateRefreshTime", error);
        });
}