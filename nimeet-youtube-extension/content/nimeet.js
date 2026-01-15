// NIMeet YouTube Extension - NIMeet Content Script

(function () {
    'use strict';

    console.log('[NIMeet Extension] NIMeet content script loaded');

    // Listen for messages from the NIMeet React app
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        const { type, ...data } = event.data || {};

        switch (type) {
            case 'nimeet_call_started':
                console.log('[NIMeet Extension] Call started signal received');
                chrome.runtime.sendMessage({
                    action: 'nimeet_call_started',
                    callId: data.callId
                });
                break;

            case 'nimeet_call_ended':
                console.log('[NIMeet Extension] Call ended signal received');
                chrome.runtime.sendMessage({ action: 'nimeet_call_ended' });
                break;

            case 'nimeet_extension_ping':
                console.log('[NIMeet Extension] Ping received, sending pong');
                window.postMessage({ type: 'nimeet_extension_pong' }, '*');
                break;
        }
    });

    // Listen for messages from background (video broadcast)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[NIMeet Extension] Received from background:', message);

        if (message.action === 'play_youtube') {
            console.log('[NIMeet Extension] Forwarding play_youtube to React app');
            window.postMessage({
                type: 'nimeet_play_youtube',
                url: message.url
            }, '*');
            sendResponse({ success: true });
        }

        return true;
    });

    // Notify that extension is loaded
    window.postMessage({ type: 'nimeet_extension_loaded' }, '*');

    console.log('[NIMeet Extension] NIMeet content script ready');
})();
