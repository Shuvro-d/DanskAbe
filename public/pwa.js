(function registerPWA() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Check for updates regularly while app is open.
      setInterval(() => {
        reg.update();
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error("Service worker registration failed", err);
    }
  });
})();
