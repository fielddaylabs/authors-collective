/*
 * Synthetic article applet: one query, five fictional agent configurations.
 * The reader selects a setup, opens its configuration details, then inspects
 * one sample answer and three short metric explanations. Overall is the rounded
 * arithmetic mean of the three displayed metrics, solely to demonstrate how a
 * total can hide a weak category. No ship/revise decision is presented.
 */
(function () {
  "use strict";

  var mounted = new WeakSet();
  var metricNames = ["Relevance", "Faithfulness", "Tone"];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  }

  function mount(node) {
    if (mounted.has(node)) return;
    mounted.add(node);

    var fixture = window.AC_WYS_FIXTURE;
    if (!fixture || !fixture.configurations || !fixture.configurations.length) {
      node.textContent = "The synthetic example could not load.";
      console.error("Would-you-ship applet: load would-you-ship-fixture.js before would-you-ship.js.");
      return;
    }

    var shadow = node.shadowRoot || node.attachShadow({ mode: "open" });
    var styles = `
      :host{all:initial;display:block;color:#202323;font:15px/1.5 system-ui,-apple-system,sans-serif}
      *{box-sizing:border-box}
      .app{max-width:960px;margin:24px auto;padding:clamp(16px,3vw,28px);border:1px solid #dce1df;border-radius:18px;background:#fff}
      h2{margin:0;font-size:clamp(23px,4vw,32px);line-height:1.2;letter-spacing:-.025em}
      h3{margin:0 0 10px;font-size:16px;line-height:1.3}
      p{margin:0}
      .intro,.note{color:#596561}
      .intro{margin-top:8px}
      .badge{flex:none;border:1px solid #e8d6b5;background:#fff8ea;border-radius:20px;padding:5px 10px;color:#59471f;font-size:12px}
      .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
      .query{margin:22px 0;padding:15px 17px;border-left:4px solid #276356;background:#f3f7f5;border-radius:0 10px 10px 0}
      .query strong{display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#53615c}
      fieldset{padding:0;border:0;margin:0}
      legend{margin-bottom:4px;font-size:18px;font-weight:700}
      .note{font-size:13px}
      .options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
      .option{min-width:0;border:1px solid #dce3df;border-radius:12px;padding:12px;background:#fff;transition:border-color .15s,background .15s}
      .option.selected{border-color:#276356;background:#f5f9f7;box-shadow:0 0 0 1px #276356}
      .choice{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:10px;cursor:pointer}
      .choice input{margin:4px 0 0;accent-color:#276356}
      .choice-name{font-weight:700}
      .choice-summary{display:block;color:#596561;font-size:13px;margin-top:2px}
      .score{white-space:nowrap;text-align:right;font-size:13px;color:#53615c}
      .score b{display:block;color:#202323;font-size:20px;line-height:1.1}
      details{margin-top:9px}
      summary{cursor:pointer;color:#315c51;font-size:13px;font-weight:600}
      .settings{margin:8px 0 0;padding-left:19px;color:#46524e;font-size:13px}
      .settings li+li{margin-top:4px}
      .conversation{margin-top:24px}
      .bubble{padding:13px 15px;border-radius:12px;max-width:94%}
      .speaker{display:block;margin-bottom:4px;color:#53615c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
      .user{background:#f0f2f1}
      .agent{margin:10px 0 0 auto;background:#edf5f1;border:1px solid #d8e7df}
      .metrics{margin-top:24px}
      .metrics-heading{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px}
      .total{white-space:nowrap;font-weight:700}
      .total b{font-size:22px}
      .metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .metric{border:1px solid #e0e6e3;border-radius:12px;padding:13px;min-width:0}
      .metric-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
      .metric h3{margin:0}
      .metric-score{font-size:20px;font-weight:750;white-space:nowrap}
      .metric p{margin-top:7px;color:#596561;font-size:13px}
      .method{margin-top:16px;padding-top:12px;border-top:1px solid #e7ebe9}
      .method p{margin-top:7px;color:#596561;font-size:13px}
      .caption{margin-top:18px;color:#68736f;font-size:12px;text-align:center}
      .caption a{color:inherit}
      @media(max-width:620px){.top{display:block}.badge{display:inline-block;margin-top:10px}.options{grid-template-columns:1fr}.metric-grid{grid-template-columns:1fr}.metric{display:grid;grid-template-columns:1fr auto;align-items:start;gap:0 10px}.metric p{grid-column:1/-1}.metrics-heading{align-items:flex-start}.bubble{max-width:100%}}
      @media(prefers-reduced-motion:reduce){.option{transition:none}}
      button,input{font:inherit}
      :focus-visible{outline:3px solid #297666;outline-offset:3px}
    `;

    var options = fixture.configurations.map(function (configuration, index) {
      var selected = index === 0;
      return `<div class="option${selected ? " selected" : ""}" data-option="${escapeHtml(configuration.id)}">
        <label class="choice">
          <input type="radio" name="agent-configuration" value="${escapeHtml(configuration.id)}"${selected ? " checked" : ""}>
          <span><span class="choice-name">${escapeHtml(configuration.name)}</span><span class="choice-summary">${escapeHtml(configuration.summary)}</span></span>
          <span class="score">Total<b>${configuration.overall}/100</b></span>
        </label>
        <details><summary>Show configuration</summary><ul class="settings">${configuration.settings.map(function (setting) { return `<li>${escapeHtml(setting)}</li>`; }).join("")}</ul></details>
      </div>`;
    }).join("");

    shadow.innerHTML = `<style>${styles}</style>
      <main class="app">
        <header class="top">
          <div><h2>One query. Five agent setups.</h2><p class="intro">Compare their answers and see where each one succeeds or fails.</p></div>
          <span class="badge">Synthetic example</span>
        </header>
        <section class="query" aria-label="Test query"><strong>Shopper asks</strong><p>${escapeHtml(fixture.query)}</p></section>
        <fieldset>
          <legend>Choose an agent setup</legend>
          <p class="note">Each total is the average of the three scores below, rounded to a whole number.</p>
          <div class="options">${options}</div>
        </fieldset>
        <section class="conversation" aria-labelledby="conversation-heading">
          <h3 id="conversation-heading">Sample conversation</h3>
          <div class="bubble user"><span class="speaker">You</span>${escapeHtml(fixture.query)}</div>
          <div class="bubble agent"><span class="speaker">Agent</span><p id="answer"></p></div>
        </section>
        <section class="metrics" aria-labelledby="metrics-heading">
          <div class="metrics-heading"><h3 id="metrics-heading">How this answer scored</h3><span class="total">Total <b id="total"></b>/100</span></div>
          <div class="metric-grid" id="metric-grid"></div>
        </section>
        <details class="method"><summary>What do these scores mean?</summary>
          <p>Relevance: did it answer the request? Faithfulness: did it stick to the catalog facts? Tone: was it clear and appropriate? Each category is scored from 0 to 100. The total is their simple average, so it can hide a weak category.</p>
          <p>Product facts used: ${fixture.productFacts.map(escapeHtml).join(" ")}</p>
          <p>All configurations, answers, and scores are fictional teaching examples. They are not measured Agent Studio results.</p>
        </details>
        <div class="caption">Interactive demo by <a href="https://authorscollective.org" target="_blank" rel="noopener">Authors Collective</a> and <a href="https://fieldday.dev" target="_blank" rel="noopener">Field Day Labs</a>.</div>
      </main>`;

    function showConfiguration(id) {
      var configuration = fixture.configurations.find(function (item) { return item.id === id; });
      if (!configuration) return;
      shadow.querySelectorAll(".option").forEach(function (option) {
        option.classList.toggle("selected", option.dataset.option === id);
      });
      shadow.querySelector("#answer").textContent = configuration.answer;
      shadow.querySelector("#total").textContent = configuration.overall;
      shadow.querySelector("#metric-grid").innerHTML = metricNames.map(function (name) {
        return `<article class="metric"><div class="metric-top"><h3>${escapeHtml(name)}</h3><span class="metric-score">${configuration.scores[name]}/100</span></div><p>${escapeHtml(configuration.reasons[name])}</p></article>`;
      }).join("");
    }

    shadow.querySelectorAll('input[name="agent-configuration"]').forEach(function (input) {
      input.addEventListener("change", function () { showConfiguration(input.value); });
    });
    showConfiguration(fixture.configurations[0].id);
  }

  var ownScript = document.currentScript;
  function start() {
    var warningKey = "__acAppletMissing_would-you-ship";
    function scan() {
      var nodes = [].slice.call(document.querySelectorAll('[data-ac-applet="would-you-ship"]'));
      if (!nodes.length && ownScript && ownScript.dataset.target) {
        var anchor = document.querySelector(ownScript.dataset.target);
        if (anchor) {
          var node = document.createElement("div");
          node.dataset.acApplet = "would-you-ship";
          anchor.parentNode.insertBefore(node, anchor.nextSibling);
          nodes = [node];
        }
      }
      nodes.forEach(mount);
      if (!nodes.length && !window[warningKey]) {
        window[warningKey] = true;
        console.warn('Would-you-ship applet: add [data-ac-applet="would-you-ship"] or a data-target anchor.');
      }
      return nodes.length > 0;
    }
    if (scan()) return;
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () { if (scan()) observer.disconnect(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { observer.disconnect(); }, 15000);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
