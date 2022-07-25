// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const buttonHistory = document.getElementById("button_history");
const buttonRefresh = document.getElementById("button_refresh");
const buttonSettings = document.getElementById("button_settings");
const buttonClose = document.getElementById("button_close");
const labelTime = document.getElementById("label_time");
const labelDownload = document.getElementById("label_download");
const labelUpload = document.getElementById("label_upload");


buttonHistory.addEventListener("click", event => {
    window.electronAPI.send("speed-history");
});

buttonRefresh.addEventListener("click", event => {
    window.electronAPI.send("test", "------------> refresh");
});

buttonSettings.addEventListener("click", event => {
    window.electronAPI.send("test", "------------> settings");
});

buttonClose.addEventListener("click", event => {
    window.electronAPI.send("close-app");
});

window.onload = () => {
    window.electronAPI.send("reload");
};

window.electronAPI.on("speed-update", (event, value) => {
    labelTime.innerText = value.time;
    labelDownload.innerText = value.downloadSpeed;
    labelUpload.innerText = value.uploadSpeed;
});
