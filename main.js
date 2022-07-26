const {app, BrowserWindow, ipcMain, dialog} = require('electron');

const {speedTest} = require("./core/SpeedTester");
const Settings = require("./core/Settings");
const path = require("path");

app.showExitPrompt = true;
const settings = new Settings();

function createHistoryWindow() {

}

function speedHistory(event, value) {
    historyWindowController.createWindow();
    historyWindowController.onShow();
}

app.whenReady().then(() => {
    setTimeout(() => {
        ipcMain.on("close-app", mainWindowController.closeApp);
        ipcMain.on("reload", mainWindowController.reloadApp);

        // todo deshabilitar el botón hasta que esté la respuesta.
        ipcMain.on("speed-history", speedHistory);

        mainWindowController.createWindow();

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) mainWindowController.createWindow()
        })

        mainWindowController.onClose();

        mainWindowController.refreshApp();
    }, 3000);
});

// ---------------- MainWindowController -----------------
class MainWindowController {
    constructor(settings) {
        this.settings = settings;

        this.logging = (data) => {
            console.info("speed-update", JSON.stringify({
                time: this.formatTime(data.updateAt),
                downloadSpeed: data.downloadSpeed,
                uploadSpeed: data.uploadSpeed
            }));
        };

        this.notify = (data) => {
            this.mainWindow.webContents.send(
                "speed-update",
                {
                    time: this.formatTime(data.updateAt),
                    downloadSpeed: data.downloadSpeed,
                    uploadSpeed: data.uploadSpeed
                })
        };

        this.formatTime = (date) => Intl.DateTimeFormat('en', {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true
        }).format(date);

        this.saveOnDB = (data) => {
            this.settings.addSpeedTest(JSON.stringify(data));
        };
    }

    onClose() {
        this.mainWindow.on("close", this.closeApp);
    }

    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 400,
            height: 260,
            // frame: false,
            transparent: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            }
        });

        this.mainWindow.loadFile(path.join(__dirname, "mvc/view/main/mainWindow.html"));
        this.mainWindow.removeMenu();
        this.mainWindow.setAlwaysOnTop(true);
        this.mainWindow.setResizable(false);

        switch (process.platform) {
            case 'darwin':
                this.mainWindow.setIcon('resources/icon.icns');
                break;
            case 'win32':
                this.mainWindow.setIcon('resources/icon.ico');
                break;
            default:
                this.mainWindow.setIcon('resources/icon.png');
                break;
        }
    }

    closeApp(event, value) {
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
    reloadApp(event, value, consumers = [this.logging, this.notify, this.saveOnDB]) {
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

    getWindow() {
        return this.mainWindow;
    }

    refreshApp() {
        try {
            this.settings.getSettings()
                .then(dbSettings => {
                    if (dbSettings) {
                        // console.log(JSON.stringify(dbSettings));
                        if (dbSettings.intervalId) {
                            clearInterval(dbSettings.intervalId);
                            this.settings.setIntervalId(0);
                        }
                        const intervalId = setInterval(() => this.reloadApp(), dbSettings.refreshTime);
                        this.settings.setIntervalId(intervalId);
                    }
                })
                .catch(e => {
                    console.error("refreshApp", e);
                });
        } catch (e) {
            console.error("refreshApp", e);
        }
    }
}

const mainWindowController = new MainWindowController(settings);

// --------------- HistoryWindowController --------------
class HistoryWindowController {
    constructor(settings, parent) {
        this.settings = settings;
        this.parent = parent;
    }

    createWindow() {
        this.historyWindow = new BrowserWindow({
            width: 1024,
            height: 496,
            modal: true,
            show: false,
            parent: this.parent,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            }
        });

        this.historyWindow.loadFile(path.join(__dirname, "mvc/view/history/historyWindow.html"));
        // this.historyWindow.removeMenu();
        this.historyWindow.setResizable(true);
        this.historyWindow.on("ready-to-show", () => {
            this.historyWindow.show();
        });
    }

    sendData() {
        this.settings.getSpeedHistory()
            .then(data => {
                this.historyWindow.webContents.send("speed-history-data", data);
            })
            .catch(error => {
                console.error("sendData", error);
            });
    }

    onShow() {
        this.historyWindow.on("show", (event, args) => {
            this.sendData();
        });
    }
}

const historyWindowController = new HistoryWindowController(settings, mainWindowController.getWindow());
