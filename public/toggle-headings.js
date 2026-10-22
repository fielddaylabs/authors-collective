(() => {
  "use strict";

  const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
  const STYLE_ID = "authors-collective-toggle-headings-styles";

  let panelCounter = 0;

  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const getHeadingLevel = (heading) =>
    Number(heading.tagName.substring(1));

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .agent-toggle-heading {
        position: relative;
        cursor: pointer;
      }

      .agent-toggle-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        appearance: none;
        border: 0;
        padding: 0;
        margin: 0 0.45em 0 0;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: inherit;
        vertical-align: baseline;
        cursor: pointer;
      }

      .agent-toggle-button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 4px;
      }

      .agent-toggle-icon {
        display: inline-block;
        width: 0;
        height: 0;
        border-top: 0.38em solid transparent;
        border-bottom: 0.38em solid transparent;
        border-left: 0.55em solid currentColor;
        transition: transform 0.2s ease;
        pointer-events: auto;
      }

      .agent-toggle-heading[data-expanded="true"] .agent-toggle-icon {
        transform: rotate(90deg);
      }

      .agent-toggle-panel {
        max-height: 0;
        opacity: 0;
        overflow: visible;
        clip-path: inset(0 -100vmax 100% -100vmax);
        -webkit-clip-path: inset(0 -100vmax 100% -100vmax);
        transition:
          max-height 0.3s ease,
          opacity 0.2s ease,
          clip-path 0.3s ease,
          -webkit-clip-path 0.3s ease;
      }

      .agent-toggle-panel[data-expanded="true"] {
        clip-path: inset(0 -100vmax 0 -100vmax);
        -webkit-clip-path: inset(0 -100vmax 0 -100vmax);
      }

      @media (prefers-reduced-motion: reduce) {
        .agent-toggle-icon,
        .agent-toggle-panel {
          transition: none;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function initializeHeading(heading) {
    if (heading.dataset.toggleInitialized === "true") {
      return false;
    }

    const headingLevel = getHeadingLevel(heading);
    const contentNodes = [];

    let sibling = heading.nextElementSibling;

    while (sibling) {
      const isHeading = /^H[1-6]$/.test(sibling.tagName);

      if (isHeading) {
        const siblingLevel = getHeadingLevel(sibling);

        if (siblingLevel <= headingLevel) {
          break;
        }
      }

      contentNodes.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    if (contentNodes.length === 0) {
      return false;
    }

    const panel = document.createElement("div");
    panel.className = "agent-toggle-panel";
    panel.id = `agent-toggle-panel-${++panelCounter}`;
    panel.hidden = true;

    contentNodes.forEach((node) => {
      panel.appendChild(node);
    });

    const headingLabel = heading.textContent.trim();

    const button = document.createElement("button");
    button.type = "button";
    button.className = "agent-toggle-button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-label", `Toggle section: ${headingLabel}`);

    const icon = document.createElement("span");
    icon.className = "agent-toggle-icon";
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);

    heading.dataset.toggleInitialized = "true";
    heading.dataset.expanded = "false";
    heading.classList.add("agent-toggle-heading");

    heading.prepend(button);
    heading.after(panel);

    const state = {
      expanded: false,
      animationToken: 0,
      closeTimer: null,
    };

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        if (state.expanded) {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });

      resizeObserver.observe(panel);
    }

    function setExpanded(expanded) {
      state.expanded = expanded;
      state.animationToken += 1;

      const animationToken = state.animationToken;

      if (state.closeTimer) {
        clearTimeout(state.closeTimer);
        state.closeTimer = null;
      }

      heading.dataset.expanded = String(expanded);
      panel.dataset.expanded = String(expanded);
      button.setAttribute("aria-expanded", String(expanded));

      if (expanded) {
        panel.hidden = false;
        panel.style.opacity = "0";
        panel.style.maxHeight = "0px";
        panel.style.clipPath = "inset(0 -100vmax 100% -100vmax)";
        panel.style.webkitClipPath = "inset(0 -100vmax 100% -100vmax)";

        requestAnimationFrame(() => {
          if (animationToken !== state.animationToken) return;

          panel.style.opacity = "1";
          panel.style.maxHeight = `${panel.scrollHeight}px`;
          panel.style.clipPath = "inset(0 -100vmax 0 -100vmax)";
          panel.style.webkitClipPath = "inset(0 -100vmax 0 -100vmax)";
        });

        return;
      }

      panel.hidden = false;
      panel.style.opacity = "1";
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      panel.style.clipPath = "inset(0 -100vmax 0 -100vmax)";
      panel.style.webkitClipPath = "inset(0 -100vmax 0 -100vmax)";

      requestAnimationFrame(() => {
        if (animationToken !== state.animationToken) return;

        panel.style.opacity = "0";
        panel.style.maxHeight = "0px";
        panel.style.clipPath = "inset(0 -100vmax 100% -100vmax)";
        panel.style.webkitClipPath = "inset(0 -100vmax 100% -100vmax)";
      });

      const finishClosing = () => {
        if (animationToken !== state.animationToken) return;

        panel.hidden = true;
        state.closeTimer = null;
      };

      const handleTransitionEnd = (event) => {
        if (event.propertyName !== "max-height") return;

        panel.removeEventListener("transitionend", handleTransitionEnd);
        finishClosing();
      };

      panel.addEventListener("transitionend", handleTransitionEnd);

      state.closeTimer = setTimeout(() => {
        panel.removeEventListener("transitionend", handleTransitionEnd);
        finishClosing();
      }, 350);
    }

    button.addEventListener("click", () => {
      setExpanded(!state.expanded);
    });

    heading.addEventListener("click", (event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest("button, a, input, textarea, select, summary, [role=\"button\"]")
      ) {
        return;
      }

      setExpanded(!state.expanded);
    });

    return true;
  }

  function applyToggleHeadings(names) {
    addStyles();

    const requestedNames = names
      .flatMap((name) => (Array.isArray(name) ? name : [name]))
      .filter((name) => typeof name === "string")
      .map(normalize);

    const requested = new Set(requestedNames);

    const headings = Array.from(
      document.querySelectorAll(HEADING_SELECTOR)
    );

    const matches = headings.filter((heading) =>
      requested.has(normalize(heading.textContent))
    );

    let initializedCount = 0;

    matches.forEach((heading) => {
      if (initializeHeading(heading)) {
        initializedCount += 1;
      }
    });

    console.info(
      `[toggleHeadings] matched ${matches.length}/${requestedNames.length}; initialized ${initializedCount}`
    );

    return initializedCount;
  }

  window.toggleHeadings = (...names) => {
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => applyToggleHeadings(names),
        { once: true }
      );

      return null;
    }

    return applyToggleHeadings(names);
  };
})();
