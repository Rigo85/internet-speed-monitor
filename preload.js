const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, payload) => ipcRenderer.send(channel, payload),
    on: (channel, payload) => ipcRenderer.on(channel, payload)
})
