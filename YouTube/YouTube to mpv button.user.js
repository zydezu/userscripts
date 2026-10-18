// ==UserScript==
// @name         YouTube to mpv button
// @version      v1.5
// @namespace    zydezu
// @description  Open YouTube links in mpv (title button + right-click menu)
// @match        https://*.youtube.com/*
// @run-at       document-idle
// @grant        none
// @icon         https://raw.githubusercontent.com/mpv-player/mpv/refs/heads/master/etc/mpv-icon.ico
// ==/UserScript==

(function () {
    'use strict';

    const TITLE_BTN_ID = 'mpv-open-btn';
    const MENU_ID = 'mpv-context-menu';

    // youtube enforces Trusted Types and blocks raw HTML string assignment
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function createPlayIcon(size) {
        size = size || 14;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#a855f7');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('stroke-linecap', 'round');
        svg.style.display = 'block';
        svg.style.pointerEvents = 'none';

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', 'M6 4l14 8-14 8z');
        svg.appendChild(path);

        return svg;
    }

    // hover + press-down states for our icon buttons
    const btnStyle = document.createElement('style');
    btnStyle.textContent = `
        .mpv-icon-btn {
             transition: background-color 0.12s ease, transform 0.08s ease;
             position: relative;
             z-index: 100;
             pointer-events: auto;
        }
        .mpv-icon-btn:hover {
            background: var(--yt-spec-badge-chip-background-hover, #3f3f3f) !important;
        }
        .mpv-icon-btn:active {
            transform: scale(0.88);
            background: var(--yt-spec-badge-chip-background-hover, #4a4a4a) !important;
        }
        .mpv-icon-btn:active svg {
            stroke: #c084fc;
        }
    `;
    document.head.appendChild(btnStyle);

    // --- helpers -------------------------------------------------------

    function extractVideoUrl(url) {
        try {
            const u = new URL(url, location.href);
            if (!u.hostname.endsWith('youtube.com') && !u.hostname.endsWith('youtu.be')) return null;

            const t = u.searchParams.get('t') || u.searchParams.get('start');
            const withTime = (base) => (t ? `${base}&t=${t}` : base);

            if (u.hostname.endsWith('youtu.be')) {
                const id = u.pathname.slice(1);
                return id ? withTime(`https://www.youtube.com/watch?v=${id}`) : null;
            }
            if (u.pathname.startsWith('/watch')) {
                const id = u.searchParams.get('v');
                return id ? withTime(`https://www.youtube.com/watch?v=${id}`) : null;
            }
            if (u.pathname.startsWith('/shorts/')) {
                const id = u.pathname.split('/')[2];
                return id ? withTime(`https://www.youtube.com/watch?v=${id}`) : null;
            }
            return null;
        } catch {
            return null;
        }
    }

    function currentWatchUrl() {
        const base = extractVideoUrl(location.href);
        if (!base) return null;

        const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
        if (video && !isNaN(video.currentTime) && video.currentTime > 0) {
            const url = new URL(base);
            url.searchParams.set('t', Math.floor(video.currentTime));
            return url.toString();
        }
        return base;
    }

    function openInMpv(url) {
        const a = document.createElement('a');
        a.href = 'mpv://' + encodeURIComponent(url);
        a.click();
    }

    // finds the nearest ancestor anchor (or itself) that points to a video/short
    function findVideoLink(el) {
        let node = el;
        while (node && node !== document.body) {
            if (node.tagName === 'A' && node.href) {
                const vid = extractVideoUrl(node.href);
                if (vid) return vid;
            }
            node = node.parentElement;
        }
        return null;
    }

    // --- title button (watch page) --------------------------------------

    function injectTitleButton() {
        const existing = document.getElementById(TITLE_BTN_ID);

        if (!location.pathname.startsWith('/watch')) {
            if (existing) existing.remove();
            return;
        }

        const titleEl = document.querySelector('ytd-watch-metadata #title h1');
        if (!titleEl) return;

        if (existing) {
            if (existing.parentElement === titleEl) return; // already in place
            existing.remove();
        }

        const b = document.createElement('button');
        b.id = TITLE_BTN_ID;
        b.className = 'mpv-icon-btn';
        b.title = 'watch in mpv';
        b.setAttribute('aria-label', 'watch in mpv');
        b.appendChild(createPlayIcon(14));
        b.style.cssText =
            'margin-left:12px;vertical-align:middle;display:inline-flex;' +
            'align-items:center;justify-content:center;' +
            'width:30px;height:30px;padding:0;border:none;border-radius:50%;' +
            'cursor:pointer;' +
            'background:var(--yt-spec-badge-chip-background,#272727);' +
            'box-shadow:0 1px 3px rgba(0,0,0,0.4);';
        b.addEventListener('click', () => {
            const u = currentWatchUrl();
            if (u) openInMpv(u);
        });
        titleEl.appendChild(b);
    }

    // --- native "..." action menu injection --------------------------------

    let pendingVideoUrl = null;

    function findContainerVideoUrl(el) {
        const container = el.closest(
            'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ' +
            'ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ' +
            'ytd-reel-item-renderer, ytd-watch-metadata'
        );
        if (!container) return null;
        const link = container.querySelector(
            'a#thumbnail, a#video-title-link, a.yt-simple-endpoint[href*="/watch"], a.yt-simple-endpoint[href*="/shorts/"]'
        );
        return link ? extractVideoUrl(link.href) : null;
    }

    // capture which video a "..." menu button belongs to, right when it's clicked
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('ytd-menu-renderer button, ytd-menu-renderer yt-icon-button, ytd-menu-renderer tp-yt-paper-icon-button');
        if (!trigger) return;
        pendingVideoUrl = findContainerVideoUrl(e.target) || (location.pathname.startsWith('/watch') ? currentWatchUrl() : null);
    }, true);

    function buildNativeMenuItem(url) {
        const item = document.createElement('yt-list-item-view-model');
        item.className = 'ytListItemViewModelHost';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('aria-label', 'watch in mpv');
        item.dataset.mpvItem = '1';

        const wrapper = document.createElement('div');
        wrapper.className =
            'ytListItemViewModelLayoutWrapper ytListItemViewModelContainer ' +
            'ytListItemViewModelCompact ytListItemViewModelTappable ' +
            'ytListItemViewModelInPopup ytListItemViewModelNoTrailingText';

        const main = document.createElement('div');
        main.className = 'ytListItemViewModelMainContainer';
        main.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:8px 0;';
        main.appendChild(createPlayIcon(16));

        wrapper.appendChild(main);
        item.appendChild(wrapper);

        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openInMpv(url);
            closeNativeMenu(item);
        });
        return item;
    }

    function closeNativeMenu(item) {
        const dropdown = item.closest('tp-yt-iron-dropdown, ytd-popup-container');
        if (dropdown) dropdown.style.display = 'none';
        document.body.click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    const nativeMenuObserver = new MutationObserver(() => {
        if (!pendingVideoUrl) return;
        const list = document.querySelector('yt-list-view-model[role="menu"]:not([data-mpv-injected])');
        if (!list) return;
        list.setAttribute('data-mpv-injected', '1');
        list.appendChild(buildNativeMenuItem(pendingVideoUrl));
    });
    nativeMenuObserver.observe(document.body, { childList: true, subtree: true });

    // --- feed title buttons (home page, search, sidebar, etc) --------------

    function injectFeedButtons() {
        const titles = document.querySelectorAll('a#video-title-link, a#video-title');
        titles.forEach((titleEl) => {
            if (titleEl.dataset.mpvDone) return;
            const url = extractVideoUrl(titleEl.href);
            if (!url) return;
            titleEl.dataset.mpvDone = '1';

            const btn = document.createElement('button');
            btn.className = 'mpv-icon-btn';
            btn.title = 'watch in mpv';
            btn.setAttribute('aria-label', 'watch in mpv');
            btn.appendChild(createPlayIcon(14));
            btn.style.cssText =
                'margin-left:8px;display:inline-flex;align-items:center;justify-content:center;' +
                'width:22px;height:22px;padding:0;border:none;border-radius:50%;' +
                'cursor:pointer;vertical-align:middle;flex-shrink:0;' +
                'background:var(--yt-spec-badge-chip-background,#272727);';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openInMpv(url);
            });
            titleEl.insertAdjacentElement('afterend', btn);
        });
    }

    // newer "lockup" card layout (current homepage/search redesign)
    function injectLockupButtons() {
        const heads = document.querySelectorAll('h3.ytLockupMetadataViewModelHeadingReset');
        heads.forEach((h3) => {
            if (h3.dataset.mpvDone) return;
            const link = h3.querySelector('a.ytLockupMetadataViewModelTitle, a[href*="/watch"], a[href*="/shorts/"]');
            if (!link) return;
            const url = extractVideoUrl(link.href);
            if (!url) return;
            h3.dataset.mpvDone = '1';

            h3.style.display = 'flex';
            h3.style.alignItems = 'center';
            h3.style.gap = '6px';

            const btn = document.createElement('button');
            btn.className = 'mpv-icon-btn';
            btn.title = 'watch in mpv';
            btn.setAttribute('aria-label', 'watch in mpv');
            btn.appendChild(createPlayIcon(11));
            btn.style.cssText =
                'flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;' +
                'width:20px;height:20px;padding:0;border:none;border-radius:50%;cursor:pointer;' +
                'background:var(--yt-spec-badge-chip-background,#272727);';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openInMpv(url);
            });
            h3.appendChild(btn);
        });
    }

    // --- wiring -----------------------------------------------------------

    function injectAll() {
        injectTitleButton();
        injectFeedButtons();
        injectLockupButtons();
    }

    window.addEventListener('yt-navigate-finish', injectAll);
    new MutationObserver(injectAll).observe(document.body, { childList: true, subtree: true });
    injectAll();
})();
