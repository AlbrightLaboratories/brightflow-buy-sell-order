/**
 * Mobile Detection and Redirect
 * Automatically serves mobile version on mobile devices
 */

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

function redirectToMobile() {
    if (isMobileDevice() && !window.location.pathname.includes('mobile')) {
        // Redirect to mobile version
        const mobileUrl = window.location.pathname.replace('index.html', 'index-mobile.html');
        window.location.href = mobileUrl;
    }
}

function redirectToDesktop() {
    if (!isMobileDevice() && window.location.pathname.includes('mobile')) {
        // Redirect to desktop version
        const desktopUrl = window.location.pathname.replace('index-mobile.html', 'index.html');
        window.location.href = desktopUrl;
    }
}

// Check on page load
document.addEventListener('DOMContentLoaded', function() {
    redirectToMobile();
});

// Check on window resize
window.addEventListener('resize', function() {
    // Debounce resize events
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(function() {
        if (isMobileDevice()) {
            redirectToMobile();
        } else {
            redirectToDesktop();
        }
    }, 250);
});

// Add mobile detection class to body
if (isMobileDevice()) {
    document.body.classList.add('mobile-device');
} else {
    document.body.classList.add('desktop-device');
}
