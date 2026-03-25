const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

function resolveRoleArg() {
  if (process.env.DANSKABE_ROLE === "teacher") {
    return "teacher";
  }
  if (process.env.DANSKABE_ROLE === "student") {
    return "student";
  }

  if (process.argv.includes("--teacher")) {
    return "teacher";
  }
  if (process.argv.includes("--student")) {
    return "student";
  }
  return "both";
}

let mainWindow = null;
let role = "both";
let tray = null;

function ensureTray() {
  if (role !== "student" || tray) {
    return;
  }

  const iconPath = path.join(process.cwd(), "public", "icon.svg");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("DanskeAbe Student");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const loginState = app.getLoginItemSettings();
  const startHidden = role === "student" && loginState.wasOpenedAtLogin;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    show: !startHidden,
    autoHideMenuBar: true,
    title: "DanskeAbe",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  const url = `file://${path.join(process.cwd(), "test.html")}?role=${encodeURIComponent(role)}`;
  mainWindow.loadURL(url);

  if (role === "student") {
    ensureTray();

    // Keep student agent running in background so popups/notifications can continue.
    mainWindow.on("close", (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });
  }

  return mainWindow;
}

app.whenReady().then(() => {
  role = resolveRoleArg();

  const lock = app.requestSingleInstanceLock();
  if (!lock) {
    app.quit();
    return;
  }

  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  if (role === "student") {
    // Student mode starts automatically after install/reboot.
    app.setLoginItemSettings({
      openAtLogin: true,
      args: ["--student"],
    });
  } else {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
  }

  ipcMain.handle("danskabe:notify", (_, payload) => {
    const title = String(payload?.title || "DanskeAbe");
    const body = String(payload?.body || "New question available");
    const question = String(payload?.question || "");

    const note = new Notification({
      title,
      body,
      silent: false,
    });

    note.on("click", () => {
      if (!mainWindow) {
        return;
      }
      mainWindow.show();
      mainWindow.focus();
      if (question) {
        mainWindow.webContents.send("danskabe:focus-question", question);
      }
    });

    note.show();
    return { ok: true };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && role !== "student") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuiting = true;
});
