// NIMeet YouTube Extension - NIMeet Content Script

(function () {
    'use strict';

    console.log('[NIMeet Extension] NIMeet content script loaded on:', window.location.href);

    // Check if extension context is valid
    function isExtensionValid() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (e) {
            return false;
        }
    }

    // Safe message sender
    function safeSendMessage(message) {
        if (!isExtensionValid()) {
            console.log('[NIMeet Extension] Context invalid, cannot send message');
            return;
        }
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('[NIMeet Extension] Send error:', chrome.runtime.lastError.message);
                } else {
                    console.log('[NIMeet Extension] Message sent successfully:', message.action);
                }
            });
        } catch (e) {
            console.log('[NIMeet Extension] Exception sending message:', e);
        }
    }

    // Listen for messages from the NIMeet React app
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        const { type, ...data } = event.data || {};

        switch (type) {
            case 'nimeet_call_started':
                console.log('[NIMeet Extension] Call started signal received, callId:', data.callId);
                safeSendMessage({
                    action: 'nimeet_call_started',
                    callId: data.callId
                });
                break;

            case 'nimeet_call_ended':
                console.log('[NIMeet Extension] Call ended signal received');
                safeSendMessage({ action: 'nimeet_call_ended' });
                break;

            case 'nimeet_extension_ping':
                console.log('[NIMeet Extension] Ping received, sending pong');
                window.postMessage({ type: 'nimeet_extension_pong' }, '*');
                break;
        }
    });

    // Listen for messages from background (video broadcast)
    if (isExtensionValid()) {
        try {
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
        } catch (e) {
            console.log('[NIMeet Extension] Error setting up message listener:', e);
        }
    }

    // Notify that extension is loaded
    window.postMessage({ type: 'nimeet_extension_loaded' }, '*');

    console.log('[NIMeet Extension] NIMeet content script ready');
})();
