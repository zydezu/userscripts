// ==UserScript==
// @name         X reply nuker
// @namespace    local.reply-nuker
// @version      5.0.0
// @description  Bulk delete your own replies on x.com from a filter:replies search
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const LS_KEY = 'reply-nuker-cfg';
    const LS_HANDLE = 'reply-nuker-handle';

    const DEFAULTS = {
        dryRun: true,
        minDelay: 1400,
        maxDelay: 3000,
        maxDeletions: 500,
    };

    const IDLE_LIMIT = 8;
    const FOREIGN_RUN_LIMIT = 25;

    const CFG = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}'));

    const SEL = {
        article: ['article[data-testid="tweet"]', 'article[role="article"]'],
        caret: ['[data-testid="caret"]', 'button[aria-haspopup="menu"]'],
        menu: ['[data-testid="Dropdown"]', '[role="menu"]'],
        menuitem: ['[role="menuitem"]', '[data-testid="Dropdown"] [role="button"]'],
        dialog: ['[role="dialog"]', '[data-testid="sheetDialog"]'],
        userName: ['[data-testid="User-Name"]'],
        socialContext: ['[data-testid="socialContext"]'],
        primaryColumn: ['[data-testid="primaryColumn"]'],
    };

    const DELETE_RE = /^(delete|löschen|supprimer|eliminar|elimina|excluir|verwijderen|usuń|törlés|sil|удалить|видалити|删除|刪除|削除|삭제|حذف|מחק)/i;
    const CONFIRM_RE = /^(delete|yes|ok|löschen|supprimer|eliminar|elimina|excluir|verwijderen|usuń|sil|удалить|删除|刪除|削除|삭제|حذف|מחק)/i;
    const MORE_RE = /^(show more replies|show additional replies|show probable spam|more replies)/i;
    const RETRY_RE = /^(retry|try again|reload)/i;
    const REPLY_RE = /^(replying to|antwort an|en réponse à|en respuesta a|in risposta a|em resposta a|als antwoord op|w odpowiedzi do|yanıt olarak|в ответ|回复|回覆|返信先|답글)/i;
    const REPOST_RE = /(repost|retweet|reposteó|repostado)/i;

    let running = false;
    let deleted = 0;
    let flagged = 0;
    let failStreak = 0;
    let foreignRun = 0;
    let recommendations = false;
    const seen = new Set();
    const killed = [];
    const stats = { notMine: 0, notReply: 0, repost: 0, failed: 0 };

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const rand = (a, b) => Math.floor(a + Math.random() * (b - a));
    const txt = el => ((el && el.textContent) || '').trim();
    const skippedTotal = () => stats.notMine + stats.notReply + stats.repost + stats.failed;

    function saveCfg() {
        localStorage.setItem(LS_KEY, JSON.stringify({
            dryRun: CFG.dryRun,
            minDelay: CFG.minDelay,
            maxDelay: CFG.maxDelay,
            maxDeletions: CFG.maxDeletions,
        }));
    }

    function context() {
        if (/^\/search\/?$/.test(location.pathname)) {
            const raw = new URLSearchParams(location.search).get('q') || '';
            if (!/filter:\s*replies/i.test(raw)) return null;
            const m = raw.match(/from:@?([A-Za-z0-9_]{1,15})/i);
            if (!m) return null;
            return { me: m[1].toLowerCase(), kind: 'search' };
        }
        const m = location.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/with_replies/);
        if (m) {
            localStorage.setItem(LS_HANDLE, m[1]);
            return { me: m[1].toLowerCase(), kind: 'profile' };
        }
        return null;
    }

    function searchUrl(handle) {
        const q = `from:${handle} filter:replies`;
        return `https://x.com/search?q=${encodeURIComponent(q)}&src=typed_query&f=live`;
    }

    function q(root, list) {
        for (const s of list) {
            const el = root.querySelector(s);
            if (el) return el;
        }
        return null;
    }

    function qa(root, list) {
        for (const s of list) {
            const els = root.querySelectorAll(s);
            if (els.length) return [...els];
        }
        return [];
    }

    async function waitFor(fn, timeout = 5000, step = 120) {
        const end = Date.now() + timeout;
        for (; ;) {
            let v = null;
            try { v = fn(); } catch (_) { v = null; }
            if (v) return v;
            if (Date.now() >= end) return null;
            await sleep(step);
        }
    }

    function pressEscape() {
        for (const target of [document, document.body]) {
            target.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true,
            }));
        }
    }

    async function dismissOverlays() {
        for (let i = 0; i < 3; i++) {
            if (!q(document, SEL.menu) && !q(document, SEL.dialog)) return true;
            pressEscape();
            await sleep(250);
        }
        return !q(document, SEL.menu) && !q(document, SEL.dialog);
    }

    function tweetId(article) {
        for (const a of article.querySelectorAll('a[href*="/status/"]')) {
            const m = (a.getAttribute('href') || '').match(/\/status\/(\d+)/);
            if (m) return m[1];
        }
        return null;
    }

    function articleAuthor(article) {
        const block = q(article, SEL.userName) || article;
        for (const a of block.querySelectorAll('a[href^="/"]')) {
            const h = a.getAttribute('href') || '';
            if (/^\/[A-Za-z0-9_]{1,15}$/.test(h)) return h.slice(1).toLowerCase();
        }
        return null;
    }

    function hasReplyContext(article) {
        for (const d of article.querySelectorAll('div,span')) {
            const t = txt(d);
            if (!t || t.length > 300) continue;
            if (REPLY_RE.test(t)) return true;
        }
        return false;
    }

    function isRepost(article) {
        const sc = q(article, SEL.socialContext);
        return !!sc && REPOST_RE.test(txt(sc));
    }

    function findNextTarget() {
        const ctx = context();
        if (!ctx) return null;

        for (const art of qa(document, SEL.article)) {
            if (!art.isConnected) continue;
            const id = tweetId(art);
            if (!id || seen.has(id)) continue;

            if (articleAuthor(art) !== ctx.me) {
                seen.add(id);
                stats.notMine++;
                foreignRun++;
                if (foreignRun >= FOREIGN_RUN_LIMIT) recommendations = true;
                continue;
            }

            foreignRun = 0;

            if (isRepost(art)) { seen.add(id); stats.repost++; continue; }

            if (ctx.kind === 'profile' && !hasReplyContext(art)) {
                seen.add(id);
                stats.notReply++;
                continue;
            }

            return art;
        }
        return null;
    }

    function highlight(el, colour) {
        try {
            el.style.outline = `2px solid ${colour}`;
            el.style.outlineOffset = '-2px';
        } catch (_) { }
    }

    function clickLabelled(re) {
        for (const n of document.querySelectorAll('[role="button"],button,span')) {
            const t = txt(n);
            if (!t || t.length > 60 || !re.test(t)) continue;
            if (n.closest('[data-testid="UserCell"]')) continue;
            (n.closest('[role="button"],button') || n).click();
            return true;
        }
        return false;
    }

    function scrollBottom() {
        const col = q(document, SEL.primaryColumn);
        const doc = document.scrollingElement || document.documentElement;
        if (col && col.scrollHeight > col.clientHeight + 40 && col.scrollTop + col.clientHeight < col.scrollHeight - 40) {
            col.scrollTop = col.scrollHeight;
            return;
        }
        doc.scrollTop = doc.scrollHeight;
    }

    async function growTimeline() {
        if (clickLabelled(MORE_RE) || clickLabelled(RETRY_RE)) {
            await sleep(2000);
            if (findNextTarget()) return;
        }

        window.scrollBy({ top: Math.floor(window.innerHeight * 0.85), behavior: 'instant' });
        await sleep(1400);
        if (findNextTarget()) return;

        scrollBottom();
        await sleep(1800);
        if (findNextTarget()) return;

        window.scrollBy({ top: -Math.floor(window.innerHeight * 0.6), behavior: 'instant' });
        await sleep(700);
        scrollBottom();
        await sleep(2000);
    }

    async function processArticle(article) {
        if (!article.isConnected) return 'gone';
        if (!(await dismissOverlays())) return 'overlay-stuck';

        const caret = q(article, SEL.caret);
        if (!caret) return 'no-caret';
        caret.click();

        const menu = await waitFor(() => q(document, SEL.menu), 5000);
        if (!menu) return 'no-menu';

        const item = qa(menu, SEL.menuitem).find(el => DELETE_RE.test(txt(el)));
        if (!item) {
            await dismissOverlays();
            return 'not-mine';
        }
        if (CFG.dryRun) {
            await dismissOverlays();
            return 'dry-run';
        }

        item.click();

        const confirm = await waitFor(() => {
            const el = document.querySelector('[data-testid="confirmationSheetConfirm"]');
            if (el) return el;
            const dlg = q(document, SEL.dialog);
            if (!dlg) return null;
            return [...dlg.querySelectorAll('[role="button"],button')].find(b => CONFIRM_RE.test(txt(b))) || null;
        }, 5000);

        if (!confirm) {
            await dismissOverlays();
            return 'no-confirm';
        }

        confirm.click();

        const id = tweetId(article);
        const gone = await waitFor(
            () => (!article.isConnected || (id && !document.querySelector(`a[href*="/status/${id}"]`))),
            6000
        );
        await sleep(400);
        await dismissOverlays();

        return gone ? 'deleted' : 'unconfirmed';
    }

    async function loop() {
        let idleRounds = 0;

        while (running && deleted < CFG.maxDeletions) {
            const ctx = context();
            if (!ctx) {
                status('navigated away - stopped');
                return stop();
            }

            let target = null;
            try {
                target = findNextTarget();
            } catch (e) {
                console.error('[reply-nuker] scan', e);
            }

            if (!target) {
                render();
                if (recommendations) {
                    status('reached recommendation feed - stopped');
                    return stop();
                }
                idleRounds++;
                status(`looking for more (${idleRounds}/${IDLE_LIMIT})`);
                if (idleRounds >= IDLE_LIMIT) {
                    status('nothing left in reach - stopped');
                    return stop();
                }
                try {
                    await growTimeline();
                } catch (e) {
                    console.error('[reply-nuker] scroll', e);
                }
                continue;
            }

            idleRounds = 0;
            const id = tweetId(target);

            try {
                target.scrollIntoView({ block: 'center' });
            } catch (_) { }
            await sleep(350);

            let result = 'error';
            try {
                result = await processArticle(target);
            } catch (e) {
                console.error('[reply-nuker] delete', e);
            }

            if (result !== 'gone') seen.add(id);

            if (result === 'deleted') {
                deleted++; failStreak = 0; killed.push(id);
            } else if (result === 'dry-run') {
                flagged++; failStreak = 0; highlight(target, '#f59e0b');
            } else if (result === 'not-mine') {
                stats.notMine++;
            } else if (result !== 'gone') {
                stats.failed++; failStreak++;
                highlight(target, '#ef4444');
                console.warn('[reply-nuker] skipped', id, result);
            }

            render();

            if (failStreak >= 4) {
                const cool = Math.min(300000, 30000 * Math.pow(2, failStreak - 4));
                status(`backing off ${Math.round(cool / 1000)}s`);
                await dismissOverlays();
                await sleep(cool);
                if (failStreak >= 8) {
                    status('too many failures - stopped');
                    return stop();
                }
            }

            await sleep(rand(CFG.minDelay, CFG.maxDelay));
        }

        if (deleted >= CFG.maxDeletions) status('hit session cap - stopped');
        stop();
    }

    let panel, statusEl, countEl, modeEl;

    function status(t) { if (statusEl) statusEl.textContent = t; }

    function render() {
        if (!countEl) return;
        countEl.textContent = `${CFG.dryRun ? flagged + ' flagged' : deleted + ' deleted'} · ${skippedTotal()} skipped`;
        countEl.title = `not mine: ${stats.notMine}\nno reply context: ${stats.notReply}\nreposts: ${stats.repost}\nfailed: ${stats.failed}`;

        const ctx = context();
        if (!modeEl) return;
        if (ctx && ctx.kind === 'search') {
            modeEl.innerHTML = '<span style="color:#00ba7c">search mode</span> - every hit is a reply';
        } else if (ctx) {
            const handle = localStorage.getItem(LS_HANDLE) || ctx.me;
            modeEl.innerHTML = `<span style="color:#f59e0b">profile mode</span> - needs "Replying to" markers · <a href="${searchUrl(handle)}" style="color:#1d9bf0">use search</a>`;
        } else {
            modeEl.textContent = '';
        }
    }

    function stop() {
        running = false;
        console.info('[reply-nuker] summary', {
            deleted, flagged, ...stats, scanned: seen.size, recommendations,
        });
        const btn = panel && panel.querySelector('#rn-go');
        if (btn) { btn.textContent = 'start'; btn.style.background = '#1d9bf0'; }
    }

    function start() {
        if (running) { status('stopped'); return stop(); }
        const ctx = context();
        if (!ctx) return status('open with_replies or a filter:replies search');
        running = true;
        failStreak = 0;
        foreignRun = 0;
        recommendations = false;
        const btn = panel.querySelector('#rn-go');
        btn.textContent = 'stop';
        btn.style.background = '#ef4444';
        status(CFG.dryRun ? 'dry run - highlighting only' : 'deleting…');
        loop().catch(e => {
            console.error('[reply-nuker] fatal', e);
            status('crashed - see console');
            stop();
        });
    }

    function reset() {
        seen.clear();
        killed.length = 0;
        deleted = flagged = foreignRun = 0;
        stats.notMine = stats.notReply = stats.repost = stats.failed = 0;
        recommendations = false;
        render();
        status('counters cleared');
    }

    function dumpLog() {
        const blob = new Blob([killed.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'deleted-reply-ids.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function buildPanel() {
        panel = document.createElement('div');
        panel.id = 'reply-nuker';
        panel.style.cssText = `
      position:fixed;bottom:16px;right:16px;z-index:99999;width:250px;
      background:#15202b;color:#e7e9ea;border:1px solid #38444d;border-radius:0px;
      padding:12px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4);`;
        panel.innerHTML = `
      <div style="font-weight:600;margin-bottom:6px">reply nuker</div>
      <div id="rn-mode" style="font-size:11px;color:#8899a6;margin-bottom:8px"></div>
      <label style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <input type="checkbox" id="rn-dry"> dry run
      </label>
      <label style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        delay <input type="number" id="rn-min" style="width:52px;background:#0f1419;color:inherit;border:1px solid #38444d;border-radius:0px;padding:2px 4px">
        – <input type="number" id="rn-max" style="width:52px;background:#0f1419;color:inherit;border:1px solid #38444d;border-radius:0px;padding:2px 4px"> ms
      </label>
      <label style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        cap <input type="number" id="rn-cap" style="width:64px;background:#0f1419;color:inherit;border:1px solid #38444d;border-radius:0px;padding:2px 4px">
      </label>
      <button id="rn-go" style="width:100%;padding:6px;border:0;border-radius:0px;background:#1d9bf0;color:#fff;font-weight:600;cursor:pointer">start</button>
      <div style="display:flex;justify-content:space-between;margin-top:8px;gap:8px">
        <span id="rn-count" style="font-size:12px">0 deleted · 0 skipped</span>
        <span style="font-size:12px">
          <a id="rn-reset" href="#" style="color:#8899a6;text-decoration:none">reset</a>
          <a id="rn-log" href="#" style="color:#1d9bf0;text-decoration:none;margin-left:6px">log</a>
        </span>
      </div>
      <div id="rn-status" style="margin-top:4px;color:#8899a6;font-size:12px">idle</div>`;
        document.body.appendChild(panel);

        statusEl = panel.querySelector('#rn-status');
        countEl = panel.querySelector('#rn-count');
        modeEl = panel.querySelector('#rn-mode');

        const dry = panel.querySelector('#rn-dry');
        const min = panel.querySelector('#rn-min');
        const max = panel.querySelector('#rn-max');
        const cap = panel.querySelector('#rn-cap');

        dry.checked = CFG.dryRun;
        min.value = CFG.minDelay;
        max.value = CFG.maxDelay;
        cap.value = CFG.maxDeletions;

        dry.onchange = () => { CFG.dryRun = dry.checked; saveCfg(); render(); };
        min.onchange = () => { CFG.minDelay = Math.max(400, +min.value || DEFAULTS.minDelay); saveCfg(); };
        max.onchange = () => { CFG.maxDelay = Math.max(CFG.minDelay + 200, +max.value || DEFAULTS.maxDelay); saveCfg(); };
        cap.onchange = () => { CFG.maxDeletions = Math.max(1, +cap.value || DEFAULTS.maxDeletions); saveCfg(); };

        panel.querySelector('#rn-go').onclick = start;
        panel.querySelector('#rn-log').onclick = e => { e.preventDefault(); dumpLog(); };
        panel.querySelector('#rn-reset').onclick = e => { e.preventDefault(); reset(); };

        render();
    }

    let lastUrl = null;
    setInterval(() => {
        const ctx = context();
        if (ctx && !document.getElementById('reply-nuker')) {
            buildPanel();
        } else if (!ctx && panel) {
            stop();
            panel.remove();
            panel = null;
            statusEl = countEl = modeEl = null;
        }
        const url = location.pathname + location.search;
        if (url !== lastUrl) {
            lastUrl = url;
            if (running && !ctx) stop();
            render();
        }
    }, 1000);
})();
