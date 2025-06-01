// Help page initialization
if (document.getElementById('helpView')) {
    import('./ui.js').then(({initializeUI}) => {
        initializeUI();
    });
}
