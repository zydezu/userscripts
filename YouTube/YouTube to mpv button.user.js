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

    const MENU_ID = 'mpv-context-menu';

    // youtube enforces Trusted Types and blocks raw HTML string assignment
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // mpv logo
    function createPlayIcon(size) {
        size = size || 14;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 60 60');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.style.display = 'block';
        svg.style.pointerEvents = 'none';

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('transform', 'translate(30,30) scale(0.92) translate(-30,-30)');

        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', '30');
        circle.setAttribute('cy', '30');
        circle.setAttribute('r', '29');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);

        const tri = document.createElementNS(SVG_NS, 'path');
        tri.setAttribute('d', 'M 24 20 L 24 40 L 38 30 Z');
        tri.setAttribute('fill', '#ffffff');
        tri.setAttribute('stroke', 'none');
        g.appendChild(tri);

        svg.appendChild(g);

        return svg;
    }

    function createMpvButton(iconSize, cssText) {
        const b = document.createElement('button');
        b.className = 'mpv-icon-btn';
        b.title = 'Watch in mpv';
        b.setAttribute('aria-label', 'Watch in mpv');
        b.appendChild(createPlayIcon(iconSize));
        b.style.cssText = cssText;
        return b;
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
            color: #c084fc;
        }
    `;
    document.head.appendChild(btnStyle);

    // helpers
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

    // native "..." action menu injection
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
        item.setAttribute('aria-label', 'Watch in mpv');
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

    // feed title buttons (home page, search, sidebar, etc)
    function injectFeedButtons() {
        const titles = document.querySelectorAll('a#video-title-link, a#video-title');
        titles.forEach((titleEl) => {
            const container = titleEl.closest('ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
            if (!container || container.dataset.mpvDone) return;
            const url = extractVideoUrl(titleEl.href);
            if (!url) return;

            // place the button on the metadata row (author / views / upload time)
            const metaRow = container.querySelector('#metadata-line');
            if (!metaRow) return; // wait until the metadata row is rendered
            container.dataset.mpvDone = '1';
            const target = metaRow;

            const btn = createMpvButton(14,
                'margin-left:8px;display:inline-flex;align-items:center;justify-content:center;' +
                'width:22px;height:22px;padding:0;border:none;border-radius:50%;' +
                'cursor:pointer;vertical-align:middle;flex-shrink:0;' +
                'background:var(--yt-spec-badge-chip-background,#272727);');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openInMpv(url);
            });
            if (metaRow) {
                metaRow.style.flexWrap = 'nowrap';
                metaRow.style.alignItems = 'center';
                const lastItem = metaRow.querySelector('span.inline-metadata-item:last-child, .inline-metadata-item:last-child');
                if (lastItem) lastItem.insertAdjacentElement('afterend', btn);
                else metaRow.appendChild(btn);
            } else titleEl.insertAdjacentElement('afterend', btn);
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

            const lockup = h3.closest('yt-lockup-view-model, ytd-rich-item-renderer, ytd-video-renderer');
            const meta = lockup && (lockup.querySelector('yt-content-metadata-view-model') || lockup.querySelector('.yt-lockup-metadata-view-model') || lockup.querySelector('#metadata-line') || lockup.querySelector('#metadata'));
            const metaRow = meta && (meta.querySelector('.ytContentMetadataViewModelMetadataRow') || meta.querySelector('[role="group"]') || meta);

            if (!meta) {
                h3.style.display = 'flex';
                h3.style.alignItems = 'center';
                h3.style.gap = '6px';
            }

            const btn = createMpvButton(11,
                'margin-left:5px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;' +
                'width:20px;height:20px;padding:0;border:none;border-radius:50%;cursor:pointer;' +
                'background:var(--yt-spec-badge-chip-background,#272727);');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openInMpv(url);
            });
            if (meta) {
                try { meta.style.flexWrap = 'nowrap'; meta.style.alignItems = 'center'; } catch (e) { }
                const row = metaRow || meta;
                try { row.style.flexWrap = 'nowrap'; row.style.alignItems = 'center'; } catch (e) { }
                const last = row.lastElementChild;
                if (last) last.insertAdjacentElement('afterend', btn);
                else row.appendChild(btn);
            } else h3.appendChild(btn);
        });
    }

    // action bar button (watch page: likes / share / save row)
    function getActionBarContainer() {
        const selectors = [
            '#top-level-buttons-computed',
            '#flexible-item-buttons',
            'ytd-menu-renderer #top-level-buttons-computed',
        ];
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) return el;
        }
        return null;
    }

    function injectActionBarButton() {
        const existing = document.getElementById('mpv-action-btn');

        if (!location.pathname.startsWith('/watch')) {
            if (existing) existing.remove();
            return;
        }

        const container = getActionBarContainer();
        if (!container) return;

        if (existing) {
            if (existing.parentElement === container) return;
            existing.remove();
        }

        const b = createMpvButton(24,
            'margin-left:8px;display:inline-flex;align-items:center;justify-content:center;' +
            'width:40px;height:40px;padding:0;border:none;border-radius:50%;cursor:pointer;' +
            'background:var(--yt-spec-badge-chip-background,#272727);' +
            'box-shadow:0 1px 3px rgba(0,0,0,0.4);');
        b.id = 'mpv-action-btn';
        b.addEventListener('click', () => {
            const u = currentWatchUrl();
            if (u) openInMpv(u);
        });
        container.appendChild(b);
    }

    // wiring
    function injectAll() {
        injectActionBarButton();
        injectFeedButtons();
        injectLockupButtons();
    }

    window.addEventListener('yt-navigate-finish', injectAll);
    new MutationObserver(injectAll).observe(document.body, { childList: true, subtree: true });
    injectAll();
})();
