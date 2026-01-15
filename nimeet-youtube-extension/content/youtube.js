// NIMeet YouTube Extension - YouTube Content Script

(function () {
    'use strict';

    console.log('[NIMeet Extension] YouTube content script loaded');

    let isInCall = false;
    let broadcastButton = null;
    let checkInterval = null;

    // Check call status periodically
    function checkCallStatus() {
        chrome.runtime.sendMessage({ action: 'check_call_status' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('[NIMeet Extension] Error checking status:', chrome.runtime.lastError);
                isInCall = false;
            } else {
                isInCall = response?.isInCall || false;
            }
            updateButtonState();
        });
    }

    // Get current video URL
    function getCurrentVideoUrl() {
        const url = window.location.href;
        if (url.includes('youtube.com/watch')) {
            return url;
        }
        return null;
    }

    // Create broadcast button
    function createBroadcastButton() {
        if (broadcastButton) return;

        broadcastButton = document.createElement('button');
        broadcastButton.id = 'nimeet-broadcast-btn';
        broadcastButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            <span>NIMeet</span>
        `;
        broadcastButton.title = 'Транслировать в NIMeet';

        broadcastButton.addEventListener('click', handleBroadcast);

        return broadcastButton;
    }

    // Handle broadcast button click
    function handleBroadcast() {
        if (!isInCall) {
            showNotification('Сначала присоединитесь к созвону в NIMeet', 'warning');
            return;
        }

        const url = getCurrentVideoUrl();
        if (!url) {
            showNotification('Не удалось получить URL видео', 'error');
            return;
        }

        console.log('[NIMeet Extension] Broadcasting video:', url);

        chrome.runtime.sendMessage({ action: 'broadcast_video', url }, (response) => {
            if (chrome.runtime.lastError) {
                showNotification('Ошибка: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            if (response?.success) {
                showNotification('Видео транслируется в NIMeet! 🎬', 'success');
            } else {
                showNotification('Не удалось транслировать: ' + (response?.error || 'Неизвестная ошибка'), 'error');
            }
        });
    }

    // Update button appearance based on call status
    function updateButtonState() {
        if (!broadcastButton) return;

        if (isInCall) {
            broadcastButton.classList.add('nimeet-active');
            broadcastButton.classList.remove('nimeet-inactive');
            broadcastButton.title = 'Транслировать в NIMeet';
        } else {
            broadcastButton.classList.remove('nimeet-active');
            broadcastButton.classList.add('nimeet-inactive');
            broadcastButton.title = 'Сначала присоединитесь к созвону в NIMeet';
        }
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        const existing = document.getElementById('nimeet-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'nimeet-notification';
        notification.className = `nimeet-notification nimeet-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('nimeet-notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Find and inject button into YouTube player
    function injectButton() {
        // Target: right controls in the video player
        const rightControls = document.querySelector('.ytp-right-controls');

        if (rightControls && !document.getElementById('nimeet-broadcast-btn')) {
            const button = createBroadcastButton();
            rightControls.insertBefore(button, rightControls.firstChild);
            console.log('[NIMeet Extension] Button injected into player controls');
            updateButtonState();
        }
    }

    // Initialize
    function init() {
        console.log('[NIMeet Extension] Initializing...');

        // Initial status check
        checkCallStatus();

        // Check status every 5 seconds
        checkInterval = setInterval(checkCallStatus, 5000);

        // Try to inject button immediately and on DOM changes
        injectButton();

        // Watch for YouTube's dynamic content loading
        const observer = new MutationObserver((mutations) => {
            injectButton();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Re-inject on navigation (YouTube SPA)
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log('[NIMeet Extension] URL changed, re-injecting button');
                broadcastButton = null; // Reset so it gets recreated
                setTimeout(injectButton, 1000);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
