(function() {
  function appPath() {
    return '/app' + window.location.search + window.location.hash;
  }

  async function redirectZoomLaunch() {
    if (!window.zoomSdk || window.location.pathname === '/app') return;

    try {
      await window.zoomSdk.config({
        version: '0.16.0',
        capabilities: ['getRunningContext']
      });
      window.location.replace(appPath());
    } catch (error) {
      // In a regular browser the Zoom Apps SDK cannot initialize. Keep the public homepage visible.
    }
  }

  redirectZoomLaunch();
})();
