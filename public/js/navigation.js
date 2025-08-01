// Global navigation function
function navigateTo(page) {
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const currentItem = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (currentItem) currentItem.classList.add('active');

    const userId = '5648969247';
    const username = 'jashon_chang';

    // Navigate with user parameters
    const routes = {
        home: `/webapp/miniapp?user_id=${userId}&username=${username}`,
        earn: `/webapp/miniapp/earn?user_id=${userId}&username=${username}`,
        memepad: `/webapp/miniapp/memepad?user_id=${userId}&username=${username}`,
        tokens: `/webapp/miniapp/tokens?user_id=${userId}&username=${username}`,
        wallet: `/webapp/miniapp/wallet?user_id=${userId}&username=${username}`
    };

    if (routes[page]) window.location.href = routes[page];
}

// Set active page on load
document.addEventListener('DOMContentLoaded', () => {
    // Get current user info for path mapping
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    const username = urlParams.get('username');

    const pathMap = {
        '/webapp/miniapp': 'home',
        '/webapp/miniapp/earn': 'earn',
        '/webapp/miniapp/memepad': 'memepad',
        '/webapp/miniapp/tokens': 'tokens',
        '/webapp/miniapp/wallet': 'wallet'
    };

    const currentPage = pathMap[window.location.pathname];
    if (currentPage) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const currentItem = document.querySelector(`[onclick="navigateTo('${currentPage}')"]`);
        if (currentItem) currentItem.classList.add('active');
    }
});