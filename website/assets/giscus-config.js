// Renegade Reader - Giscus to Waline Compatibility Shim
// Automatically forwards legacy Giscus calls to the new Waline commenting engine
(function() {
  const isSubdir = window.location.pathname.includes('/read/') || window.location.pathname.includes('/chapters/');
  const scriptPath = isSubdir ? '../assets/waline-config.js' : 'assets/waline-config.js';

  if (!window.loadWaline) {
    const s = document.createElement('script');
    s.src = scriptPath;
    document.head.appendChild(s);
  }

  window.loadGiscus = function(container, term) {
    if (window.loadWaline) {
      window.loadWaline(container, term);
    } else {
      window.addEventListener('load', () => {
        if (window.loadWaline) window.loadWaline(container, term);
      });
    }
  };

  window.updateGiscusTheme = function(themeName) {
    if (window.updateWalineTheme) window.updateWalineTheme(themeName);
  };
})();
