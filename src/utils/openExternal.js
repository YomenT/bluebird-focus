/**
 * Open a URL in the user's default browser.
 * Uses Tauri shell plugin when running in Tauri, falls back to window.open.
 */
export async function openExternal(url) {
    try {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open(url);
    } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

export const BLUEBIRD_DOCS_URL = 'https://bluebird-documentation.com';
