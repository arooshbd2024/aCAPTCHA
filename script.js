// Prevent right-click
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

// Prevent text selection
document.addEventListener('selectstart', function (e) {
    e.preventDefault();
});

// Prevent dragging of elements like images and links
document.addEventListener('dragstart', function (e) {
    e.preventDefault();
});

// Prevent keyboard shortcuts for opening inspect menu, saving, etc.
document.addEventListener('keydown', function (e) {
    // List of forbidden key combinations
    const forbiddenKeys = [
        { keyCode: 83, ctrlKey: true },  // Ctrl + S
        { keyCode: 73, ctrlKey: true, shiftKey: true },  // Ctrl + Shift + I
        { keyCode: 74, ctrlKey: true, shiftKey: true },  // Ctrl + Shift + J
        { keyCode: 67, ctrlKey: true, shiftKey: true },  // Ctrl + Shift + C
        { keyCode: 85, ctrlKey: true },  // Ctrl + U
        { keyCode: 123 }  // F12
    ];

    for (const combo of forbiddenKeys) {
        if (
            e.keyCode === combo.keyCode &&
            (!('ctrlKey' in combo) || e.ctrlKey === combo.ctrlKey) &&
            (!('shiftKey' in combo) || e.shiftKey === combo.shiftKey)
        ) {
            e.preventDefault();
            return;
        }
    }
});

// Additional prevention for copying (copy event)
document.addEventListener('copy', function (e) {
    e.preventDefault();
});
