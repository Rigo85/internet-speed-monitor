const {app, BrowserWindow, ipcMain, dialog} = require('electron');

const {speedTest} = require("./core/SpeedTester");
const Settings = require("./core/Settings");
const path = require("path");

let mainWindow, historyWindow;
app.showExitPrompt = true;
const settings = new Settings();

app.whenReady().then(() => {

    setTimeout(() => {
        ipcMain.on("close-app", closeMainWindow);
        ipcMain.on("reload", reloadApp);

        // todo deshabilitar el botón hasta que esté la respuesta.
        // ipcMain.on("speed-history", speedHistory);
        ipcMain.on("speed-history", (event, value) => {
            // historyWindowController.createWindow();
            // historyWindowController.onShow();
            createHistoryWindow();
        });

        // mainWindowController.createWindow();
        createMainWindow();

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        })

        // mainWindowController.onClose();

        refreshApp();
    }, 3000);
});

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
        downloadSpeed: data.downloadSpeed,
        uploadSpeed: data.uploadSpeed
    }));
}

function notify(window, data) {
    window.webContents.send(
        "speed-update",
        {
            time: formatTime(data.updateAt),
            downloadSpeed: data.downloadSpeed,
            uploadSpeed: data.uploadSpeed
        })
}

function saveOnDB(data) {
    settings.addSpeedTest(JSON.stringify(data));
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 260,
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

    switch (process.platform) {
        case 'darwin':
            mainWindow.setIcon('resources/icon.icns');
            break;
        case 'win32':
            mainWindow.setIcon('resources/icon.ico');
            break;
        default:
            mainWindow.setIcon('resources/icon.png');
            break;
    }

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
function reloadApp(event, value, consumers = [logging, (data) => notify(mainWindow, data), saveOnDB]) {
    // const consumers = [this.logging, this.notify, this.saveOnDB];
    // todo agregar hora a los logs.
    console.info("reloading...");
    speedTest()
        .then(data => {
            if (data) {
                consumers.forEach(consumer => {
                    consumer(data);
                });
            } else {
                // volver a correr.
                // mostrar un mensaje que ha ocurrido un error, pregunta si desea volver a ejecutar es test speed.
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
                    // console.log(JSON.stringify(dbSettings));
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

function createHistoryWindow() {
    historyWindow = new BrowserWindow({
        width: 1050,
        height: 496,
        modal: true,
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

    // this.historyWindow.on("close", (event, args) => {
    //     console.info("enabling history button");
    //     this.historyWindow.webContents.send("toggle-speed-history");
    // });

    historyWindow.on("show", (event, args) => {
        sendData();
    });
}

function sendData() {
    settings.getSpeedHistory()
        .then(data => {
            historyWindow.webContents.send("speed-history-data", data);
        })
        .catch(error => {
            console.error("sendData", error);
        });
}
