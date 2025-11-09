window.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const splashLogo = document.querySelector('.splash-logo');
    const mainContent = document.getElementById('main-content');

    if (splashLogo) {
        splashLogo.addEventListener('animationend', () => {
            // Fade out the splash screen
            splashScreen.style.opacity = '0';

            // Wait for the fade out transition to finish before hiding it
            splashScreen.addEventListener('transitionend', () => {
                splashScreen.style.display = 'none';
                // Show main content
                if(mainContent) {
                    mainContent.style.display = 'block';
                }
            });
        });
    } else {
        // If there's no splash screen, just show the main content
        if(mainContent) {
            mainContent.style.display = 'block';
        }
    }
});
