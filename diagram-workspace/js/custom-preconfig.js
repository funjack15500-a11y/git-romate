(function ()
{
    var SITE_LANG_KEY = 'drawio-site-lang';
    var DRAWIO_CONFIG_KEY = '.drawio-config';
    var SUPPORTED_LANGS = { zh: true, en: true };
    var BRAND = {
        accent: '#d48a1a',
        accentSoft: '#ffe3b3',
        ink: '#1f2937',
        inkSoft: '#5f6f84',
        shellGlow: 'rgba(212,138,26,0.18)',
        image: 'images/brand-mark.svg',
        zh: {
            title: '图表工作台 | 自托管图表编辑器',
            brandLabel: '图表工作台',
            eyebrow: 'Self-hosted Diagram Lab',
            subline: '双语界面 / 自托管部署 / 浏览器优先',
            intro: '基于开源图表编辑器内核整理的离线图表工作台，适合流程图、UML、ER、网络图和通用架构设计。',
            status: '正在唤醒图表引擎...',
            hint: '如果加载稍慢，通常是浏览器仍在初始化图形库、模板和资源。',
            desc: '一个双语、自托管的图表工作台，适合流程图、UML、ER、网络图和通用架构设计。',
            switchLabel: '语言',
            switchAria: '语言切换',
            shellLang: 'zh-CN'
        },
        en: {
            title: 'Diagram Workspace | Self-hosted Diagram Editor',
            brandLabel: 'Diagram Workspace',
            eyebrow: 'Self-hosted Diagram Lab',
            subline: 'Bilingual UI / Self-hosted / Browser-first',
            intro: 'A polished diagram workspace built on an open-source diagram editor core for flowcharts, UML, ER diagrams, network maps, and architecture design.',
            status: 'Warming up the diagram engine...',
            hint: 'If loading takes a moment, the browser is usually initializing libraries, shapes, and templates.',
            desc: 'A bilingual self-hosted diagram workspace for flowcharts, UML, ER, network diagrams, and architecture design.',
            switchLabel: 'Language',
            switchAria: 'Language switcher',
            shellLang: 'en'
        }
    };

    var origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
    var basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    var baseUrl = origin + (basePath === '/' ? '' : basePath.replace(/\/$/, ''));
    var currentUrl = new URL(window.location.href);

    function normalizeLang(value)
    {
        if (!value)
        {
            return null;
        }

        var lang = String(value).toLowerCase();

        if (lang.indexOf('zh') === 0)
        {
            return 'zh';
        }

        if (lang.indexOf('en') === 0)
        {
            return 'en';
        }

        return SUPPORTED_LANGS[lang] ? lang : null;
    }

    function safeGetItem(key)
    {
        try
        {
            return window.localStorage ? localStorage.getItem(key) : null;
        }
        catch (e)
        {
            return null;
        }
    }

    function safeSetItem(key, value)
    {
        try
        {
            if (window.localStorage)
            {
                localStorage.setItem(key, value);
            }
        }
        catch (e)
        {
            // ignore
        }
    }

    function getConfigLanguage()
    {
        var raw = safeGetItem(DRAWIO_CONFIG_KEY);

        if (!raw)
        {
            return null;
        }

        try
        {
            var parsed = JSON.parse(raw);
            return normalizeLang(parsed != null ? parsed.language : null);
        }
        catch (e)
        {
            return null;
        }
    }

    function persistLanguage(lang)
    {
        safeSetItem(SITE_LANG_KEY, lang);

        var raw = safeGetItem(DRAWIO_CONFIG_KEY);
        var parsed = {};

        if (raw)
        {
            try
            {
                parsed = JSON.parse(raw) || {};
            }
            catch (e)
            {
                parsed = {};
            }
        }

        parsed.language = lang;
        safeSetItem(DRAWIO_CONFIG_KEY, JSON.stringify(parsed));
    }

    function getPreferredLanguage()
    {
        return normalizeLang(currentUrl.searchParams.get('lang')) ||
            normalizeLang(safeGetItem(SITE_LANG_KEY)) ||
            getConfigLanguage() ||
            'zh';
    }

    function getTexts(lang)
    {
        return lang === 'en' ? BRAND.en : BRAND.zh;
    }

    function setMeta(selector, content)
    {
        var element = document.querySelector(selector);

        if (element)
        {
            element.setAttribute('content', content);
        }
    }

    function setHref(selector, href)
    {
        var element = document.querySelector(selector);

        if (element)
        {
            element.setAttribute('href', href);
        }
    }

    function applyShellLanguage(lang)
    {
        var texts = getTexts(lang);

        document.documentElement.lang = texts.shellLang;
        document.title = texts.title;
        document.body.setAttribute('data-site-lang', lang);

        setMeta('meta[name="Description"]', texts.desc);
        setMeta('meta[name="description"]', texts.desc);
        setMeta('meta[itemprop="name"]', texts.title);
        setMeta('meta[itemprop="description"]', texts.desc);
        setMeta('meta[itemprop="image"]', BRAND.image);
        setMeta('meta[name="application-name"]', texts.brandLabel);
        setMeta('meta[name="apple-mobile-web-app-title"]', texts.brandLabel);
        setMeta('meta[name="theme-color"]', BRAND.accent);
        setHref('link[rel="icon"][type="image/svg+xml"]', BRAND.image);

        var heading = document.getElementById('customShellTitle');
        if (heading) heading.textContent = texts.brandLabel;

        var eyebrow = document.getElementById('customShellEyebrow');
        if (eyebrow) eyebrow.textContent = texts.eyebrow;

        var subline = document.getElementById('customShellSubline');
        if (subline) subline.textContent = texts.subline;

        var intro = document.getElementById('customShellIntro');
        if (intro) intro.textContent = texts.intro;

        var status = document.getElementById('customStatusText');
        if (status) status.textContent = texts.status;

        var hint = document.getElementById('customShellHint');
        if (hint) hint.textContent = texts.hint;
    }

    function getResourceOverrides(lang)
    {
        if (lang === 'en')
        {
            return {
                'draw.io': 'Diagram Workspace',
                aboutDrawio: 'About Diagram Workspace',
                createdByDraw: 'Created by Diagram Workspace',
                drawPrev: 'Diagram preview',
                drawDiag: 'Diagram',
                drawSvgPrev: 'SVG preview',
                prevInDraw: 'Preview in Diagram Workspace',
                configLinkWarn: 'This link configures this editor. Only click OK if you trust the source.',
                configLinkConfirm: 'Click OK to configure and restart this editor.'
            };
        }

        return {
            'draw.io': '图表工作台',
            aboutDrawio: '关于图表工作台',
            createdByDraw: '由图表工作台创建',
            drawPrev: '图表预览',
            drawDiag: '图表',
            drawSvgPrev: 'SVG 预览',
            prevInDraw: '在图表工作台中预览',
            configLinkWarn: '该链接将配置此编辑器。仅当您信任提供该链接的人时才点击确定。',
            configLinkConfirm: '点击确定以配置并重启此编辑器。'
        };
    }

    function applyResourceOverrides(lang)
    {
        if (!window.mxResources || !mxResources.resources)
        {
            return false;
        }

        var overrides = getResourceOverrides(lang);

        for (var key in overrides)
        {
            mxResources.resources[key] = overrides[key];
        }

        return true;
    }

    function scheduleResourceOverrides(lang)
    {
        var attempts = 0;

        function retryApply()
        {
            attempts++;

            if (applyResourceOverrides(lang) || attempts >= 30)
            {
                return;
            }

            window.setTimeout(retryApply, attempts < 10 ? 150 : 400);
        }

        retryApply();
        window.addEventListener('load', retryApply);
    }

    function ensureBrandStyles()
    {
        if (document.getElementById('customBrandStyles'))
        {
            return;
        }

        var style = document.createElement('style');
        style.id = 'customBrandStyles';
        style.textContent = [
            ':root{--brand-accent:' + BRAND.accent + ';--brand-accent-soft:' + BRAND.accentSoft + ';--brand-ink:' + BRAND.ink + ';--brand-ink-soft:' + BRAND.inkSoft + ';--brand-shell-glow:' + BRAND.shellGlow + ';--glass-bg:rgba(18,30,46,0.56);--glass-bg-soft:rgba(255,255,255,0.08);--glass-bg-strong:rgba(14,24,38,0.76);--glass-border:rgba(255,255,255,0.14);--glass-border-strong:rgba(255,255,255,0.24);--glass-shadow:0 24px 60px rgba(5,10,20,0.24);--glass-highlight:inset 0 1px 0 rgba(255,255,255,0.16);}',
            'html,body{min-height:100%;}',
            'body.geEditor.geClassic{background:radial-gradient(circle at top left, rgba(168,196,232,0.18), transparent 26%),radial-gradient(circle at 85% 10%, rgba(212,138,26,0.16), transparent 22%),radial-gradient(circle at bottom right, rgba(255,255,255,0.1), transparent 24%),linear-gradient(180deg, #15202b 0%, #0f1724 100%);}',
            'body.geEditor.geClassic:before{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 16%, rgba(255,255,255,0.08), transparent 22%),radial-gradient(circle at 76% 78%, rgba(212,138,26,0.12), transparent 24%);mix-blend-mode:screen;opacity:0.7;z-index:0;}',
            'body.geEditor.geClassic:after{content:"";position:fixed;inset:18px;border-radius:30px;border:1px solid rgba(255,255,255,0.05);pointer-events:none;z-index:0;}',
            '#geInfo{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;}',
            '.customShell{position:relative;z-index:2;overflow:hidden;max-width:760px;margin:0;padding:36px 38px 32px;border-radius:34px;border:1px solid var(--glass-border-strong);background:linear-gradient(180deg, rgba(26,40,59,0.72), rgba(14,22,34,0.58));backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%);box-shadow:0 28px 70px rgba(3,8,18,0.3), var(--glass-highlight);text-align:left;min-width:min(100%, 580px);}',
            '.customShell:before{content:"";position:absolute;inset:auto -90px -120px auto;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, var(--brand-shell-glow) 0%, rgba(212,138,26,0) 72%);pointer-events:none;}',
            '.customShell:after{content:"";position:absolute;inset:-90px auto auto -70px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle, rgba(177,203,238,0.18) 0%, rgba(177,203,238,0) 72%);pointer-events:none;}',
            '.customShell *{position:relative;z-index:1;}',
            '.brandHero{display:flex;align-items:center;gap:20px;margin-bottom:20px;}',
            '.brandHeroText{min-width:0;}',
            '.brandMarkFrame{width:84px;height:84px;display:flex;align-items:center;justify-content:center;border-radius:28px;background:linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));border:1px solid rgba(255,255,255,0.12);box-shadow:0 18px 38px rgba(0,0,0,0.18);flex-shrink:0;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}',
            '.brandMarkFrame img{width:58px;height:58px;display:block;filter:drop-shadow(0 10px 18px rgba(11,18,28,0.22));}',
            '.brandEyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,0.08);color:#e1e8f2;font:700 11px/1 "Segoe UI","Microsoft YaHei UI",sans-serif;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}',
            '.brandEyebrow:before{content:"";width:8px;height:8px;border-radius:999px;background:var(--brand-accent);box-shadow:0 0 0 6px rgba(212,138,26,0.14);}',
            '.customShell h1{margin:0;color:#f7f9fc;font-size:42px;font-weight:800;letter-spacing:-0.04em;text-shadow:0 12px 28px rgba(8,12,20,0.28);}',
            '.brandSubline{margin-top:10px;color:#b9c8da;font-size:14px;letter-spacing:0.04em;}',
            '#customShellIntro{margin:0 0 18px;color:#e0e7f2;font-size:16px;line-height:1.75;max-width:640px;}',
            '#geStatus{display:inline-flex;align-items:center;gap:10px;margin:0 0 12px;color:#f7f9fc;font-size:30px;font-weight:800;letter-spacing:-0.03em;text-shadow:0 10px 24px rgba(8,12,20,0.24);}',
            '#geStatus img{width:18px;height:18px;opacity:0.92;}',
            '#customShellHint{margin:0;color:#9eb0c6;font-size:14px;line-height:1.6;}',
            '.geEditor>.geMenubarContainer,.geEditor>.geToolbarContainer,.geEditor>.geSidebarContainer,.geEditor>.geTabContainer,.geDialog,html div.mxWindow{background:linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));border:1px solid var(--glass-border);box-shadow:var(--glass-shadow),var(--glass-highlight);backdrop-filter:blur(24px) saturate(155%);-webkit-backdrop-filter:blur(24px) saturate(155%);}',
            '.geEditor>.geMenubarContainer{margin:12px 12px 0;width:calc(100% - 24px);height:68px;border-radius:26px;overflow:visible;background:linear-gradient(180deg, rgba(34,51,74,0.72), rgba(15,24,38,0.54));}',
            '.geEditor>.geToolbarContainer:not(.geSketch *){margin:8px 12px 0;width:calc(100% - 24px);height:50px;padding:0 14px;border-radius:20px;background:linear-gradient(180deg, rgba(30,44,65,0.62), rgba(18,28,43,0.44));}',
            '.geEditor.geClassic>.geToolbarContainer{border-top-width:1px;border-bottom-width:1px;border-style:solid;border-color:rgba(255,255,255,0.1);}',
            '.geEditor>.geSidebarContainer:not(.geFormatContainer){margin:8px 0 12px 12px;border-radius:28px;background:linear-gradient(180deg, rgba(31,46,67,0.6), rgba(16,25,39,0.42));}',
            '.geEditor>.geSidebarContainer.geFormatContainer{margin:8px 12px 12px 0;border-radius:28px;background:linear-gradient(180deg, rgba(31,46,67,0.58), rgba(16,25,39,0.46));}',
            '.geEditor>.geDiagramContainer{border-radius:30px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 24px 50px rgba(5,10,20,0.18), inset 0 1px 0 rgba(255,255,255,0.16);overflow:hidden;}',
            '.geEditor>.geTabContainer{margin:0 12px 12px;width:calc(100% - 24px);border-radius:20px;background:linear-gradient(180deg, rgba(28,42,62,0.64), rgba(16,25,39,0.42));}',
            '.geEditor>.geHsplit{margin:12px 0 12px 0;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04));box-shadow:inset 0 1px 0 rgba(255,255,255,0.12);}',
            '.geMenubar{top:30px;height:30px;padding:0 10px 0 68px;}',
            '.geFilenameContainer{top:10px;left:74px;right:300px;height:30px;}',
            '.geFilename{padding:5px 10px;border-radius:12px;background:rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.12);}',
            '.geAppIcon{top:14px;left:18px;width:38px;height:38px;border-radius:16px;background-color:rgba(255,255,255,0.12);box-shadow:0 14px 30px rgba(6,12,24,0.22), inset 0 1px 0 rgba(255,255,255,0.14);}',
            '.geSmallAppIcon{padding:0 6px 0 0;filter:drop-shadow(0 6px 12px rgba(8,12,20,0.16));}',
            '.geMenubarContainer .geItem,.geToolbarContainer .geButton,.geToolbarContainer .geColorBtn,.geEditor .geTab,.geDialog>.geButton,.geSidebarContainer button{border-radius:12px;transition:background 160ms ease,box-shadow 160ms ease,transform 160ms ease;}',
            '.geMenubarContainer .geItem:hover,.geToolbarContainer .geButton:hover,.geToolbarContainer .geColorBtn:hover,.geEditor .geTab:hover,.geDialog>.geButton:hover{background:rgba(255,255,255,0.12);box-shadow:inset 0 1px 0 rgba(255,255,255,0.12);}',
            '.geToolbarContainer .geSeparator{opacity:0.3;}',
            '.geButtonContainer .gePrimaryBtn:not(.geEmbedBtn){border-radius:14px;background:linear-gradient(135deg, rgba(234,173,77,0.96), rgba(212,138,26,0.96));box-shadow:0 14px 26px rgba(212,138,26,0.24);}',
            '.geButtonContainer .gePrimaryBtn .geButton{color:#ffffff;}',
            '.geSidebarContainer,.geFormatContainer{overflow:hidden;}',
            '.geSidebarContainer>div,.geFormatContainer>div{background:transparent;}',
            '.geTabContainer .geTabItem,.geEditor .geTab{border-radius:12px;}',
            '.geDialog,html div.mxWindow{border-radius:24px !important;background:linear-gradient(180deg, rgba(30,44,65,0.8), rgba(15,24,38,0.62));border:1px solid var(--glass-border-strong);box-shadow:0 32px 72px rgba(4,10,20,0.32),var(--glass-highlight);}',
            '.geDialogTitle,div td.mxWindowTitle,.geDialogFooter{background:transparent;border-color:rgba(255,255,255,0.1);}',
            '.geDialogTitle,div td.mxWindowTitle{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}',
            '.geDialog input[type="text"],.geDialog input[type="number"],.geDialog textarea,.geDialog select{border-radius:12px;background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.12);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);}',
            '.geDialog input[type="text"]:focus,.geDialog input[type="number"]:focus,.geDialog textarea:focus,.geDialog select:focus{border-color:rgba(212,138,26,0.55);box-shadow:0 0 0 3px rgba(212,138,26,0.16);}',
            '#customLangSwitcher{display:inline-flex;align-items:center;gap:12px;max-width:100%;}',
            '#customLangSwitcher.customLangSwitcher--shell{margin:4px 0 22px;padding:10px 12px 10px 10px;border-radius:999px;background:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.22);box-shadow:0 18px 40px rgba(17,25,39,0.18);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}',
            '#customLangSwitcher.customLangSwitcher--editor{gap:0;margin-right:8px;padding-right:10px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.12);}',
            '.customLangBrand{display:flex;align-items:center;gap:10px;padding-right:4px;}',
            '.customLangBrand img{width:24px;height:24px;display:block;}',
            '.customLangBrandMeta{display:flex;flex-direction:column;min-width:0;}',
            '.customLangLabel{font:700 10px/1 "Segoe UI","Microsoft YaHei UI",sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#8a97a8;margin-bottom:3px;}',
            '.customLangName{font:700 12px/1.1 "Segoe UI","Microsoft YaHei UI",sans-serif;color:var(--brand-ink);white-space:nowrap;}',
            '.customLangTrack{display:flex;align-items:center;gap:4px;padding:4px;background:rgba(240,244,249,0.88);border-radius:999px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.45),inset 0 0 0 1px rgba(116,125,144,0.12);}',
            '.customLangTrack button{border:0;background:transparent;color:#5c6c80;padding:8px 12px;border-radius:999px;font:700 12px/1 "Segoe UI","Microsoft YaHei UI",sans-serif;cursor:pointer;transition:background 160ms ease,color 160ms ease,transform 160ms ease,box-shadow 160ms ease;}',
            '.customLangTrack button:hover{transform:translateY(-1px);}',
            '.customLangTrack button:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(212,138,26,0.26);}',
            '.customLangTrack button.active{background:linear-gradient(135deg, #e2a435, var(--brand-accent));color:#ffffff;box-shadow:0 8px 18px rgba(212,138,26,0.28);}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangBrand{display:none;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack{gap:2px;padding:0;background:transparent;box-shadow:none;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button{padding:4px 8px;border-radius:8px;font-size:12px;line-height:1.2;color:inherit;box-shadow:none;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button:hover{background:rgba(255,255,255,0.12);transform:none;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button.active{background:rgba(212,138,26,0.16);color:#ffc86d;box-shadow:none;}',
            'html body.geDarkMode #customLangSwitcher.customLangSwitcher--editor .customLangTrack button{color:#d9e0ea;}',
            'html body.geDarkMode #customLangSwitcher.customLangSwitcher--editor .customLangTrack button:hover{background:rgba(255,255,255,0.09);}',
            'html body.geDarkMode #customLangSwitcher.customLangSwitcher--editor .customLangTrack button.active{background:rgba(212,138,26,0.22);color:#ffd391;}',
            '@media (max-width: 1100px){.geFilenameContainer{right:220px;}.geEditor>.geSidebarContainer:not(.geFormatContainer){border-radius:24px;}.geEditor>.geSidebarContainer.geFormatContainer{border-radius:24px;}}',
            '@media (max-width: 720px){body.geEditor.geClassic:after{inset:10px;border-radius:20px;}#geInfo{padding:18px;align-items:flex-start;}.customShell{padding:26px 22px 24px;min-width:0;width:100%;border-radius:28px;}.brandHero{align-items:flex-start;gap:16px;}.customShell h1{font-size:34px;}#geStatus{font-size:24px;}#customLangSwitcher.customLangSwitcher--shell{padding:8px 10px;}.customLangBrandMeta{display:none;}.geEditor>.geMenubarContainer,.geEditor>.geToolbarContainer,.geEditor>.geTabContainer{margin-left:8px;margin-right:8px;width:calc(100% - 16px);}.geEditor>.geSidebarContainer:not(.geFormatContainer){margin-left:8px;border-radius:22px;}.geEditor>.geSidebarContainer.geFormatContainer{margin-right:8px;border-radius:22px;}.geEditor>.geTabContainer{margin-bottom:8px;}.geFilenameContainer{right:120px;}.geFilename{max-width:180px;display:inline-block;overflow:hidden;text-overflow:ellipsis;}.customLangTrack button{padding:7px 10px;}#customLangSwitcher.customLangSwitcher--editor{margin-right:6px;padding-right:6px;}#customLangSwitcher.customLangSwitcher--editor .customLangTrack button{padding:4px 7px;font-size:11px;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureContrastStyles()
    {
        if (document.getElementById('customContrastStyles'))
        {
            return;
        }

        var style = document.createElement('style');
        style.id = 'customContrastStyles';
        style.textContent = [
            'body.geEditor.geClassic{color:#e8f0fb;}',
            '.geEditor>.geMenubarContainer{background:linear-gradient(180deg, #29415e 0%, #1c2f49 100%) !important;border-color:rgba(255,255,255,0.12) !important;box-shadow:0 20px 36px rgba(4,10,20,0.22) !important;}',
            '.geEditor>.geToolbarContainer:not(.geSketch *){background:linear-gradient(180deg, #223650 0%, #18283e 100%) !important;border-color:rgba(255,255,255,0.1) !important;}',
            '.geEditor>.geSidebarContainer:not(.geFormatContainer){background:linear-gradient(180deg, #213754 0%, #17273d 100%) !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer{background:linear-gradient(180deg, #223650 0%, #17273d 100%) !important;}',
            '.geEditor>.geTabContainer{background:linear-gradient(180deg, #1f3149 0%, #152336 100%) !important;}',
            '.geEditor>.geDiagramContainer{background:#eef2f7 !important;}',
            '.geMenubarContainer,.geToolbarContainer,.geSidebarContainer,.geFormatContainer,.geTabContainer,.geDialog,div.mxWindow{color:#ffffff !important;text-shadow:none !important;}',
            '.geMenubarContainer *:not(input):not(select):not(textarea):not(option),.geToolbarContainer *:not(input):not(select):not(textarea):not(option),.geSidebarContainer *:not(input):not(select):not(textarea):not(option),.geFormatContainer *:not(input):not(select):not(textarea):not(option),.geTabContainer *:not(input):not(select):not(textarea):not(option),.geDialog *:not(input):not(select):not(textarea):not(option),div.mxWindow *:not(input):not(select):not(textarea):not(option){color:#ffffff !important;text-shadow:none !important;}',
            '.geMenubarContainer .geItem,.geMenubarContainer a,.geMenubarContainer .geFilename,.geToolbarContainer .geButton,.geToolbarContainer .geLabel,.geTabContainer .geTab,.geTabContainer .geTabItem,.geSidebarContainer .geTitle,.geSidebarText,.geSidebarContainer button,.geSidebarContainer a,.geFormatContainer label,.geFormatContainer .geLabel,div.geFormatContainer span,div.geFormatContainer div,div.geFormatContainer td,div.geFormatContainer a{color:#ffffff !important;font-weight:500;}',
            '.geMenubarContainer .geItem:hover,.geToolbarContainer .geButton:hover,.geToolbarContainer .geButton.geActiveItem,.geTabContainer .geTab:hover,.geSidebarContainer button:hover{background:rgba(255,255,255,0.12) !important;color:#ffffff !important;}',
            '.geMenubarContainer .geFilename{color:#ffffff !important;background:rgba(255,255,255,0.1) !important;border:1px solid rgba(255,255,255,0.1) !important;}',
            '.geToolbarContainer .geButton img,.geToolbarContainer .geButton .geAdaptiveAsset,.geSidebarContainer img,.geMenubarContainer img{filter:brightness(1.75) contrast(1.15);}',
            '.geSidebarContainer input,.geSidebarContainer select,.geFormatContainer input,.geFormatContainer select,.geFormatContainer textarea,.geDialog input,.geDialog select,.geDialog textarea{background:rgba(255,255,255,0.96) !important;color:#142133 !important;border:1px solid rgba(15,23,42,0.16) !important;}',
            '.geFormatContainer .geBtn,.geDialog .geBtn,.geSidebarContainer .geBtn{color:#ffffff !important;background:rgba(255,255,255,0.06) !important;border-color:rgba(255,255,255,0.24) !important;}',
            '.geFormatContainer .geBtn:hover,.geDialog .geBtn:hover,.geSidebarContainer .geBtn:hover{background:rgba(255,255,255,0.12) !important;box-shadow:0 8px 16px rgba(15,23,42,0.12) !important;}',
            '.geFormatContainer input[type="checkbox"],.geDialog input[type="checkbox"]{accent-color:' + BRAND.accent + ';}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab,.geEditor>.geSidebarContainer.geFormatContainer .geTabItem{color:#ffffff !important;background:rgba(255,255,255,0.06) !important;border-color:rgba(255,255,255,0.14) !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab:not(.mxDisabled):hover{background:rgba(255,255,255,0.12) !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab.geActiveItem,.geEditor>.geSidebarContainer.geFormatContainer .geTabItem.geActiveItem{color:#142133 !important;background:rgba(255,255,255,0.95) !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button{color:#ffffff !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button.active{color:#fff4d9 !important;background:rgba(212,138,26,0.24) !important;}',
            '@media (max-width: 720px){.geMenubar{padding-left:58px;}.geFilenameContainer{right:110px;}.geEditor>.geMenubarContainer{height:64px;}.geEditor>.geToolbarContainer:not(.geSketch *){height:48px;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureNeutralWorkspaceStyles()
    {
        if (document.getElementById('customNeutralWorkspaceStyles'))
        {
            return;
        }

        var style = document.createElement('style');
        style.id = 'customNeutralWorkspaceStyles';
        style.textContent = [
            'body.geEditor.geClassic{background:#e7edf4 !important;color:#e8f0fb;}',
            'body.geEditor.geClassic:before,body.geEditor.geClassic:after{display:none !important;}',
            '#geInfo{background:#e7edf4 !important;}',
            '.customShell{background:linear-gradient(180deg, rgba(34,52,76,0.86), rgba(22,34,51,0.76)) !important;box-shadow:0 22px 44px rgba(15,23,42,0.12), var(--glass-highlight) !important;}',
            '.geEditor>.geDiagramContainer{box-shadow:0 18px 36px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.16) !important;}',
            '.geEditor>.geMenubarContainer,.geEditor>.geToolbarContainer,.geEditor>.geSidebarContainer,.geEditor>.geTabContainer{box-shadow:0 14px 28px rgba(15,23,42,0.1), var(--glass-highlight) !important;}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureLightChromeStyles()
    {
        if (document.getElementById('customLightChromeStyles'))
        {
            return;
        }

        var style = document.createElement('style');
        style.id = 'customLightChromeStyles';
        style.textContent = [
            'body.geEditor.geClassic{background:#edf1f5 !important;color:#111827 !important;}',
            '#geInfo{background:#edf1f5 !important;}',
            '.customShell{background:#f7f8fa !important;border:1px solid #d7dde5 !important;box-shadow:0 20px 44px rgba(15,23,42,0.08) !important;}',
            '.customShell:before,.customShell:after{display:none !important;}',
            '.customShell h1,#geStatus,#customShellIntro,#customShellHint,.brandSubline,.brandEyebrow{color:#111827 !important;text-shadow:none !important;}',
            '.brandEyebrow{background:#eef2f6 !important;border-color:#d7dde5 !important;}',
            '.brandMarkFrame{background:#ffffff !important;border-color:#d7dde5 !important;box-shadow:0 12px 24px rgba(15,23,42,0.06) !important;}',
            '.geEditor>.geMenubarContainer,.geEditor>.geToolbarContainer:not(.geSketch *),.geEditor>.geSidebarContainer,.geEditor>.geTabContainer,.geDialog,html div.mxWindow{background:#f3f5f7 !important;border:1px solid #d6dbe1 !important;box-shadow:0 12px 28px rgba(15,23,42,0.08) !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}',
            '.geEditor>.geSidebarContainer:not(.geFormatContainer){background:#eef1f4 !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer{background:#eef1f4 !important;}',
            '.geEditor>.geToolbarContainer:not(.geSketch *){background:#f3f5f7 !important;}',
            '.geEditor>.geTabContainer{background:#eceff3 !important;}',
            '.geEditor>.geDiagramContainer{background:#ffffff !important;border:1px solid #d6dbe1 !important;box-shadow:0 18px 36px rgba(15,23,42,0.08) !important;}',
            '.geEditor>.geHsplit{background:#d7dde5 !important;box-shadow:none !important;}',
            '.geMenubarContainer,.geToolbarContainer,.geSidebarContainer,.geFormatContainer,.geTabContainer,.geDialog,div.mxWindow{color:#111827 !important;}',
            '.geMenubarContainer *:not(input):not(select):not(textarea):not(option),.geToolbarContainer *:not(input):not(select):not(textarea):not(option),.geSidebarContainer *:not(input):not(select):not(textarea):not(option),.geFormatContainer *:not(input):not(select):not(textarea):not(option),.geTabContainer *:not(input):not(select):not(textarea):not(option),.geDialog *:not(input):not(select):not(textarea):not(option),div.mxWindow *:not(input):not(select):not(textarea):not(option){color:#111827 !important;text-shadow:none !important;opacity:1 !important;}',
            '.geMenubarContainer .geItem,.geMenubarContainer a,.geMenubarContainer .geFilename,.geToolbarContainer .geButton,.geToolbarContainer .geLabel,.geTabContainer .geTab,.geTabContainer .geTabItem,.geSidebarContainer .geTitle,.geSidebarText,.geSidebarContainer button,.geSidebarContainer a,.geFormatContainer label,.geFormatContainer .geLabel,div.geFormatContainer span,div.geFormatContainer div,div.geFormatContainer td,div.geFormatContainer a{color:#111827 !important;font-weight:500;opacity:1 !important;}',
            '.geMenubarContainer .geItem:hover,.geToolbarContainer .geButton:hover,.geToolbarContainer .geButton.geActiveItem,.geTabContainer .geTab:hover,.geSidebarContainer button:hover,.geButton:hover:not(.mxDisabled,.mxDisabled *,[disabled],.gePageTab *,.geSimpleMainMenu *,.geBtn *,.geButtonGroup *,.geAdaptiveAsset,.gePrimaryBtn){background:#e5e7eb !important;color:#111827 !important;}',
            '.geActiveItem:not(.geButton *, .geButton *),.gePageTab .geButton:hover:not([disabled]),.geButtonGroup .geButton:hover:not([disabled]){background:#e5e7eb !important;color:#111827 !important;}',
            '.geMenubarContainer .geFilename{color:#111827 !important;background:#ffffff !important;border:1px solid #d6dbe1 !important;}',
            '.geToolbarContainer .geButton img,.geToolbarContainer .geButton .geAdaptiveAsset,.geSidebarContainer img,.geMenubarContainer img{filter:none !important;opacity:0.9 !important;}',
            '.geSidebarContainer input,.geSidebarContainer select,.geFormatContainer input,.geFormatContainer select,.geFormatContainer textarea,.geDialog input,.geDialog select,.geDialog textarea{background:#ffffff !important;color:#111827 !important;border:1px solid #cfd6de !important;box-shadow:none !important;}',
            '.geSidebarContainer input::placeholder,.geFormatContainer input::placeholder,.geDialog input::placeholder{color:#6b7280 !important;}',
            '.geFormatContainer .geBtn,.geDialog .geBtn,.geSidebarContainer .geBtn,.geButtonContainer .gePrimaryBtn:not(.geEmbedBtn){color:#111827 !important;background:#f8fafc !important;border:1px solid #d1d5db !important;box-shadow:none !important;}',
            '.geFormatContainer .geBtn:hover,.geDialog .geBtn:hover,.geSidebarContainer .geBtn:hover,.geButtonContainer .gePrimaryBtn:not(.geEmbedBtn):hover{background:#eceff3 !important;color:#111827 !important;}',
            '.geButtonContainer .gePrimaryBtn .geButton{color:#111827 !important;}',
            '.geFormatContainer input[type="checkbox"],.geDialog input[type="checkbox"]{accent-color:#4b5563 !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab,.geEditor>.geSidebarContainer.geFormatContainer .geTabItem{color:#111827 !important;background:#e5e7eb !important;border-color:#d1d5db !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab:not(.mxDisabled):hover{background:#dde2e8 !important;}',
            '.geEditor>.geSidebarContainer.geFormatContainer .geTab.geActiveItem,.geEditor>.geSidebarContainer.geFormatContainer .geTabItem.geActiveItem{color:#111827 !important;background:#ffffff !important;border-color:#d1d5db !important;}',
            '.mxPopupMenu{background:#ffffff !important;border:1px solid #d1d5db !important;box-shadow:0 18px 36px rgba(15,23,42,0.08) !important;}',
            '.mxPopupMenuItem,.mxPopupMenuItem div,.mxPopupMenuItem td{color:#111827 !important;background:#ffffff !important;}',
            'table.mxPopupMenu tr.mxPopupMenuItemHover,.mxPopupMenuItem:hover{background:#eef2f6 !important;color:#111827 !important;}',
            '#customLangSwitcher.customLangSwitcher--editor{border-right:1px solid #d1d5db !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack{background:#e5e7eb !important;box-shadow:none !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button{color:#111827 !important;background:transparent !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button:hover{background:#dde2e8 !important;color:#111827 !important;}',
            '#customLangSwitcher.customLangSwitcher--editor .customLangTrack button.active{background:#ffffff !important;color:#111827 !important;border:1px solid #d1d5db !important;box-shadow:none !important;}',
            '@media (max-width: 720px){.geEditor>.geMenubarContainer,.geEditor>.geToolbarContainer:not(.geSketch *),.geEditor>.geSidebarContainer,.geEditor>.geTabContainer{box-shadow:0 8px 18px rgba(15,23,42,0.06) !important;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function getSwitcherMountTarget()
    {
        return document.querySelector('.geMenubar .geButtonContainer') ||
            document.querySelector('.geMenubar') ||
            document.querySelector('.geMenubarContainer') ||
            null;
    }

    function createLanguageButton(targetLang, label, currentLang)
    {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.className = 'customLangButton' + (targetLang === currentLang ? ' active' : '');
        button.setAttribute('data-lang', targetLang);
        button.addEventListener('click', function ()
        {
            var nextLang = normalizeLang(targetLang) || 'zh';
            persistLanguage(nextLang);

            var nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('lang', nextLang);
            window.location.href = nextUrl.toString();
        });

        return button;
    }

    function ensureLanguageSwitcher(lang)
    {
        var wrap = document.getElementById('customLangSwitcher');

        if (!wrap)
        {
            var texts = getTexts(lang);

            wrap = document.createElement('div');
            wrap.id = 'customLangSwitcher';
            wrap.setAttribute('aria-label', texts.switchAria);

            var brand = document.createElement('div');
            brand.className = 'customLangBrand';

            var brandIcon = document.createElement('img');
            brandIcon.src = BRAND.image;
            brandIcon.alt = '';
            brandIcon.setAttribute('aria-hidden', 'true');

            var brandMeta = document.createElement('div');
            brandMeta.className = 'customLangBrandMeta';

            var brandLabel = document.createElement('span');
            brandLabel.className = 'customLangLabel';
            brandLabel.id = 'customLangLabel';

            var brandName = document.createElement('strong');
            brandName.className = 'customLangName';
            brandName.id = 'customLangName';

            brandMeta.appendChild(brandLabel);
            brandMeta.appendChild(brandName);
            brand.appendChild(brandIcon);
            brand.appendChild(brandMeta);

            var track = document.createElement('div');
            track.className = 'customLangTrack';
            track.appendChild(createLanguageButton('zh', '中文', lang));
            track.appendChild(createLanguageButton('en', 'EN', lang));

            wrap.appendChild(brand);
            wrap.appendChild(track);
        }

        updateLanguageSwitcher(lang);
        return wrap;
    }

    function updateLanguageSwitcher(lang)
    {
        var texts = getTexts(lang);
        var wrap = document.getElementById('customLangSwitcher');

        if (!wrap)
        {
            return;
        }

        wrap.setAttribute('aria-label', texts.switchAria);

        var brandLabel = document.getElementById('customLangLabel');
        if (brandLabel) brandLabel.textContent = texts.switchLabel;

        var brandName = document.getElementById('customLangName');
        if (brandName) brandName.textContent = texts.brandLabel;

        var buttons = wrap.querySelectorAll('button[data-lang]');

        for (var i = 0; i < buttons.length; i++)
        {
            buttons[i].className = 'customLangButton' + (buttons[i].getAttribute('data-lang') === lang ? ' active' : '');
        }
    }

    function mountLanguageSwitcher(lang)
    {
        var wrap = ensureLanguageSwitcher(lang);
        var editorTarget = getSwitcherMountTarget();
        var status = document.getElementById('geStatus');

        if (editorTarget)
        {
            if (wrap.parentNode !== editorTarget)
            {
                if (editorTarget.classList.contains('geButtonContainer'))
                {
                    editorTarget.insertBefore(wrap, editorTarget.firstChild);
                }
                else
                {
                    editorTarget.appendChild(wrap);
                }
            }

            wrap.classList.remove('customLangSwitcher--shell');
            wrap.classList.add('customLangSwitcher--editor');
            return;
        }

        if (status && status.parentNode)
        {
            if (wrap.parentNode !== status.parentNode)
            {
                status.parentNode.insertBefore(wrap, status);
            }

            wrap.classList.remove('customLangSwitcher--editor');
            wrap.classList.add('customLangSwitcher--shell');
        }
    }

    function scheduleSwitcherMount(lang)
    {
        var attempts = 0;

        function retryMount()
        {
            attempts++;
            mountLanguageSwitcher(lang);

            if (getSwitcherMountTarget() || attempts >= 30)
            {
                return;
            }

            window.setTimeout(retryMount, attempts < 10 ? 150 : 400);
        }

        mountLanguageSwitcher(lang);

        window.addEventListener('load', function ()
        {
            retryMount();
        });

        window.setTimeout(retryMount, 250);
    }

    var preferredLanguage = getPreferredLanguage();
    persistLanguage(preferredLanguage);

    window.__DRAWIO_SITE_LANG = preferredLanguage;
    window.DRAWIO_BASE_URL = window.DRAWIO_BASE_URL || baseUrl;
    window.DRAWIO_SERVER_URL = window.DRAWIO_SERVER_URL || origin + basePath;

    document.addEventListener('DOMContentLoaded', function ()
    {
        ensureBrandStyles();
        ensureContrastStyles();
        ensureNeutralWorkspaceStyles();
        ensureLightChromeStyles();
        applyShellLanguage(preferredLanguage);
        scheduleSwitcherMount(preferredLanguage);
        scheduleResourceOverrides(preferredLanguage);
    });
})();
