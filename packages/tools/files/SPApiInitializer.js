(async () => {
  globalThis.SPApiTemp = { NamedComponents: {} };

  const scriptElm = document.createElement('script');
  scriptElm.type = 'module';
  scriptElm.src = '/SPApiCore.js';
  document.head.appendChild(scriptElm);
})();