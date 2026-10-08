(function () {
  "use strict";

  var mounts = document.querySelectorAll("[data-authors-collective-agent-handoff]");
  if (!mounts.length) return;

  var script = document.currentScript;
  var scriptUrl = script && script.src ? script.src : window.location.href;
  var scriptOrigin = new URL(scriptUrl, window.location.href).origin;
  var defaultImage = new URL("/brand/authors-collective-guild-primary.png", scriptOrigin).href;
  var defaultHref = new URL("/agent-handoff/", scriptOrigin).href;

  function id(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function resolveUrl(value, fallback) {
    try { return new URL(value || fallback, scriptOrigin).href; } catch { return fallback; }
  }

  function fallbackNode(mount, note) {
    var existing = mount.querySelector("[data-handoff-fallback]");
    if (existing) {
      var copy = existing.cloneNode(true);
      copy.classList.add("ach-fallback");
      if (note) {
        var message = document.createElement("div");
        message.className = "ach-fallback-note";
        message.textContent = note;
        copy.appendChild(message);
      }
      return copy;
    }
    var node = document.createElement("div");
    node.className = "ach-fallback";
    node.setAttribute("data-handoff-fallback", "");
    var link = document.createElement("a");
    link.href = resolveUrl(mount.getAttribute("data-fallback-href"), defaultHref);
    var image = document.createElement("img");
    image.src = resolveUrl(mount.getAttribute("data-fallback-image"), defaultImage);
    image.alt = mount.getAttribute("data-fallback-alt") || "Interactive example of a handoff between specialized agents";
    link.appendChild(image);
    node.appendChild(link);
    if (note) {
      var message = document.createElement("div");
      message.className = "ach-fallback-note";
      message.textContent = note;
      node.appendChild(message);
    }
    return node;
  }

  function styleText() {
    return "" +
      ":host{display:block;color:#171714;font:16px/1.45 Arial,sans-serif}" +
      ".ach-wrap{border:1px solid #d8d3c5;border-radius:18px;background:#f7f4eb;overflow:hidden;box-shadow:0 10px 30px rgba(35,31,24,.08)}" +
      ".ach-head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:16px 18px;border-bottom:1px solid #dfdacd}" +
      ".ach-brand{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#817b70}" +
      ".ach-agent{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700}" +
      ".ach-dot{width:7px;height:7px;border-radius:50%;background:#d73524;display:inline-block}" +
      ".ach-messages{padding:18px;display:grid;gap:12px;min-height:145px;max-height:310px;overflow:auto}" +
      ".ach-message{display:flex;gap:9px;align-items:flex-start;max-width:92%}" +
      ".ach-message.ach-user{margin-left:auto;flex-direction:row-reverse}" +
      ".ach-avatar{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#171714;color:#f7f4eb;font-size:11px;font-weight:700;flex:0 0 auto}" +
      ".ach-user .ach-avatar{background:#d73524}" +
      ".ach-bubble{padding:10px 12px;border-radius:13px;background:#fff;border:1px solid #e5e0d5;font-size:14px;white-space:pre-wrap}" +
      ".ach-user .ach-bubble{background:#171714;color:#fff;border-color:#171714}" +
      ".ach-empty{color:#817b70;font-size:14px;padding:12px 0}" +
      ".ach-composer{display:flex;gap:8px;padding:0 18px 16px}" +
      ".ach-composer textarea{flex:1;min-width:0;resize:vertical;border:1px solid #d8d3c5;border-radius:10px;padding:10px 11px;font:inherit;font-size:14px;background:#fff;color:#171714}" +
      ".ach-wrap button{border:0;border-radius:10px;padding:10px 13px;font:700 13px Arial,sans-serif;cursor:pointer;background:#d73524;color:#fff;white-space:nowrap}" +
      ".ach-wrap button.ach-secondary{background:#fff;color:#171714;border:1px solid #c8c1b3}" +
      ".ach-wrap button:disabled{cursor:wait;opacity:.55}" +
      ".ach-actions{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 16px}" +
      ".ach-status{padding:10px 18px;border-top:1px solid #dfdacd;color:#817b70;font-size:12px}" +
      ".ach-status.ach-error{color:#a1291d}" +
      ".ach-fallback{display:grid;gap:9px;margin:0;padding:18px;border:1px solid #d8d3c5;border-radius:18px;background:#f7f4eb}" +
      ".ach-fallback img{display:block;width:100%;height:auto;border-radius:12px}" +
      ".ach-fallback a{color:inherit;text-decoration:none}" +
      ".ach-fallback-note{font-size:13px;color:#817b70}" +
      ".ach-hidden{display:none!important}";
  }

  function mountLive(mount) {
    var apiUrl = resolveUrl(mount.getAttribute("data-api-url"), new URL("/api/agent-handoff", scriptOrigin).href);
    var root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;
    var state = { agent: "sales", messages: [], conversationId: id("demo"), pending: null };
    var context = { userId: "demo-user-01", tenantId: "northstar-demo", plan: "growth" };

    function renderFallback(note) {
      root.innerHTML = "<style>" + styleText() + "</style>";
      root.appendChild(fallbackNode(mount, note));
    }

    root.innerHTML = "<style>" + styleText() + "</style>" +
      "<section class='ach-wrap' aria-label='Specialized agent handoff demonstration'>" +
      "<div class='ach-head'><div class='ach-brand'>Application-owned routing</div><div class='ach-agent'><span class='ach-dot'></span><span data-agent>Sales</span> agent</div></div>" +
      "<div class='ach-messages' data-messages aria-live='polite'></div>" +
      "<form class='ach-composer' data-form><textarea rows='2' required aria-label='Message the active agent' placeholder='Ask Sales about a plan or implementation…'></textarea><button type='submit'>Send</button></form>" +
      "<div class='ach-actions'><button class='ach-secondary' type='button' data-handoff>Switch to Support</button><button class='ach-secondary ach-hidden' type='button' data-cancel>Cancel request</button></div>" +
      "<div class='ach-status' data-status role='status'>The application chooses the destination and transfers only approved context.</div>" +
      "</section>";

    var agentLabel = root.querySelector("[data-agent]");
    var messages = root.querySelector("[data-messages]");
    var form = root.querySelector("[data-form]");
    var input = form.querySelector("textarea");
    var send = form.querySelector("button");
    var handoff = root.querySelector("[data-handoff]");
    var cancel = root.querySelector("[data-cancel]");
    var status = root.querySelector("[data-status]");

    function setStatus(value, error) {
      status.textContent = value;
      status.classList.toggle("ach-error", Boolean(error));
    }

    function message(role, content, agent) {
      return { id: id("msg"), role: role, content: content, agent: agent || state.agent };
    }

    function render() {
      agentLabel.textContent = state.agent === "sales" ? "Sales" : "Support";
      handoff.classList.toggle("ach-hidden", state.agent !== "sales");
      messages.innerHTML = "";
      if (!state.messages.length) {
        var empty = document.createElement("div");
        empty.className = "ach-empty";
        empty.textContent = "Start with Sales, then switch the same conversation to Support.";
        messages.appendChild(empty);
      }
      state.messages.forEach(function (item) {
        var row = document.createElement("div");
        row.className = "ach-message " + (item.role === "user" ? "ach-user" : "");
        var avatar = document.createElement("div");
        avatar.className = "ach-avatar";
        avatar.textContent = item.role === "user" ? "Y" : item.agent === "support" ? "P" : "S";
        var bubble = document.createElement("div");
        bubble.className = "ach-bubble";
        bubble.textContent = item.content;
        row.appendChild(avatar);
        row.appendChild(bubble);
        messages.appendChild(row);
      });
      messages.scrollTop = messages.scrollHeight;
    }

    function setPending(controller) {
      state.pending = controller;
      var busy = Boolean(controller);
      input.disabled = busy;
      send.disabled = busy;
      handoff.disabled = busy;
      cancel.classList.toggle("ach-hidden", !busy);
    }

    function summary() {
      return state.messages.filter(function (item) { return item.role === "user"; }).slice(-3).map(function (item) { return item.content; }).join(" | ").slice(0, 600) || "No prior question has been recorded.";
    }

    async function request(body, controller) {
      var response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var error = new Error(payload.message || "The demo could not complete the request.");
        error.code = payload.error || "request_failed";
        throw error;
      }
      return payload;
    }

    async function sendMessage(event) {
      event.preventDefault();
      var content = input.value.trim();
      if (!content || state.pending) return;
      state.messages.push(message("user", content));
      input.value = "";
      render();
      var controller = new AbortController();
      setPending(controller);
      setStatus("Contacting " + (state.agent === "sales" ? "Sales" : "Support") + "…");
      try {
        var response = await request({ mode: "chat", agent: state.agent, conversationId: state.conversationId, messages: state.messages.slice(-12).map(function (item) { return { id: item.id, role: item.role, content: item.content }; }) }, controller);
        state.messages.push(message("assistant", response.content, response.agent));
        setStatus("Response received.");
      } catch (error) {
        if (error.name === "AbortError") setStatus("Request cancelled.", true);
        else { renderFallback("The live demo is unavailable right now. The fallback image remains available."); return; }
      } finally { setPending(null); render(); }
    }

    async function performHandoff() {
      if (state.pending) return;
      var latest = state.messages.filter(function (item) { return item.role === "user"; }).slice(-1)[0];
      if (!latest) { setStatus("Ask Sales a question before switching to Support.", true); return; }
      var controller = new AbortController();
      setPending(controller);
      setStatus("Validating the destination and transferring the approved packet…");
      try {
        var response = await request({ mode: "handoff", conversationId: state.conversationId, latestQuestion: latest.content, summary: summary(), context: context }, controller);
        state.agent = "support";
        state.messages.push(message("assistant", response.content, "support"));
        setStatus("Handoff complete. Support is now active.");
        render();
      } catch (error) {
        if (error.name === "AbortError") setStatus("Handoff cancelled. Sales remains active.", true);
        else { renderFallback("The live demo is unavailable right now. The fallback image remains available."); return; }
      } finally { setPending(null); }
    }

    form.addEventListener("submit", sendMessage);
    handoff.addEventListener("click", performHandoff);
    cancel.addEventListener("click", function () { if (state.pending) state.pending.abort(); });
    state.messages.push(message("assistant", "I’m Sales. Ask about a plan or implementation, then I can pass the conversation to Support.", "sales"));
    render();
  }

  Array.prototype.forEach.call(mounts, function (mount) {
    if (!mount.querySelector("[data-handoff-fallback]")) mount.appendChild(fallbackNode(mount));
    try { mountLive(mount); } catch { /* Keep the static fallback when initialization is unavailable. */ }
  });
})();
