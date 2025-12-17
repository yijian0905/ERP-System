/**
 * @file Renderer Entry Point
 * @description Desktop app renderer - imports from web app
 *
 * In production, this will be bundled with the web app.
 * In development, Electron loads the web dev server directly.
 */

// Re-export from web app for production build
// This allows the desktop app to use the same React app as the web version

// Note: In production, the web app's dist folder is copied here
// The actual app entry is handled by the web app's main.tsx
console.log('ERP Desktop App Renderer Initialized');

// Check if running in Electron
if (window.electronAPI) {
    console.log('Running in Electron');

    // Get app version
    window.electronAPI.getVersion().then((version) => {
        console.log('App Version:', version);
    });

    // Listen for updates
    window.electronAPI.onUpdateAvailable(() => {
        console.log('Update available');
    });

    window.electronAPI.onUpdateDownloaded(() => {
        console.log('Update downloaded, will install on restart');
    });
}

// Hide loading screen when app is ready
window.addEventListener('load', () => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
});

export { };
