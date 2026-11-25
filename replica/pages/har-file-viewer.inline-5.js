
    (function () {
      if (location.hash && location.hash.indexOf('#share=') === 0) {
        window.__harShareFragment = location.hash;
        history.replaceState(history.state, '', location.pathname + location.search);
      }
    })();
  