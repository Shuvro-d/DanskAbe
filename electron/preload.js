const { contextBridge, ipcRenderer } = require("electron");

function resolveRoleArg() {
  if (process.argv.includes("--teacher")) {
    return "teacher";
  }
  if (process.argv.includes("--student")) {
    return "student";
  }
  return "both";
}

contextBridge.exposeInMainWorld("danskabeDesktop", {
  platform: process.platform,
  role: resolveRoleArg(),
  notify: async (title, body, question) => {
    return ipcRenderer.invoke("danskabe:notify", { title, body, question });
  },
  onFocusQuestion: (handler) => {
    ipcRenderer.on("danskabe:focus-question", (_, question) => handler(question));
  },
});
