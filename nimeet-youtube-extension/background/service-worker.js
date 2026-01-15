// NIMeet YouTube Extension - Background Service Worker

let nimeetState = {
    isInCall: false,
    callId: null,
    nimeetTabId: null
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[NIMeet Extension] Background received:', message, 'from tab:', sender.tab?.id);

    switch (message.action) {
        case 'nimeet_call_started':
            nimeetState.isInCall = true;
            nimeetState.callId = message.callId || null;
            nimeetState.nimeetTabId = sender.tab?.id || null;
            console.log('[NIMeet Extension] Call started, state:', nimeetState);
            sendResponse({ success: true });
            break;

        case 'nimeet_call_ended':
            nimeetState.isInCall = false;
            nimeetState.callId = null;
            nimeetState.nimeetTabId = null;
            console.log('[NIMeet Extension] Call ended');
            sendResponse({ success: true });
            break;

        case 'check_call_status':
            console.log('[NIMeet Extension] Status check, returning:', nimeetState.isInCall);
            sendResponse({ isInCall: nimeetState.isInCall, callId: nimeetState.callId });
            break;

        case 'broadcast_video':
            if (nimeetState.isInCall && nimeetState.nimeetTabId) {
                console.log('[NIMeet Extension] Broadcasting video to NIMeet tab:', nimeetState.nimeetTabId);
                chrome.tabs.sendMessage(nimeetState.nimeetTabId, {
                    action: 'play_youtube',
                    url: message.url
                }).then(() => {
                    sendResponse({ success: true });
                }).catch(err => {
                    console.error('[NIMeet Extension] Failed to send to NIMeet:', err);
                    sendResponse({ success: false, error: err.message });
                });
                return true; // Keep channel open for async response
            } else {
                console.log('[NIMeet Extension] Cannot broadcast - not in call');
                sendResponse({ success: false, error: 'Not in a call' });
            }
            break;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }

    return true; // Keep message channel open
});

// Clean up when NIMeet tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === nimeetState.nimeetTabId) {
        console.log('[NIMeet Extension] NIMeet tab closed, resetting state');
        nimeetState.isInCall = false;
        nimeetState.callId = null;
        nimeetState.nimeetTabId = null;
    }
});

console.log('[NIMeet Extension] Service worker initialized');
