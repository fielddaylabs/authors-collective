(function () {
  "use strict";

  var mounts = document.querySelectorAll("[data-authors-collective-dynamic-index-routing]");
  if (!mounts.length) return;

  var defaultDemoOrigin = "https://dynamic-index-routing-agent-studio.authorscollective.org";

  function fallbackFor(mount) {
    var id = mount.getAttribute("data-fallback-id");
    if (id) return document.getElementById(id);
    var next = mount.nextElementSibling;
    return next && next.hasAttribute("data-authors-collective-dynamic-index-routing-fallback") ? next : null;
  }

  function moveFallbackOutsideMount(mount, fallback) {
    if (fallback && fallback.parentElement === mount && mount.parentElement) {
      mount.parentElement.insertBefore(fallback, mount.nextSibling);
    }
  }

  function setHostTheme(mount) {
    mount.style.display = "block";
    mount.style.setProperty("--ink", "#15221f");
    mount.style.setProperty("--muted", "#6c7873");
    mount.style.setProperty("--line", "#dfe5de");
    mount.style.setProperty("--paper", "#f5f7f2");
    mount.style.setProperty("--panel", "#fffefa");
    mount.style.setProperty("--lime", "#c9f26d");
    mount.style.setProperty("--lime-deep", "#6c8e1e");
    mount.style.setProperty("--blue", "#dce9ff");
    mount.style.setProperty("--red", "#a7453d");
    mount.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  function loadRuntime(origin, root, fallback) {
    var runtime = document.createElement("script");
    runtime.type = "module";
    runtime.src = new URL("/app.js", origin).href;
    runtime.dataset.authorsCollectiveDynamicIndexRoutingRuntime = "true";

    function showFallback() {
      if (fallback) fallback.hidden = false;
    }

    runtime.addEventListener("error", showFallback, { once: true });
    window.addEventListener("dynamic-routing-demo-ready", function (event) {
      if (!event.detail || event.detail.root !== root) return;
      if (fallback) fallback.hidden = true;
    });
    window.addEventListener("dynamic-routing-demo-error", function (event) {
      if (!event.detail || event.detail.root !== root) return;
      showFallback();
    });
    document.head.appendChild(runtime);
  }

  async function mountLive(mount, fallback) {
    if (mount.getAttribute("data-ac-initialized") === "true") return;
    mount.setAttribute("data-ac-initialized", "true");
    moveFallbackOutsideMount(mount, fallback);

    var origin = (mount.getAttribute("data-demo-origin") || defaultDemoOrigin).replace(/\/+$/, "");
    var selector = mount.getAttribute("data-demo-selector") || ".shell";
    var fragmentUrl = new URL("/embed", origin).href;
    var shadow = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : null;
    var root = shadow || mount;
    setHostTheme(mount);

    try {
      var response = await fetch(fragmentUrl, { headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error("The interactive demo could not be loaded.");
      var html = await response.text();
      var parsed = new DOMParser().parseFromString(html, "text/html");
      var container = parsed.querySelector(selector);
      if (!container) throw new Error("The interactive demo container could not be found.");
      container.setAttribute("data-dynamic-routing-demo", "true");

      if (shadow) {
        var style = document.createElement("style");
        style.textContent = ":host{display:block}";
        shadow.appendChild(style);
        var stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = new URL("/styles.css", origin).href;
        shadow.appendChild(stylesheet);
        shadow.appendChild(container);
      } else {
        mount.replaceChildren(container);
      }

      window.__DYNAMIC_ROUTING_DEMO_ORIGIN__ = origin;
      window.__DYNAMIC_ROUTING_DEMO_ROOT__ = root;
      loadRuntime(origin, root, fallback);
    } catch (error) {
      if (fallback) fallback.hidden = false;
      mount.removeAttribute("data-ac-initialized");
    }
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    mount.setAttribute("data-demo-origin", mount.getAttribute("data-demo-origin") || defaultDemoOrigin);
    mount.setAttribute("data-demo-selector", mount.getAttribute("data-demo-selector") || ".shell");
    mountLive(mount, fallbackFor(mount));
  });
})();
