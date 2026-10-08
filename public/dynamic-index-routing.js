(function () {
  "use strict";

  var mounts = document.querySelectorAll("[data-authors-collective-dynamic-index-routing]");
  if (!mounts.length) return;

  var currentScript = document.currentScript;
  if (!currentScript || !currentScript.src) currentScript = document.querySelector("script[src*='dynamic-index-routing.js']");
  var scriptUrl = currentScript && currentScript.src ? currentScript.src : window.location.href;
  var scriptOrigin = new URL(scriptUrl, window.location.href).origin;
  var defaultApiUrl = new URL("/api/dynamic-index-routing", scriptOrigin).href;

  function fallbackFor(mount) {
    var id = mount.getAttribute("data-fallback-id");
    if (id) return document.getElementById(id);
    var next = mount.nextElementSibling;
    return next && next.hasAttribute("data-authors-collective-dynamic-index-routing-fallback") ? next : null;
  }

  function styleText() {
    return "" +
      ":host{display:block;color:#171714;font:16px/1.45 Arial,sans-serif}" +
      ".adr-wrap{border:1px solid #d8d3c5;border-radius:18px;background:#f7f4eb;overflow:hidden;box-shadow:0 10px 30px rgba(35,31,24,.08)}" +
      ".adr-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px 18px;border-bottom:1px solid #dfdacd}" +
      ".adr-brand{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#817b70}" +
      ".adr-title{font-size:13px;font-weight:700}" +
      ".adr-body{display:grid;grid-template-columns:minmax(170px,.7fr) minmax(0,1.3fr);gap:18px;padding:18px}" +
      ".adr-label{display:block;margin-bottom:7px;color:#817b70;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}" +
      ".adr-routes{display:grid;gap:8px}" +
      ".adr-route,.adr-example{width:100%;border:1px solid #d8d3c5;border-radius:11px;background:#fff;color:#171714;text-align:left;padding:10px 11px;font:inherit;cursor:pointer}" +
      ".adr-route strong{display:block;font-size:14px}.adr-route small{display:block;margin-top:3px;color:#817b70;font-size:12px;line-height:1.35}" +
      ".adr-route.adr-selected{border-color:#d73524;box-shadow:0 0 0 2px rgba(215,53,36,.12)}" +
      ".adr-question{display:grid;gap:8px}.adr-examples{display:flex;flex-wrap:wrap;gap:7px}.adr-example{width:auto;padding:7px 9px;font-size:12px}" +
      ".adr-question textarea{width:100%;min-height:78px;box-sizing:border-box;resize:vertical;border:1px solid #d8d3c5;border-radius:11px;padding:10px 11px;background:#fff;color:#171714;font:14px/1.4 Arial,sans-serif}" +
      ".adr-actions{display:flex;align-items:center;gap:9px}.adr-actions button{border:0;border-radius:10px;padding:10px 13px;background:#d73524;color:#fff;font:700 13px Arial,sans-serif;cursor:pointer}.adr-actions button:disabled{cursor:wait;opacity:.55}" +
      ".adr-status{color:#817b70;font-size:12px}.adr-status.adr-error{color:#a1291d}" +
      ".adr-answer,.adr-evidence{margin:0 18px 18px;padding:14px;border:1px solid #dfdacd;border-radius:12px;background:#fff}" +
      ".adr-answer h3,.adr-evidence h3{margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#817b70}" +
      ".adr-answer pre{margin:0;white-space:pre-wrap;font:14px/1.5 Arial,sans-serif}" +
      ".adr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.adr-grid div{min-width:0}.adr-grid dt{color:#817b70;font-size:11px}.adr-grid dd{margin:2px 0 0;overflow-wrap:anywhere;font-size:13px}" +
      "@media(max-width:680px){.adr-body{grid-template-columns:1fr}.adr-grid{grid-template-columns:1fr}}";
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function mountLive(mount, fallback) {
    if (mount.getAttribute("data-ac-initialized") === "true") return;
    mount.setAttribute("data-ac-initialized", "true");
    var apiUrl = mount.getAttribute("data-api-url") || defaultApiUrl;
    var root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;
    var state = { routes: [], selected: "", running: false };

    root.innerHTML = "<style>" + styleText() + "</style>" +
      "<section class='adr-wrap' aria-label='Dynamic index routing demonstration'>" +
      "<div class='adr-head'><span class='adr-brand'>Application-owned routing</span><span class='adr-title'>One Agent Studio agent</span></div>" +
      "<div class='adr-body'><div><span class='adr-label'>Choose a context</span><div class='adr-routes' data-routes></div></div>" +
      "<form class='adr-question' data-form><span class='adr-label'>Ask the same agent</span><div class='adr-examples' data-examples></div>" +
      "<textarea required maxlength='4000' aria-label='Question' data-question placeholder='Ask a question…'></textarea>" +
      "<div class='adr-actions'><button type='submit' data-run>Send to the agent</button><span class='adr-status' data-status role='status'>Loading approved routes…</span></div></form></div>" +
      "<div class='adr-answer' data-answer-panel hidden><h3>Response</h3><pre data-answer></pre></div>" +
      "<div class='adr-evidence' data-evidence-panel hidden><h3>What the request did</h3><dl class='adr-grid' data-evidence></dl></div>" +
      "</section>";

    var routesNode = root.querySelector("[data-routes]");
    var examplesNode = root.querySelector("[data-examples]");
    var form = root.querySelector("[data-form]");
    var question = root.querySelector("[data-question]");
    var run = root.querySelector("[data-run]");
    var status = root.querySelector("[data-status]");
    var answerPanel = root.querySelector("[data-answer-panel]");
    var answer = root.querySelector("[data-answer]");
    var evidencePanel = root.querySelector("[data-evidence-panel]");
    var evidence = root.querySelector("[data-evidence]");

    function selectedRoute() {
      return state.routes.find(function (route) { return route.id === state.selected; }) || null;
    }

    function setStatus(text, isError) {
      status.textContent = text;
      status.classList.toggle("adr-error", Boolean(isError));
    }

    function indices(route) {
      return Array.isArray(route && route.indices) && route.indices.length ? route.indices.join(", ") : "No search index returned";
    }

    function renderRoutes() {
      routesNode.replaceChildren();
      state.routes.forEach(function (route) {
        var button = createElement("button", "adr-route" + (route.id === state.selected ? " adr-selected" : ""));
        button.type = "button";
        button.disabled = state.running;
        button.setAttribute("aria-pressed", route.id === state.selected ? "true" : "false");
        button.appendChild(createElement("strong", "", route.label || route.id));
        button.appendChild(createElement("small", "", (route.description || "") + " Scope: " + indices(route)));
        button.addEventListener("click", function () {
          state.selected = route.id;
          question.value = (route.examples && route.examples[0]) || "";
          renderRoutes();
          renderExamples();
        });
        routesNode.appendChild(button);
      });
    }

    function renderExamples() {
      examplesNode.replaceChildren();
      var route = selectedRoute();
      (route && route.examples || []).forEach(function (example) {
        var button = createElement("button", "adr-example", example);
        button.type = "button";
        button.disabled = state.running;
        button.addEventListener("click", function () { question.value = example; question.focus(); });
        examplesNode.appendChild(button);
      });
    }

    function renderEvidence(data) {
      evidence.replaceChildren();
      var values = [
        ["Route time", data.timings && data.timings.routeMs !== undefined ? data.timings.routeMs + " ms" : "—"],
        ["Completion time", data.timings && data.timings.completionMs !== undefined ? data.timings.completionMs + " ms" : "—"],
        ["Requested scope", (data.selectedIndices || []).join(", ") || "—"],
        ["Searched index", (data.executedSearchIndices || []).join(", ") || "Not reported"],
      ];
      values.forEach(function (pair) {
        var wrapper = document.createElement("div");
        wrapper.appendChild(createElement("dt", "", pair[0]));
        wrapper.appendChild(createElement("dd", "", pair[1]));
        evidence.appendChild(wrapper);
      });
      evidencePanel.hidden = false;
    }

    async function request(options) {
      var response = await fetch(apiUrl, options);
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(payload.message || payload.error || "The demo request failed.");
      return payload;
    }

    async function loadRoutes() {
      try {
        var data = await request({ headers: { Accept: "application/json" } });
        state.routes = Array.isArray(data.routes) ? data.routes : [];
        state.selected = state.routes[0] && state.routes[0].id || "";
        renderRoutes();
        renderExamples();
        if (state.selected) question.value = state.routes[0].examples && state.routes[0].examples[0] || "";
        if (fallback) fallback.hidden = true;
        setStatus("The server will resolve the route before the request runs.");
      } catch (error) {
        setStatus(error.message || "The live demo is unavailable.", true);
        if (fallback) fallback.hidden = false;
      }
    }

    async function submit(event) {
      event.preventDefault();
      var route = selectedRoute();
      var value = question.value.trim();
      if (!route || !value || state.running) return;
      state.running = true;
      run.disabled = true;
      renderRoutes();
      renderExamples();
      answerPanel.hidden = true;
      evidencePanel.hidden = true;
      setStatus("Running the server-controlled request…");
      try {
        var data = await request({
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ route: route.id, question: value }),
        });
        answer.textContent = data.answer || "The agent returned no text.";
        answerPanel.hidden = false;
        renderEvidence(data);
        setStatus("Response received.");
      } catch (error) {
        setStatus(error.message || "The live demo is unavailable.", true);
      } finally {
        state.running = false;
        run.disabled = false;
        renderRoutes();
        renderExamples();
      }
    }

    form.addEventListener("submit", submit);
    loadRoutes();
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    var fallback = fallbackFor(mount);
    try { mountLive(mount, fallback); } catch { if (fallback) fallback.hidden = false; }
  });
})();
