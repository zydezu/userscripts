// ==UserScript==
// @name         Paywall Bypass Script
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  Mobile and desktop-friendly paywall bypass with dropdown menu and right-click options. Floating button now optional!
// @author       sharmanhall
// @license      MIT
// @icon         data:image/png;base64,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
// @match       *://*.adelaidenow.com.au/*
// @match       *://*.adweek.com/*
// @match       *://*.afr.com/*
// @match       *://*.ambito/*
// @match       *://*.ampproject.org/*
// @match       *://*.baltimoresun.com/*
// @match       *://*.barrons.com/*
// @match       *://*.bizjournals.com/*
// @match       *://*.bloomberg.com/*
// @match       *://*.bloombergquint.com/*
// @match       *://*.bostonglobe.com/*
// @match       *://*.brisbanetimes.com.au/*
// @match       *://*.britannica.com/*
// @match       *://*.businessinsider.com/*
// @match       *://*.caixinglobal.com/*
// @match       *://*.cbsnews.com/*
// @match       *://*.cen.acs.org/*
// @match       *://*.centralwesterndaily.com.au/*
// @match       *://*.chicagobusiness.com/*
// @match       *://*.chicagotribune.com/*
// @match       *://*.corriere.it/*
// @match       *://*.courant.com/*
// @match       *://*.couriermail.com.au/*
// @match       *://*.dailypress.com/*
// @match       *://*.dailytelegraph.com.au/*
// @match       *://*.delfi.ee/*
// @match       *://*.demorgen.be/*
// @match       *://*.denverpost.com/*
// @match       *://*.df.cl/*
// @match       *://*.dynamed.com/*
// @match       *://*.economist.com/*
// @match       *://*.elmercurio.com/*
// @match       *://*.elmundo.es/*
// @match       *://*.elu24.ee/*
// @match       *://*.entreprenal.com/*
// @match       *://*.examiner.com.au/*
// @match       *://*.expansion.com/*
// @match       *://*.espn.com/*
// @match       *://*.fd.nl/*
// @match       *://*.financialpost.com/*
// @match       *://*.fnlondon.com/*
// @match       *://*.foreignpolicy.com/*
// @match       *://*.fortune.com/*
// @match       *://*.ft.com/*
// @match       *://*.gelocal.it/*
// @match       *://*.genomeweb.com/*
// @match       *://*.glassdoor.com/*
// @match       *://*.globes.co.il/*
// @match       *://*.groene.nl/*
// @match       *://*.haaretz.co.il/*
// @match       *://*.haaretz.com/*
// @match       *://*.harpers.org/*
// @match       *://*.hbr.org/*
// @match       *://*.hbrchina.org/*
// @match       *://*.heraldsun.com.au/*
// @match       *://*.historyextra.com/*
// @match       *://*.humo.be/*
// @match       *://*.ilmanifesto.it/*
// @match       *://*.inc.com/*
// @match       *://*.inquirer.com/*
// @match       *://*.interest.co.nz/*
// @match       *://*.investorschronicle.co.uk/*
// @match       *://*.irishtimes.com/*
// @match       *://*.japantimes.co.jp/*
// @match       *://*.journalnow.com/*
// @match       *://*.kansascity.com/*
// @match       *://*.labusinessjournal.com/*
// @match       *://*.lanacion.com.ar/*
// @match       *://*.lastampa.it/*
// @match       *://*.latercera.com/*
// @match       *://*.latimes.com/*
// @match       *://*.lavoixdunord.fr/*
// @match       *://*.lecho.be/*
// @match       *://*.leparisien.fr/*
// @match       *://*.lesechos.fr/*
// @match       *://*.loebclassics.com/*
// @match       *://*.lrb.co.uk/*
// @match       *://*.mcall.com/*
// @match       *://*.medium.com/*
// @match       *://*.medscape.com/*
// @match       *://*.mercurynews.com/*
// @match       *://*.mv-voice.com/*
// @match       *://*.nationalpost.com/*
// @match       *://*.netdna-ssl.com/*
// @match       *://*.news-gazette.com/*
// @match       *://*.newstatesman.com/*
// @match       *://*.newyorker.com/*
// @match       *://*.nrc.nl/*
// @match       *://*.ntnews.com.au/*
// @match       *://*.nydailynews.com/*
// @match       *://*.nymag.com/*
// @match       *://*.nytimes.com/*
// @match       *://*.nzherald.co.nz/*
// @match       *://*.nzz.ch/*
// @match       *://*.ocregister.com/*
// @match       *://*.orlandosentinel.com/*
// @match       *://*.outbrain.com/*
// @match       *://*.paloaltoonline.com/*
// @match       *://*.parool.nl/*
// @match       *://*.piano.io/*
// @match       *://*.poool.fr/*
// @match       *://*.postimees.ee/*
// @match       *://*.qiota.com/*
// @match       *://*.qz.com/*
// @match       *://*.repubblica.it/*
// @match       *://*.republic.ru/*
// @match       *://*.reuters.com/*
// @match       *://*.sandiegouniontribune.com/*
// @match       *://*.scientificamerican.com/*
// @match       *://*.scmp.com/*
// @match       *://*.seattletimes.com/*
// @match       *://*.seekingalpha.com/*
// @match       *://*.slate.com/*
// @match       *://*.smh.com.au/*
// @match       *://*.sofrep.com/*
// @match       *://*.spectator.co.uk/*
// @match       *://*.spectator.com.au/*
// @match       *://*.spectator.us/*
// @match       *://*.speld.nl/*
// @match       *://*.startribune.com/*
// @match       *://*.statista.com/*
// @match       *://*.stuff.co.nz/*
// @match       *://*.sueddeutsche.de/*
// @match       *://*.sun-sentinel.com/*
// @match       *://*.techinasia.com/*
// @match       *://*.technologyreview.com/*
// @match       *://*.telegraaf.nl/*
// @match       *://*.telegraph.co.uk/*
// @match       *://*.the-tls.co.uk/*
// @match       *://*.theadvocate.com.au/*
// @match       *://*.theage.com.au/*
// @match       *://*.theathletic.co.uk/*
// @match       *://*.theathletic.com/*
// @match       *://*.theatlantic.com/*
// @match       *://*.theaustralian.com.au/*
// @match       *://*.thediplomat.com/*
// @match       *://*.theglobeandmail.com/*
// @match       *://*.theherald.com.au/*
// @match       *://*.thehindu.com/*
// @match       *://*.themarker.com/*
// @match       *://*.themercury.com.au/*
// @match       *://*.thenation.com/*
// @match       *://*.thenational.scot/*
// @match       *://*.theolivepress.es/*
// @match       *://*.thesaturdaypaper.com.au/*
// @match       *://*.thestar.com/*
// @match       *://*.thewrap.com/*
// @match       *://*.tijd.be/*
// @match       *://*.time.com/*
// @match       *://*.tinypass.com/*
// @match       *://*.towardsdatascience.com/*
// @match       *://*.trouw.nl/*
// @match       *://*.vanityfair.com/*
// @match       *://*.vn.nl/*
// @match       *://*.volkskrant.nl/*
// @match       *://*.washingtonpost.com/*
// @match       *://*.wired.com/*
// @match       *://*.wsj.com/*
// @match       *://*.zeit.de/*
// @match       *://*.usatoday.com/*
// @match       *://*.time.com/*
// @match       *://*.theatlantic.com/*
// @match       *://*.americanbanker.com/*
// @match       *://*.japantimes.co.jp/*
// @match       *://*.wsj.com/*
// @match       *://*.cnbc.com/*
// @match       *://*.financialpost.com/*
// @match       *://*.wired.com/*
// @match       *://*.seekingalpha.com/*
// @match       *://*.ipolitics.ca/*
// @match       *://*.discovermagazine.com/*
// @match       *://*.faz.net/*
// @match       *://*.rp-online.de/*
// @match       *://*.spiegel.de/*
// @match       *://*.tagesspiegel.de/*
// @match       *://*.welt.de/*
// @match       *://*.wz.de/*
// @match       *://*.rp.pl/*
// @match       *://*.wyborcza.pl/*
// @match       *://*.tagesanzeiger.ch/*
// @match       *://*.elpais.com/*
// @match       *://*.english.elpais.com/*
// @match       *://*.insight.kontan.co.id/*
// @match       *://*.inkl.com/*
// @match       *://*.usatoday.com/*
// @match       *://*.cnn.com/*
// @match       *://*.foxnews.com/*
// @match       *://*.nbcnews.com/*
// @match       *://*.washingtonpost.com/*
// @match       *://*.google.com/news/*
// @match       *://*.forbes.pl/*
// @match       *://*.onet.pl/*
// @match       *://*.politico.com/*
// @match       *://*.economist.com/*
// @match       *://*.newyorktimes.com/*
// @match       *://*.marketwatch.com/*
// @match       *://*.thejournal.ie/*
// @match       *://*.independent.co.uk/*
// @match       *://*.independent.ie/*
// @match       *://*.dailymail.co.uk/*
// @match       *://*.theguardian.com/*
// @match       *://*.ft.com/*
// @match       *://*.wsj.com/*
// @match       *://*.bloomberg.com/*
// @match       *://*.reuters.com/*
// @match       *://*.apnews.com/*
// @match       *://*.axios.com/*
// @match       *://*.vox.com/*
// @match       *://*.propublica.org/*
// @match       *://*.theverge.com/*
// @match       *://*.arstechnica.com/*
// @match       *://*.techcrunch.com/*
// @match       *://*.engadget.com/*
// @match       *://*.gizmodo.com/*
// @match       *://*.kotaku.com/*
// @match       *://*.jalopnik.com/*
// @match       *://*.lifehacker.com/*
// @match       *://*.theroot.com/*
// @match       *://*.jezebel.com/*
// @match       *://*.deadspin.com/*
// @match       *://*.avclub.com/*
// @match       *://*.theonion.com/*
// @match       *://*.clickhole.com/*
// @match       *://*.motherjones.com/*
// @match       *://*.rollingstone.com/*
// @match       *://*.variety.com/*
// @match       *://*.hollywoodreporter.com/*
// @match       *://*.deadline.com/*
// @match       *://*.entertainment.ie/*
// @match       *://*.ew.com/*
// @match       *://*.people.com/*
// @match       *://*.usmagazine.com/*
// @match       *://*.tmz.com/*
// @match       *://*.pagesix.com/*
// @match       *://*.nypost.com/*
// @match       *://*.dailybeast.com/*
// @match       *://*.buzzfeed.com/*
// @match       *://*.buzzfeednews.com/*
// @match       *://*.huffpost.com/*
// @match       *://*.salon.com/*
// @match       *://*.theintercept.com/*
// @match       *://*.vice.com/*
// @match       *://*.motherboard.vice.com/*
// @match       *://*.thedailybeast.com/*
// @match       *://*.crunchbase.com/*
// @match       *://*.pitchbook.com/*
// @match       *://*.404media.co/*
// @match       *://*.thetimes.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL https://update.greasyfork.org/scripts/495817/Paywall%20Bypass%20Script%20%2812ftio%2C%20Google%20Cache%2C%20PaywallBustercom%29.user.js
// @updateURL https://update.greasyfork.org/scripts/495817/Paywall%20Bypass%20Script%20%2812ftio%2C%20Google%20Cache%2C%20PaywallBustercom%29.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Configuration - Load saved preference or default to true
    let showFloatingButton = GM_getValue('showFloatingButton', true);

    // Constants
    const _12FT_PREFIX = "https://12ft.io/proxy?ref=pro&q=";
    const _12FT_ORIGIN = new URL(_12FT_PREFIX).origin;
    const PAYWALLBUSTER_PREFIX = "https://paywallbuster.com/q/";
    const PAYWALLBUSTER_ORIGIN = new URL(PAYWALLBUSTER_PREFIX).origin;

    // Function to toggle floating button visibility
    function toggleFloatingButton() {
        showFloatingButton = !showFloatingButton;
        GM_setValue('showFloatingButton', showFloatingButton);

        const container = document.getElementById('bypassContainer');
        if (container) {
            container.style.display = showFloatingButton ? 'block' : 'none';
        }

        // Show notification
        alert(`Floating button ${showFloatingButton ? 'enabled' : 'disabled'}. Refresh the page for the change to take effect.`);
        location.reload();
    }

    // Add styles for floating button and dropdown
    GM_addStyle(`
        #bypassContainer {
            position: fixed;
            bottom: 5px;
            right: 5px;
            z-index: 99999999999;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif!important;
            line-height: 1.6;
            display: ${showFloatingButton ? 'block' : 'none'};
        }
        #bypassButton {
            width: 115px;
            color: #FFF;
            background: #00000090;
            cursor: pointer;
            padding: 4px;
            border: none;
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 8px;
            backdrop-filter: blur(5px);
            font-size: 14px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif!important;
            text-transform: unset!important;
            transition: background 0.10s;
        }
        #bypassButton:hover {
            background: #000000D0;
        }
        #bypassDropdown {
            display: none;
            position: absolute;
            bottom: 100%;
            right: 0;
            width: 115px;
            color: #FFF;
            background: #00000090;
            margin-bottom: 2px;
            text-align: center;
            border: 1px solid #ccc;
            border-radius: 8px;
            backdrop-filter: blur(5px);
            transition: background 0.10s
        }
        #bypassDropdown.show {
            display: block;
        }
        .bypass-option {
            display: block;
            padding: 6px;
            text-decoration: none;
            color: inherit;
            font-size: 14px;
            border-bottom: 1px solid #ccccccb0;
            transition: background 0.10s;
        }
        .bypass-option:first-child {
            border-radius: 8px 8px 0 0;
        }
        .bypass-option:last-child {
            border: none;
            border-radius: 0 0 8px 8px;
        }
        .bypass-option:hover {
            background: #000000B0;
        }
        .bypass-option a {
            color: #FFF!important;
            text-decoration: underline;
            text-transform: unset!important;
            text-underline-offset: unset!important;
            background-color: unset!important;
        }
    `);

    // Only create the floating button if enabled
    if (showFloatingButton) {
        // Create container and button elements
        const container = document.createElement('div');
        container.id = 'bypassContainer';

        const button = document.createElement('button');
        button.id = 'bypassButton';
        button.innerHTML = 'Bypass Paywall';

        const dropdown = document.createElement('div');
        dropdown.id = 'bypassDropdown';

        // Add dropdown options
        const options = [
            { text: 'Archive.ph', link: getArchivePageLink('https://archive.ph/newest/') },
            { text: 'Archive.is', link: getArchivePageLink('https://archive.is/newest/') },
            { text: 'RemovePaywall', link: getArchivePageLink('https://removepaywall.com/search?url=') },
            { text: 'Archive.org', link: getArchivePageLink('https://web.archive.org/web/') },
        ];

        options.forEach(option => {
            const a = document.createElement('a');
            a.href = option.link;
            a.classList.add("bypass-option");
            a.innerText = option.text;
            a.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(a);
        });

        // Add elements to container
        container.appendChild(button);
        container.appendChild(dropdown);
        document.body.appendChild(container);

        // Toggle dropdown on button click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentUrl = window.location.href;
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    // Check if the protocol is valid (http or https)
    function isValidProtocol(url) {
        return new URL(url).protocol.startsWith("http");
    }

    // Function to open archive pages
    function getArchivePageLink(baseURL) {
        const currentUrl = window.location.href;
        const urlWithoutParams = currentUrl.split('?')[0];
        if (isValidProtocol(currentUrl)) {
            return baseURL + encodeURIComponent(urlWithoutParams);
        }
    }

    // Remove duplicate button inside iframe
    function removeDuplicateButton() {
        const iframe = document.getElementById('proxy-frame');
        if (iframe) {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            const duplicateButton = iframeDocument.getElementById('bypassButton');
            if (duplicateButton) {
                duplicateButton.remove();
            }
        }
    }

    window.addEventListener('load', removeDuplicateButton);
})();