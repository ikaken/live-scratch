(function () {
    'use strict';

    var POLL_INTERVAL = 100;
    var SAVE_DEBOUNCE = 1000;
    var ignoreChanges = false;
    var saveTimer = null;
    var indicator = null;

    function createIndicator() {
        indicator = document.createElement('div');
        indicator.style.cssText =
            'position:fixed;top:8px;right:8px;width:12px;height:12px;' +
            'border-radius:50%;background:#4c4;z-index:999999;' +
            'transition:background 0.3s;pointer-events:none;';
        document.body.appendChild(indicator);
    }

    function base64ToArrayBuffer(base64) {
        var binaryString = atob(base64);
        var len = binaryString.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function loadProject(arrayBuffer) {
        var editingTarget = window.vm.editingTarget ?
            window.vm.editingTarget.id : null;

        ignoreChanges = true;
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }

        window.vm.loadProject(arrayBuffer).then(function () {
            console.log('[live-scratch] project loaded');
            if (editingTarget) {
                try {
                    window.vm.setEditingTarget(editingTarget);
                } catch (e) {
                    // target may no longer exist
                }
            }
            setTimeout(function () { ignoreChanges = false; }, 500);
        }).catch(function (err) {
            console.error('[live-scratch] load error:', err);
            ignoreChanges = false;
        });
    }

    function setupTauri() {
        var invoke = window.__TAURI__.core.invoke;
        var listen = window.__TAURI__.event.listen;

        // Load initial project
        invoke('get_initial_sb3').then(function (base64) {
            console.log('[live-scratch] loading initial project');
            var arrayBuffer = base64ToArrayBuffer(base64);
            loadProject(arrayBuffer);
        }).catch(function (err) {
            console.error('[live-scratch] failed to load initial project:', err);
        });

        // Listen for file-change updates from Rust backend
        listen('sb3-updated', function (event) {
            console.log('[live-scratch] received sb3-updated event');
            var arrayBuffer = base64ToArrayBuffer(event.payload);
            loadProject(arrayBuffer);
        });

        // Listen for project changes made in the Scratch editor
        window.vm.on('PROJECT_CHANGED', function () {
            if (ignoreChanges) return;
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(function () {
                saveTimer = null;
                if (ignoreChanges) return;

                console.log('[live-scratch] saving project to backend');
                window.vm.saveProjectSb3().then(function (blob) {
                    return blob.arrayBuffer();
                }).then(function (buffer) {
                    var base64 = arrayBufferToBase64(buffer);
                    return invoke('save_project_from_editor', { sb3Base64: base64 });
                }).then(function () {
                    console.log('[live-scratch] project saved');
                }).catch(function (err) {
                    console.error('[live-scratch] save error:', err);
                });
            }, SAVE_DEBOUNCE);
        });
    }

    function waitForVM() {
        if (window.vm && window.__TAURI__) {
            createIndicator();
            setupTauri();
        } else {
            setTimeout(waitForVM, POLL_INTERVAL);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForVM);
    } else {
        waitForVM();
    }
})();
