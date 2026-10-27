'use strict';
    (() => { try {
      const saved = localStorage.getItem('onelaser-workos-theme');
      document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.lang = localStorage.getItem('onelaser-workos-language') === 'en' ? 'en' : 'zh-CN';
    } catch { document.documentElement.dataset.theme = 'light'; } })();

