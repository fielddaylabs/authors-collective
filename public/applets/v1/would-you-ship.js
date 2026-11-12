/**
 * SPEC: Would you ship this change? Interactive implementation follows.
 * Full fixture/spec: https://app.notion.com/p/416a1fe615528186b8bcd11122efe4c7
 * Placement: after What if the score gets worse?, before the automation section.
 *
 * BUILD: Fictional evaluation explorer comparing baseline/candidate agent answers.
 * Three scenarios: Clear improvement, Mixed results, Inconclusive. Default Mixed,
 * Faithfulness selected, passing threshold 70, all cases, a1 inspector open.
 * Always show Relevance, Faithfulness, Tone comparison cards: means, changes,
 * pass counts/denominators/rates. Do not invent a combined quality score.
 *
 * DATA: Implement the full spec's five jacket-question templates, six variants
 * each (IDs a1-e6), explicit source facts, answers, scores, judge rationales, and
 * deterministic score offsets. Clear/Mixed use 30 paired cases; Inconclusive uses
 * the specified 8 paired cases and differences. Expand all records offline.
 * Facts: Trail Shell 240g, water-resistant, no waterproof/breathability rating;
 * Storm Shell 310g, waterproof 10,000mm, taped seams; Alpine Parka 950g, insulated,
 * water-resistant, not waterproof-rated. Expected tone is neutral and helpful.
 * Clear fixes grounding/relevance/tone; Mixed improves faithfulness but worsens
 * tone and retains relevance defects; Inconclusive has noisy zero mean change.
 * Scores/judgments are fictional, not measured Agent Studio results. Rationale
 * must match the displayed answer and retrieved evidence. No live agent/judge.
 *
 * OFFLINE: Serialize means and 95% paired bootstrap intervals of mean differences
 * (10,000 resamples, seeded documented PRNG seed 42, percentile bounds). Provide
 * generator and methodology. Do not claim this reproduces Agent Studio statistics;
 * n=30 is not a guarantee. Inconclusive's interval must include zero.
 *
 * CONTROLS: Metric selector changes case sorting/detail, not visible metric cards.
 * Threshold 0-100 integer slider recomputes only pass counts/status (score>=threshold),
 * never means, scores, or intervals. Failures-only filters candidate scores below
 * threshold for selected metric. Sort failures first, candidate score ascending,
 * then ID. Show empty/count states. Rows expand inline evidence/answer/judgment
 * inspector with all metrics; don't close it when threshold changes.
 * Scenario changes preserve metric/threshold, reset decision and expanded case.
 * Reset restores initial state. Display paired-case count and limited-evidence note.
 *
 * DECISION: Keep candidate for review / Revise candidate / Gather more evidence
 * reveals scenario-specific feedback. Consider all metrics and factual defects;
 * even threshold zero cannot imply approval. No deployment action or celebration.
 * Explain grounding versus truth, judge fallibility, averages hiding failures,
 * and sample uncertainty. Include collapsible fixture/methodology explanation.
 *
 * EMBED: Serve authorscollective.org/applets/v1/would-you-ship.js as bundled classic
 * JS. On DOM readiness mount [data-ac-applet="would-you-ship"], or insert after an
 * explicit script data-target anchor; never guess placement from headings.
 * Support late mounts with a bounded 15-second observer and repeated script tags
 * idempotently; multiple instances retain independent state. Shadow DOM styles,
 * bundled data, no runtime API/model calls, tracking, storage, or host CSS changes.
 * Keep static fallback until initialization; missing targets warn once. Responsive
 * to 320px; semantic controls, keyboard/focus, reduced motion, non-color statuses.
 * Permanent caption: Interactive demo by Authors Collective and Field Day Labs.
 * Link names to https://authorscollective.org and https://fieldday.dev.
 *
 * DONE: Deliver source, expanded fixtures, generator, README, integration preview,
 * and bundle. Verify score/answer consistency, paired IDs, n=30/30/8, deterministic
 * statistics, >= threshold edge cases, immutable means/intervals, filter/sort/reset,
 * preserved focus, mobile/keyboard, and duplicate/delayed/two-instance mounting.
 */
/*
 * FIXTURE EDITING NOTES
 * The fictional product facts, case templates, and answer text live in `t` below.
 * `off` is the six-case deterministic variation applied to each template's score
 * tuple. `bs`, `cs`, and `ms` are the baseline, Clear, and Mixed score tuples in
 * [relevance, faithfulness, tone] order. `data()` expands these into visible case
 * rows; Inconclusive keeps a1–a3, b1–b3, c1–c2 and applies the signed faithfulness
 * differences in its local `dif` array. Replace the source tuples and answer text
 * together so displayed rationales remain consistent. Scores and answers are
 * synthetic teaching fixtures, not Agent Studio measurements. The browser only
 * expands these fixed cases, computes display aggregates/threshold counts, and
 * samples the stated bootstrap interval; it never runs an agent or judge. Keep
 * case IDs paired across baseline and candidate when editing.
 */
(function(){
  "use strict";
  var KEY="ac-wys-v1", t=[
    {id:"a",q:"Lightweight waterproof jacket",b:"Trail Shell is waterproof and weighs 240g.",g:"Trail Shell is light at 240g but only water-resistant. Storm Shell is waterproof-rated and weighs 310g.",m:"Trail Shell is light at 240g but only water-resistant. Storm Shell is waterproof-rated and weighs 310g. Buy now—don't wait!",f:"Trail Shell: 240g, water-resistant, no waterproof or breathability rating. Storm Shell: 310g, waterproof to 10,000mm, taped seams."},
    {id:"b",q:"Is Trail Shell waterproof?",b:"Yes, it is fully waterproof.",g:"Its record says water-resistant; it does not give a waterproof rating.",m:"Its record says water-resistant; it does not give a waterproof rating. Buy now—don't wait!",f:"Trail Shell: 240g, water-resistant, no published waterproof rating."},
    {id:"c",q:"Waterproof jacket under 400g",b:"Alpine Parka is the best waterproof option.",g:"Storm Shell is 310g with a 10,000mm waterproof rating and taped seams.",m:"I cannot recommend a product",f:"Storm Shell: 310g, waterproof to 10,000mm, taped seams. Alpine Parka: 950g, insulated, water-resistant, not waterproof-rated."},
    {id:"d",q:"Trail Shell breathability rating",b:"Its breathability is 20,000g/m²/24h.",g:"The available record does not publish a breathability rating.",m:"The available record does not publish a breathability rating. Buy now—don't wait!",f:"Trail Shell: no published breathability rating."},
    {id:"e",q:"Compare Trail Shell and Storm Shell",b:"Buy Storm Shell now before it sells out!",g:"Trail Shell is lighter at 240g and water-resistant. Storm Shell is 310g with a 10,000mm waterproof rating and taped seams.",m:"Trail Shell is lighter at 240g and water-resistant. Storm Shell is 310g with a 10,000mm waterproof rating and taped seams. Buy now—don't wait!",f:"Trail Shell: 240g, water-resistant. Storm Shell: 310g, waterproof to 10,000mm, taped seams."}
  ];
  var off=[-4,-2,0,0,2,4], bs=[[85,45,85],[90,40,85],[40,40,85],[85,35,85],[60,85,35]],cs=[[90,92,90],[92,94,90],[92,94,90],[88,95,90],[92,94,92]],ms=[[90,92,60],[92,94,60],[45,94,60],[88,95,60],[65,94,40]], labels=["Relevance","Faithfulness","Tone"];
  function clamp(n){return Math.max(0,Math.min(100,n));}function average(a){return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0;}
  function random(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return ((x^x>>>14)>>>0)/4294967296;};}
  function interval(d){var r=random(42),s=[];for(var i=0;i<10000;i++){var z=0;for(var j=0;j<d.length;j++)z+=d[Math.floor(r()*d.length)];s.push(z/d.length);}s.sort(function(a,b){return a-b;});return [s[250],s[9749]];}
  function data(which){var ids=which==="Inconclusive"?["a1","a2","a3","b1","b2","b3","c1","c2"]:null,out=[];t.forEach(function(x,k){for(var j=0;j<6;j++){var id=x.id+(j+1);if(ids&&!ids.includes(id))continue;var base=bs[k].map(function(v){return clamp(v+off[j]);}),cand=(which==="Clear improvement"?cs[k]:ms[k]).map(function(v){return clamp(v+off[j]);}),ans=which==="Clear improvement"?x.g:which==="Mixed results"?x.m:x.g;if(ids){var dif=[25,-25,20,-20,15,-15,10,-10][ids.indexOf(id)];cand[1]=clamp(base[1]+dif);if(dif<0)ans=x.b;}out.push({id:id,k:k,q:x.q+(j?" — "+["for a wet trail","for a day hike","for spring weather","for commuting","for a weekend trip"][j%5]:""),base:base,cand:cand,ba:x.b,ca:ans,facts:x.f,tag:["Unsupported specification","Unsupported specification","Relevance and grounding","Missing information","Tone and comparison"][k]});}});return out;}
  var css=":host{all:initial;display:block;color:#202323;font:14px/1.45 system-ui,sans-serif}*{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}.app{max-width:1100px;margin:auto;padding:20px;border:1px solid #dce1df;border-radius:16px;background:white}.head{display:flex;justify-content:space-between;gap:12px;align-items:start}.head h2{margin:0;font-size:clamp(21px,3vw,29px)}.muted,.small{color:#626d69;font-size:12px}.badge{font-size:12px;border:1px solid #e3d4b7;background:#fff8ea;border-radius:30px;padding:6px 10px}.chips,.controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}.pill,.btn{border:1px solid #cad4d0;background:white;color:#25312e;border-radius:999px;padding:8px 12px}.pill[aria-pressed=true],.btn.primary{background:#173f36;color:white}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.metric,.card{border:1px solid #e0e6e3;border-radius:12px;padding:12px;min-width:0}.metric h3,.card h3{margin:0 0 9px;font-size:14px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pair strong{display:block;font-size:21px}.foot{font-size:11px;color:#66716d;margin-top:6px}.bar{height:6px;background:#edf1ee;border-radius:8px;margin-top:4px;overflow:hidden}.bar i{display:block;height:100%;background:#367b67}.split{display:grid;grid-template-columns:1fr 1.3fr;gap:10px}.cases{display:grid;gap:6px;max-height:440px;overflow:auto}.case{width:100%;text-align:left;display:grid;grid-template-columns:1fr auto;gap:3px;border:1px solid #e1e7e4;border-radius:8px;padding:8px;background:white;color:#222}.case[aria-expanded=true]{border-color:#317964;box-shadow:inset 3px 0 #317964}.case small{grid-column:1/-1}.red{color:#963b25;font-weight:700}.green{color:#246a53}.answers{display:grid;grid-template-columns:1fr 1fr;gap:8px}.answer{background:#f5f8f6;border-radius:8px;padding:9px}.answer p{margin:5px 0}.table{width:100%;border-collapse:collapse;font-size:12px}.table td,.table th{text-align:left;padding:5px;border-bottom:1px solid #e5eae7}.decision{margin-top:12px}.feedback{padding:9px;border-radius:8px;background:#f3f7f4}.about{margin-top:12px}.about summary{cursor:pointer;font-weight:700}.caption{text-align:right;font-size:12px;margin-top:12px}.caption a{color:#235c50}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #dc912f;outline-offset:2px}@media(max-width:720px){.app{padding:13px}.head{display:block}.badge{display:inline-block;margin-top:8px}.metrics,.split,.answers{grid-template-columns:1fr}.cases{max-height:none}.caption{text-align:left}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}";
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function mount(host){if(host.dataset.acMounted===KEY)return;host.dataset.acMounted=KEY;var sh=host.shadowRoot||host.attachShadow({mode:"open"}),scenario="Mixed results",metric=1,threshold=70,fail=false,expanded="a1",decision="";
    function feedback(){if(scenario==="Clear improvement")return decision==="Keep candidate for review"?"Reasonable for review after checking coverage and failures. This does not deploy anything.":decision==="Revise candidate"?"Reviewing remaining case failures is useful even when averages improve.":"Broader evidence can check whether gains extend beyond this fictional fixture.";if(scenario==="Mixed results")return "Faithfulness improves, while tone worsens and relevance defects remain. Inspect or revise those regressions.";return decision==="Gather more evidence"?"Eight paired cases provide limited evidence; gather a broader evaluation.":"The zero-mean faithfulness change and variation do not establish an improvement.";}
    function render(){var rows=data(scenario),stats=labels.map(function(_,k){var b=rows.map(function(r){return r.base[k];}),c=rows.map(function(r){return r.cand[k];}),d=rows.map(function(r){return r.cand[k]-r.base[k];}),iv=interval(d);return {b:average(b),c:average(c),d:average(d),iv:iv,bp:b.filter(function(x){return x>=threshold;}).length,cp:c.filter(function(x){return x>=threshold;}).length};}),cur=rows.find(function(r){return r.id===expanded;})||rows[0],vis=rows.filter(function(r){return !fail||r.cand[metric]<threshold;}).slice().sort(function(a,b){var af=a.cand[metric]<threshold?0:1,bf=b.cand[metric]<threshold?0:1;return af-bf||a.cand[metric]-b.cand[metric]||a.id.localeCompare(b.id);});
      var cards=stats.map(function(s,i){return '<section class="metric"><h3>'+labels[i]+'</h3><div class="pair"><div><span class="small">Baseline</span><strong>'+s.b.toFixed(1)+'</strong><span class="small">'+s.bp+'/'+rows.length+' pass</span><div class="bar"><i style="width:'+100*s.bp/rows.length+'%"></i></div></div><div><span class="small">Candidate</span><strong>'+s.c.toFixed(1)+'</strong><span class="small">'+s.cp+'/'+rows.length+' pass</span><div class="bar"><i style="width:'+100*s.cp/rows.length+'%"></i></div></div></div><div class="foot">Change '+(s.d>=0?'+':'')+s.d.toFixed(1)+' · pass rate ≥'+threshold+'</div></section>';}).join("");
      var cb=vis.map(function(r){var d=r.cand[metric]-r.base[metric];return '<button class="case" data-case="'+r.id+'" aria-expanded="'+(r.id===expanded)+'"><span>'+esc(r.id.toUpperCase())+' · '+esc(r.q)+'</span><b class="'+(d<0?'red':d>0?'green':'')+'">'+r.base[metric]+' → '+r.cand[metric]+'</b><small>'+(d>0?'Improved':d<0?'Regressed':'Unchanged')+' · '+esc(r.tag)+(r.cand[metric]<threshold?' · below threshold':'')+'</small></button>';}).join("");var table=labels.map(function(l,i){return '<tr><th>'+l+'</th><td>'+cur.base[i]+'</td><td>'+cur.cand[i]+'</td><td>'+esc(cur.tag)+'</td></tr>';}).join("");var buttons=["Clear improvement","Mixed results","Inconclusive"].map(function(s){return '<button class="pill" data-s="'+s+'" aria-pressed="'+(scenario===s)+'">'+s+'</button>';}).join("");var sel=stats[metric];
      sh.innerHTML='<style>'+css+'</style><main class="app"><div class="head"><div><h2>Would you ship this change?</h2><div class="muted">Explore fictional evaluation results. No agents are running.</div></div><span class="badge">Synthetic fixture · not Agent Studio results</span></div><nav class="chips" aria-label="Scenario">'+buttons+'</nav><div class="metrics">'+cards+'</div><div class="controls"><label>Explore a passing policy <input id="threshold" type="range" min="0" max="100" value="'+threshold+'"><output>'+threshold+'</output></label><label><input id="fail" type="checkbox" '+(fail?'checked':'')+'> Failures only</label><span class="small">Pass means score ≥ threshold. Lowering it does not improve answers.</span></div><div class="split"><section class="card"><h3>'+labels[metric]+' · paired difference</h3><p><b>95% paired bootstrap interval:</b> '+sel.iv[0].toFixed(1)+' to '+sel.iv[1].toFixed(1)+'</p><p class="small">'+rows.length+' paired cases. Interval summarizes this fictional sample only.</p>'+(scenario==="Inconclusive"?'<p class="badge">8 cases: limited evidence</p>':'')+'<h3>Cases ('+vis.length+' shown)</h3><div class="cases">'+(cb||'<p>No cases match this failure filter.</p>')+'</div></section><section class="card"><h3>Case inspector · '+esc(cur.id.toUpperCase())+'</h3><p><b>Question:</b> '+esc(cur.q)+'</p><p><b>Retrieved facts:</b> '+esc(cur.facts)+'</p><div class="answers"><div class="answer"><b>Baseline</b><p>'+esc(cur.ba)+'</p></div><div class="answer"><b>Candidate</b><p>'+esc(cur.ca)+'</p></div></div><table class="table"><thead><tr><th>Metric</th><th>Base</th><th>Candidate</th><th>Judge note</th></tr></thead><tbody>'+table+'</tbody></table><p class="small">Faithfulness checks support in retrieved facts, not whether those facts are independently true. Judge rationales can be wrong.</p></section></div><section class="decision"><b>Decision</b><div class="controls"><button class="btn" data-d="Keep candidate for review">Keep candidate for review</button><button class="btn" data-d="Revise candidate">Revise candidate</button><button class="btn" data-d="Gather more evidence">Gather more evidence</button></div>'+(decision?'<p class="feedback" role="status">'+esc(feedback())+'</p>':'')+'</section><details class="about"><summary>About these results</summary><p class="small">Five fictional jacket question templates have six wording variants. Scores use synthetic tuples and deterministic offsets; paired bootstrap uses 10,000 resamples and seed 42. There is no combined score. Averages can hide failures, and these intervals do not establish customer coverage.</p></details><div class="caption">Interactive demo by <a href="https://authorscollective.org" target="_blank" rel="noopener">Authors Collective</a> and <a href="https://fieldday.dev" target="_blank" rel="noopener">Field Day Labs</a>.</div></main>';
      sh.querySelectorAll("[data-s]").forEach(function(b){b.onclick=function(){scenario=b.dataset.s;decision="";expanded="a1";render();};});sh.querySelectorAll("[data-case]").forEach(function(b){b.onclick=function(){expanded=b.dataset.case;render();};});sh.querySelector("#threshold").oninput=function(e){threshold=Number(e.target.value);render();};sh.querySelector("#fail").onchange=function(e){fail=e.target.checked;render();};sh.querySelectorAll("[data-d]").forEach(function(b){b.onclick=function(){decision=b.dataset.d;render();};});
    }
    render();
  }
  var ownScript=document.currentScript;
  function start(){var warned=false;function scan(){var nodes=[].slice.call(document.querySelectorAll('[data-ac-applet="would-you-ship"]'));if(!nodes.length&&ownScript&&ownScript.dataset.target){var anchor=document.querySelector(ownScript.dataset.target);if(anchor){var n=document.createElement("div");n.dataset.acApplet="would-you-ship";anchor.parentNode.insertBefore(n,anchor.nextSibling);nodes=[n];}}nodes.forEach(mount);if(!nodes.length&&!warned){warned=true;console.warn("Would-you-ship applet: add [data-ac-applet=would-you-ship] or a data-target anchor.");}return nodes.length>0;}if(scan())return;if(window.MutationObserver){var ob=new MutationObserver(function(){if(scan())ob.disconnect();});ob.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){ob.disconnect();},15000);}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
