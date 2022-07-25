const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('path');

const {speedTest} = require("./core/SpeedTester");
const Settings = require("./core/Settings");

let mainWindow;
const settings = new Settings();
app.showExitPrompt = true

// function createWindow() {
//     mainWindow = new BrowserWindow({
//         width: 400,
//         height: 260,
//         // frame: false,
//         transparent: true,
//         webPreferences: {
//             preload: path.join(__dirname, 'preload.js')
//         }
//     });
//
//     mainWindow.loadFile('mvc/view/main/mainWindow.html');
//     mainWindow.removeMenu();
//     mainWindow.setAlwaysOnTop(true);
//     mainWindow.setResizable(false);
//
//     switch (process.platform) {
//         case 'darwin':
//             mainWindow.setIcon(path.join(__dirname, 'resources/icon.icns'));
//             break;
//         case 'win32':
//             mainWindow.setIcon(path.join(__dirname, 'resources/icon.ico'));
//             break;
//         default:
//             mainWindow.setIcon(path.join(__dirname, 'resources/icon.png'));
//             break;
//     }
// }

function createHistoryWindow() {

}

function closeApp(event, value) {
    if (app.showExitPrompt) {
        if (process.platform !== 'darwin') {
            const buttons = {YES: 0, NO: 1};
            if (dialog.showMessageBoxSync(mainWindow, {
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

const logging = (data) => {
    console.info("speed-update", JSON.stringify({
        time: formatTime(data.updateAt),
        downloadSpeed: data.downloadSpeed,
        uploadSpeed: data.uploadSpeed
    }));
};

const notify = (data) => {
    mainWindow.webContents.send(
        "speed-update",
        {
            time: formatTime(data.updateAt),
            downloadSpeed: data.downloadSpeed,
            uploadSpeed: data.uploadSpeed
        })
};

const saveOnDB = (data) => {
    settings.addSpeedTest(JSON.stringify(data));
};

// todo crear un consumer que "haga algo" cuando un parámetro baje de un determinado umbral.

function reloadApp(event, value, consumers = []) {
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

const formatTime = (date) => Intl.DateTimeFormat('en', {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true
}).format(date);

function refreshApp() {
    try {
        settings.getSettings()
            .then(dbSettings => {
                if (dbSettings) {
                    console.log(JSON.stringify(dbSettings));
                    if (dbSettings.intervalId) {
                        clearInterval(dbSettings.intervalId);
                        settings.setIntervalId(0);
                    }
                    const intervalId = setInterval(() => reloadApp(undefined, undefined, [logging, notify, saveOnDB]), dbSettings.refreshTime);
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

function speedHistory(event, value) {
    //
    // dialog.
    console.info("--------------> speed-history");
}

app.whenReady().then(() => {
    setTimeout(() => {
        ipcMain.on("close-app", closeApp);
        ipcMain.on("reload", (event, value) => reloadApp(event, value, [logging, notify, saveOnDB]));

        // todo deshabilitar el botón hasta que esté la respuesta.
        ipcMain.on("speed-history", speedHistory);

        createWindow()

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })

        mainWindow.on("close", closeApp);

        refreshApp();
    }, 3000);
});

class MainWindow {
    constructor() {
    }

    // createWindow() {
    //     this.mainWindow = new BrowserWindow({
    //         width: 400,
    //         height: 260,
    //         // frame: false,
    //         transparent: true,
    //         webPreferences: {
    //             preload: path.join(__dirname, 'preload.js')
    //         }
    //     });
    //
    //     this.mainWindow.loadFile('mvc/view/main/mainWindow.html');
    //     this.mainWindow.removeMenu();
    //     this.mainWindow.setAlwaysOnTop(true);
    //     this.mainWindow.setResizable(false);
    //
    //     switch (process.platform) {
    //         case 'darwin':
    //             mainWindow.setIcon(path.join(__dirname, 'resources/icon.icns'));
    //             break;
    //         case 'win32':
    //             mainWindow.setIcon(path.join(__dirname, 'resources/icon.ico'));
    //             break;
    //         default:
    //             mainWindow.setIcon(path.join(__dirname, 'resources/icon.png'));
    //             break;
    //     }
    // }
}