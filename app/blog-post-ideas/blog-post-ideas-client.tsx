"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  idea: string;
  sme: string;
  ideaCreator: string;
  smeContactInfo: string;
  questionsToAsk: string;
  status: string;
  topicKeyword: string;
  targetPublishDate: string;
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
  return { id: `new-${crypto.randomUUID()}`, idea: "", sme: "", ideaCreator: name, smeContactInfo: "", questionsToAsk: "", status: "New", topicKeyword: "", targetPublishDate: "", isNew: true };
}

function rowValues(row: Row) {
  return { idea: row.idea, sme: row.sme, smeContactInfo: row.smeContactInfo, questionsToAsk: row.questionsToAsk, status: row.status, topicKeyword: row.topicKeyword, targetPublishDate: row.targetPublishDate };
}

export default function BlogPostIdeasClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [savedRows, setSavedRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    setError("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas");
      if (response.status === 401) {
        setSession(null);
        setRows([]);
        setSavedRows([]);
        return;
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not load the spreadsheet.");
      const items = Array.isArray(body.rows) ? body.rows as Row[] : [];
      setRows(items);
      setSavedRows(items);
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
    return rows.filter((row) => [row.idea, row.sme, row.ideaCreator, row.topicKeyword].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [filter, rows]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
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
    await fetch("/api/blog-post-ideas/session", { method: "DELETE" }).catch(() => undefined);
    setSession(null);
    setRows([]);
    setSavedRows([]);
    setNotice("");
    setError("");
  }

  function updateRow(id: string, field: keyof Row, value: string) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  function cancelRow(row: Row) {
    if (row.isNew) {
      setRows((current) => current.filter((item) => item.id !== row.id));
      return;
    }
    const original = savedRows.find((item) => item.id === row.id);
    if (original) setRows((current) => current.map((item) => item.id === row.id ? original : item));
  }

  function rowIsDirty(row: Row) {
    if (row.isNew) return true;
    const original = savedRows.find((item) => item.id === row.id);
    return Boolean(original && JSON.stringify(rowValues(row)) !== JSON.stringify(rowValues(original)));
  }

  async function saveRow(row: Row) {
    setSavingId(row.id);
    setError("");
    setNotice("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas", {
        method: row.isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(row.isNew ? {} : { id: row.id }), ...rowValues(row) }),
      });
      if (response.status === 401) {
        setSession(null);
        throw new Error("Your session expired. Sign in again.");
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not save this row.");
      await loadRows();
      setNotice(row.isNew ? "Idea added." : "Changes saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this row.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(row: Row) {
    if (row.isNew) {
      cancelRow(row);
      return;
    }
    if (!window.confirm(`Move “${row.idea || "this idea"}” to Notion trash?`)) return;
    setSavingId(row.id);
    setError("");
    setNotice("");
    try {
      const { response, body } = await jsonRequest("/api/blog-post-ideas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
      if (response.status === 401) {
        setSession(null);
        throw new Error("Your session expired. Sign in again.");
      }
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not delete this row.");
      await loadRows();
      setNotice("Idea moved to Notion trash.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this row.");
    } finally {
      setSavingId(null);
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
        <div className="ideas-toolbar-note"><span className="ideas-live-dot" aria-hidden="true" />Changes are shared with the team</div>
        <label className="ideas-search"><span className="sr-only">Filter ideas</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find an idea or SME" /></label>
        <button type="button" className="ideas-primary-button ideas-add-button" onClick={() => { setError(""); setNotice(""); setRows((current) => [blankRow(session.name), ...current]); }}>＋ Add idea</button>
      </div>

      {error && <p className="ideas-error ideas-banner" role="alert">{error}</p>}
      {notice && <p className="ideas-notice ideas-banner" role="status">{notice}</p>}

      <div className="ideas-sheet-wrap" role="region" aria-label="Editable blog post ideas spreadsheet" tabIndex={0}>
        <table className="ideas-sheet">
          <thead><tr>
            <th scope="col" className="idea-column">Idea</th>
            <th scope="col">SME</th>
            <th scope="col">Idea Creator</th>
            <th scope="col">SME Contact Info</th>
            <th scope="col" className="questions-column">Questions to Ask</th>
            <th scope="col">Status</th>
            <th scope="col">Topic / Keyword</th>
            <th scope="col">Target Publish Date</th>
            <th scope="col" className="actions-column"><span className="sr-only">Row actions</span></th>
          </tr></thead>
          <tbody>
            {visibleRows.map((row) => {
              const busy = savingId === row.id;
              const dirty = rowIsDirty(row);
              return <tr key={row.id} className={row.isNew ? "ideas-new-row" : undefined}>
                <td><input aria-label={`Idea${row.idea ? `: ${row.idea}` : ""}`} className="ideas-cell-input idea-input" value={row.idea} maxLength={500} placeholder="A clear, specific idea" onChange={(event) => updateRow(row.id, "idea", event.target.value)} /></td>
                <td><input aria-label={`SME for ${row.idea || "new idea"}`} className="ideas-cell-input" value={row.sme} maxLength={200} placeholder="Name" onChange={(event) => updateRow(row.id, "sme", event.target.value)} /></td>
                <td><input aria-label={`Idea Creator for ${row.idea || "new idea"}`} className="ideas-cell-input creator-input" value={row.isNew ? session.name : row.ideaCreator} readOnly /></td>
                <td><input aria-label={`SME Contact Info for ${row.idea || "new idea"}`} className="ideas-cell-input" value={row.smeContactInfo} maxLength={500} placeholder="Email or contact" onChange={(event) => updateRow(row.id, "smeContactInfo", event.target.value)} /></td>
                <td><textarea aria-label={`Questions to Ask for ${row.idea || "new idea"}`} className="ideas-cell-input ideas-cell-textarea" value={row.questionsToAsk} maxLength={2_000} placeholder="What should we ask?" rows={2} onChange={(event) => updateRow(row.id, "questionsToAsk", event.target.value)} /></td>
                <td><select aria-label={`Status for ${row.idea || "new idea"}`} className="ideas-cell-input status-input" value={row.status} onChange={(event) => updateRow(row.id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                <td><input aria-label={`Topic or keyword for ${row.idea || "new idea"}`} className="ideas-cell-input" value={row.topicKeyword} maxLength={300} placeholder="Optional" onChange={(event) => updateRow(row.id, "topicKeyword", event.target.value)} /></td>
                <td><input aria-label={`Target Publish Date for ${row.idea || "new idea"}`} className="ideas-cell-input date-input" type="date" value={row.targetPublishDate} onChange={(event) => updateRow(row.id, "targetPublishDate", event.target.value)} /></td>
                <td className="ideas-row-actions">
                  {dirty && <button type="button" className="ideas-save-button" onClick={() => void saveRow(row)} disabled={busy || !row.idea.trim()}>{busy ? "Saving…" : "Save"}</button>}
                  {dirty && <button type="button" className="ideas-text-button" onClick={() => cancelRow(row)} disabled={busy}>Cancel</button>}
                  {!dirty && !row.isNew && <button type="button" className="ideas-delete-button" onClick={() => void deleteRow(row)} disabled={busy}>{busy ? "Working…" : "Delete"}</button>}
                  {row.isNew && <button type="button" className="ideas-delete-button" onClick={() => void deleteRow(row)} disabled={busy}>Remove</button>}
                </td>
              </tr>;
            })}
            {!loadingRows && visibleRows.length === 0 && <tr><td colSpan={9} className="ideas-empty">{filter ? "No ideas match that filter." : "No ideas yet. Add the first one to start the list."}</td></tr>}
            {loadingRows && <tr><td colSpan={9} className="ideas-empty">Refreshing shared ideas…</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="ideas-footer"><span>{rows.length} {rows.length === 1 ? "idea" : "ideas"}</span><span>Each row saves directly to the shared Notion database.</span></footer>
    </section>
  </main>;
}
