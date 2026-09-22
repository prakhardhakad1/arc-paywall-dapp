/**
 * ArcGate 1-Line Embeddable Widget
 * Enables instant USDC micro-paywalls on any blog, website, Notion doc, or CMS.
 */
(function () {
  function initArcGateWidgets() {
    var scripts = document.querySelectorAll('script[data-gate-id]');
    scripts.forEach(function (script) {
      if (script.getAttribute('data-loaded')) return;
      script.setAttribute('data-loaded', 'true');

      var gateId = script.getAttribute('data-gate-id') || '1';
      var theme = script.getAttribute('data-theme') || 'dark';
      var host = script.src.split('/widget.js')[0] || window.location.origin;

      var container = document.createElement('div');
      container.className = 'arcgate-widget-container';
      container.style.cssText =
        'margin: 16px 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';

      var card = document.createElement('div');
      card.style.cssText =
        'background: ' + (theme === 'dark' ? '#0b0f19' : '#ffffff') + ';' +
        'color: ' + (theme === 'dark' ? '#f1f5f9' : '#0f172a') + ';' +
        'border: 1px solid ' + (theme === 'dark' ? 'rgba(56, 189, 248, 0.3)' : '#e2e8f0') + ';' +
        'border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);' +
        'display: flex; flex-direction: column; gap: 12px; max-width: 520px;';

      card.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: space-between;">' +
        '  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; font-weight: 700;">' +
        '    🛡️ Protected by ArcGate • Arc Mainnet' +
        '  </span>' +
        '  <span style="font-size: 11px; font-family: monospace; color: #94a3b8;">Gate #' + gateId + '</span>' +
        '</div>' +
        '<div style="font-size: 14px; font-weight: 600; line-height: 1.4;">' +
        '  This exclusive content is locked behind an instant native USDC micro-payment on Circle\'s Arc Mainnet.' +
        '</div>' +
        '<a href="' + host + '?unlock=' + gateId + '" target="_blank" rel="noopener noreferrer" style="' +
        '  display: inline-flex; align-items: center; justify-content: center; gap: 8px;' +
        '  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff;' +
        '  text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px;' +
        '  border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); text-align: center;' +
        '  transition: transform 0.15s ease;' +
        '">' +
        '  ⚡ Unlock on ArcGate (USDC)' +
        '</a>';

      script.parentNode.insertBefore(card, script.nextSibling);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArcGateWidgets);
  } else {
    initArcGateWidgets();
  }
})();
