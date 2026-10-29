"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  idea: string;
  sme: string;
  ideaCreator: string;
  smeContactInfo: string;
  questionsToAsk: string;
  status: string;
  isNew?: boolean;
};

type Session = { name: string };
const STATUSES = ["New", "Exploring", "Ready", "In Progress", "Published"];
const NOTION_URL = "https://app.notion.com/p/03397c6f541b4ca69471b93bb963573f";

async function jsonRequest(url: string, init?: RequestInit): Promise<{ response: Response; body: Record<string, unknown> }> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json().catch(() => ({}));
  return { response, body: payload && typeof payload === "object" ? payload as Record<string, unknown> : {} };
}

function blankRow(name: string): Row {
  return { id: `new-${crypto.randomUUID()}`, idea: "", sme: "", ideaCreator: name, smeContactInfo: "", questionsToAsk: "", status: "New", isNew: true };
}

function rowValues(row: Row) {
  return { idea: row.idea, sme: row.sme, smeContactInfo: row.smeContactInfo, questionsToAsk: row.questionsToAsk, status: row.status };
}

export default function BlogPostIdeasClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("");
  const rowsRef = useRef<Row[]>([]);
  const savedRowsRef = useRef<Row[]>([]);
  const savingRef = useRef(new Set<string>());
  const debounceTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRowRef = useRef<(row: Row) => void>(() => undefined);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    setError("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas");
      if (response.status === 401) {
        setSession(null);
        rowsRef.current = [];
        savedRowsRef.current = [];
        setRows([]);
        return;
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not load the spreadsheet.");
      const items = Array.isArray(body.rows) ? body.rows as Row[] : [];
      rowsRef.current = items;
      savedRowsRef.current = items;
      setRows(items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the spreadsheet.");
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    jsonRequest("/api/blog-post-ideas/session").then(({ response, body }) => {
      if (!active) return;
      if (response.ok && body.authenticated === true && typeof body.name === "string") {
        setSession({ name: body.name });
        void loadRows();
      } else if (response.status === 503) {
        setError(typeof body.error === "string" ? body.error : "The spreadsheet is not configured yet.");
      }
    }).catch(() => {
      if (active) setError("Could not check your session.");
    }).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [loadRows]);

  const visibleRows = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [row.idea, row.sme, row.ideaCreator].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [filter, rows]);

  function clearAutoSave(id: string) {
    const timer = debounceTimers.current.get(id);
    if (timer) clearTimeout(timer);
    debounceTimers.current.delete(id);
  }

  function scheduleAutoSave(id: string) {
    clearAutoSave(id);
    const timer = setTimeout(() => {
      debounceTimers.current.delete(id);
      const row = rowsRef.current.find((item) => item.id === id);
      if (row?.idea.trim()) saveRowRef.current(row);
    }, 5_000);
    debounceTimers.current.set(id, timer);
  }

  function showSavedToast(message = "Saved") {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2_400);
  }

  useEffect(() => () => {
    for (const timer of debounceTimers.current.values()) clearTimeout(timer);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setToast("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, password }) });
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not sign in.");
      const nextSession = { name: typeof body.name === "string" ? body.name : name.trim() };
      setSession(nextSession);
      setName("");
      setPassword("");
      await loadRows();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    }
  }

  async function signOut() {
    for (const id of debounceTimers.current.keys()) clearAutoSave(id);
    rowsRef.current = [];
    savedRowsRef.current = [];
    await fetch("/api/blog-post-ideas/session", { method: "DELETE" }).catch(() => undefined);
    setSession(null);
    setRows([]);
    setToast("");
    setError("");
  }

  function updateRow(id: string, field: keyof Row, value: string) {
    const next = rowsRef.current.map((row) => row.id === id ? { ...row, [field]: value } : row);
    rowsRef.current = next;
    setRows(next);
    setError("");
    setToast("");
    scheduleAutoSave(id);
  }

  function rowIsDirty(row: Row) {
    if (row.isNew) return true;
    const original = savedRowsRef.current.find((item) => item.id === row.id);
    return Boolean(original && JSON.stringify(rowValues(row)) !== JSON.stringify(rowValues(original)));
  }

  async function saveRow(row: Row) {
    if (!row.idea.trim() || savingRef.current.has(row.id)) return;
    const requestId = row.id;
    const submittedValues = JSON.stringify(rowValues(row));
    const wasNew = Boolean(row.isNew);
    savingRef.current.add(requestId);
    setSavingIds((current) => new Set(current).add(requestId));
    setError("");
    let savedSuccessfully = false;
    let persistedId = requestId;
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas", {
        method: wasNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(!wasNew ? { id: row.id } : {}), ...rowValues(row) }),
      });
      if (response.status === 401) {
        setSession(null);
        throw new Error("Your session expired. Sign in again.");
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not save this row.");
      const persisted = body.row as Row | undefined;
      if (!persisted || typeof persisted.id !== "string") throw new Error("The saved row could not be confirmed.");
      persistedId = persisted.id;
      const current = rowsRef.current.find((item) => item.id === requestId);
      const changedDuringSave = Boolean(current && JSON.stringify(rowValues(current)) !== submittedValues);
      const saved = { ...persisted, isNew: undefined };
      const nextRows = rowsRef.current.map((item) => item.id === requestId
        ? changedDuringSave && current
          ? { ...current, id: persisted.id, ideaCreator: persisted.ideaCreator, isNew: false }
          : saved
        : item);
      rowsRef.current = nextRows;
      setRows(nextRows);
      const nextSavedRows = savedRowsRef.current.some((item) => item.id === persisted.id)
        ? savedRowsRef.current.map((item) => item.id === persisted.id ? saved : item)
        : [saved, ...savedRowsRef.current];
      savedRowsRef.current = nextSavedRows;
      savedSuccessfully = true;
      showSavedToast();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this row.");
    } finally {
      savingRef.current.delete(requestId);
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(requestId);
        return next;
      });
      if (savedSuccessfully) {
        const current = rowsRef.current.find((item) => item.id === persistedId);
        const original = savedRowsRef.current.find((item) => item.id === persistedId);
        if (current && original && JSON.stringify(rowValues(current)) !== JSON.stringify(rowValues(original))) {
          if (requestId !== persistedId) clearAutoSave(requestId);
          if (!debounceTimers.current.has(persistedId)) scheduleAutoSave(persistedId);
        }
      }
    }
  }

  saveRowRef.current = (row) => { void saveRow(row); };

  async function deleteRow(row: Row) {
    clearAutoSave(row.id);
    if (row.isNew) {
      const nextRows = rowsRef.current.filter((item) => item.id !== row.id);
      rowsRef.current = nextRows;
      setRows(nextRows);
      return;
    }
    if (savingRef.current.has(row.id)) return;
    if (!window.confirm(`Move “${row.idea || "this idea"}” to Notion trash?`)) return;
    savingRef.current.add(row.id);
    setSavingIds((current) => new Set(current).add(row.id));
    setError("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
      if (response.status === 401) {
        setSession(null);
        throw new Error("Your session expired. Sign in again.");
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not delete this row.");
      const nextRows = rowsRef.current.filter((item) => item.id !== row.id);
      const nextSavedRows = savedRowsRef.current.filter((item) => item.id !== row.id);
      rowsRef.current = nextRows;
      savedRowsRef.current = nextSavedRows;
      setRows(nextRows);
      showSavedToast("Deleted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this row.");
    } finally {
      savingRef.current.delete(row.id);
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  }

  if (checkingSession) return <main className="ideas-page"><div className="ideas-loading" role="status">Opening the spreadsheet…</div></main>;

  if (!session) return <main className="ideas-page ideas-gate">
    <header className="ideas-brand"><span className="ideas-mark" aria-hidden="true">AC</span><span>Authors Collective</span></header>
    <section className="ideas-login-card" aria-labelledby="ideas-login-title">
      <p className="ideas-eyebrow">COLLECTIVE WORKSPACE</p>
      <h1 id="ideas-login-title">Blog post ideas</h1>
      <p className="ideas-intro">Sign in with the shared workspace password. Enter your name so new ideas show who added them.</p>
      <form className="ideas-login-form" onSubmit={signIn}>
        <label htmlFor="ideas-name">Your name</label>
        <input id="ideas-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
        <label htmlFor="ideas-password">Workspace password</label>
        <input id="ideas-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="ideas-error" role="alert">{error}</p>}
        <button className="ideas-primary-button" type="submit">Open spreadsheet</button>
      </form>
      <p className="ideas-login-footnote">Your name is saved with ideas you create. The team can edit every row.</p>
    </section>
  </main>;

  return <main className="ideas-page">
    <header className="ideas-topbar">
      <Link className="ideas-brand" href="/" aria-label="Authors Collective home"><span className="ideas-mark" aria-hidden="true">AC</span><span>Authors Collective</span></Link>
      <div className="ideas-user"><span>Signed in as <strong>{session.name}</strong></span><button type="button" className="ideas-text-button" onClick={signOut}>Sign out</button></div>
    </header>
    <section className="ideas-content">
      <div className="ideas-heading-row">
        <div>
          <p className="ideas-eyebrow">CONTENT PLANNING</p>
          <h1>Blog Post Ideas</h1>
          <p className="ideas-intro">Collect ideas, find the right subject matter expert, and plan the next conversation.</p>
        </div>
        <a className="ideas-notion-link" href={NOTION_URL} target="_blank" rel="noreferrer">Open in Notion <span aria-hidden="true">↗</span></a>
      </div>

      <div className="ideas-toolbar">
        <div className="ideas-toolbar-note"><span className="ideas-live-dot" aria-hidden="true" />Changes save after 5 seconds of inactivity</div>
        <label className="ideas-search"><span className="sr-only">Filter ideas</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find an idea or SME" /></label>
        <button type="button" className="ideas-primary-button ideas-add-button" onClick={() => { setError(""); setToast(""); const nextRows = [blankRow(session.name), ...rowsRef.current]; rowsRef.current = nextRows; setRows(nextRows); }}>＋ Add idea</button>
      </div>

      {error && <p className="ideas-error ideas-banner" role="alert">{error}</p>}

      <div className="ideas-sheet-wrap" role="region" aria-label="Editable blog post ideas spreadsheet" tabIndex={0}>
        <table className="ideas-sheet">
          <thead><tr>
            <th scope="col" className="idea-column">Idea</th>
            <th scope="col">SME</th>
            <th scope="col">Idea Creator</th>
            <th scope="col">SME Contact Info</th>
            <th scope="col" className="questions-column">Questions to Ask</th>
            <th scope="col">Status</th>
            <th scope="col" className="actions-column"><span className="sr-only">Row actions</span></th>
          </tr></thead>
          <tbody>
            {visibleRows.map((row) => {
              const busy = savingIds.has(row.id);
              const dirty = rowIsDirty(row);
              return <tr key={row.id} className={row.isNew ? "ideas-new-row" : undefined}>
                <td><input aria-label={`Idea${row.idea ? `: ${row.idea}` : ""}`} className="ideas-cell-input idea-input" value={row.idea} maxLength={500} placeholder="A clear, specific idea" onChange={(event) => updateRow(row.id, "idea", event.target.value)} /></td>
                <td><input aria-label={`SME for ${row.idea || "new idea"}`} className="ideas-cell-input" value={row.sme} maxLength={200} placeholder="Name" onChange={(event) => updateRow(row.id, "sme", event.target.value)} /></td>
                <td><input aria-label={`Idea Creator for ${row.idea || "new idea"}`} className="ideas-cell-input creator-input" value={row.isNew ? session.name : row.ideaCreator} readOnly /></td>
                <td><input aria-label={`SME Contact Info for ${row.idea || "new idea"}`} className="ideas-cell-input" value={row.smeContactInfo} maxLength={500} placeholder="Email or contact" onChange={(event) => updateRow(row.id, "smeContactInfo", event.target.value)} /></td>
                <td><textarea aria-label={`Questions to Ask for ${row.idea || "new idea"}`} className="ideas-cell-input ideas-cell-textarea" value={row.questionsToAsk} maxLength={2_000} placeholder="What should we ask?" rows={2} onChange={(event) => updateRow(row.id, "questionsToAsk", event.target.value)} /></td>
                <td><select aria-label={`Status for ${row.idea || "new idea"}`} className="ideas-cell-input status-input" value={row.status} onChange={(event) => updateRow(row.id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                <td className="ideas-row-actions">
                  {busy && <span className="ideas-row-state">Saving…</span>}
                  {!busy && dirty && <span className="ideas-row-state">{row.idea.trim() ? "Auto-saves in 5 seconds" : "Add an idea to save"}</span>}
                  <button type="button" className="ideas-delete-button" onClick={() => void deleteRow(row)} disabled={busy}>{row.isNew ? "Remove" : "Delete"}</button>
                </td>
              </tr>;
            })}
            {!loadingRows && visibleRows.length === 0 && <tr><td colSpan={7} className="ideas-empty">{filter ? "No ideas match that filter." : "No ideas yet. Add the first one to start the list."}</td></tr>}
            {loadingRows && <tr><td colSpan={7} className="ideas-empty">Loading shared ideas…</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="ideas-footer"><span>{rows.length} {rows.length === 1 ? "idea" : "ideas"}</span><span>Changes save directly to Notion after 5 seconds without typing.</span></footer>
    </section>
    {toast && <div className="ideas-saved-toast" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true">✓</span>{toast}</div>}
  </main>;
}
