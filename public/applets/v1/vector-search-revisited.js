/Users/jadenbaptista/.rvm/scripts/rvm:29: operation not permitted: ps
/**
 * SPEC: When similarity isn't enough. The app below renders a replaceable,
 * precomputed fixture; its placeholder ranking numbers are not model results.
 * Full spec: https://app.notion.com/p/416a1fe6155280938a83cc239d276c79
 * Placement: after the article's vector-search limitations section.
 *
 * BUILD: A self-contained JavaScript applet comparing recorded Keyword, Vector,
 * and Hybrid results over approximately 20 real products. Provide four query
 * chips: Adidas running shoes; Comfortable shoes for standing all day;
 * USB-C charger 65W; Nike Pegasus 41. Default first query, Vector, constraints off.
 * Provide mode tabs and a separate Enforce requirements toggle for EVERY mode.
 * Preserve mode/toggle when changing query; Reset restores defaults.
 * Show top five results (fewer when constrained), names, brands, verified facts,
 * manufacturer source links, match/mismatch notes, and observed takeaways.
 *
 * DATA: Collect about 12 footwear products and 8 chargers from manufacturer
 * sources. Record URLs, retrieval date, exact indexed text, factual attributes,
 * stable IDs, corpus hash, fixture date/version, and model/method provenance.
 * Offline: compute BM25, actual documented model embeddings/cosine similarities,
 * and equal-weight reciprocal rank fusion (k=60). Generate every query/mode/
 * constraint state in advance, breaking ties by ID. Browser ONLY selects and
 * renders bundled recorded outputs: no scoring, filtering, reranking, or APIs.
 * Never invent semantic scores or reorder results to force the expected lesson.
 *
 * POLICY: Apply identical constraints across modes: Adidas running footwear;
 * no constraint for comfort; verified single-port USB-C output >=65W;
 * exact Nike Pegasus 41 identity. Unknown required attributes fail strict mode.
 * Explain that constraint policy is separate from fusion. Revise queries or
 * commentary if real results differ from expectations. No vendor benchmark,
 * latency measurements, free-text search, or adjustable fusion weights.
 * Explain BM25/cosine/RRF separately; never label scores confidence/accuracy.
 * Include expandable methodology and offline reproduction instructions.
 *
 * EMBED: Serve this file at authorscollective.org/applets/v1/vector-search-revisited.js.
 * Deferred classic script mounts into [data-ac-applet="vector-search-revisited"]
 * after DOM readiness; explicit script data-target may identify a stable anchor
 * to insert after instead. Never infer placement from heading text. Support late
 * mounts using a bounded 15-second observer; disconnect after success/timeout.
 * Support multiple instances and repeated script tags without duplicate mounts.
 * Bundle fixtures/styles; isolate styles in Shadow DOM. No runtime requests
 * beyond this script, tracking, storage, framework dependency, or global CSS.
 * Keep static fallback until initialization succeeds; missing target warns once.
 * Responsive to 320px, keyboard accessible, labeled controls, visible focus,
 * reduced motion, non-color statuses; preserve focus during result changes.
 * The article's HTML must include the permanent credit as ordinary text OUTSIDE
 * the applet mount. Do not inject it from this script; the publisher should be
 * able to crawl it without executing JavaScript. Example integration markup:
 * <div data-ac-applet="vector-search-revisited"><p>Interactive retrieval comparison loading.</p></div>
 * <p class="applet-credit">Interactive demo by
 * <a href="https://authorscollective.org">Authors Collective</a> and
 * <a href="https://fieldday.dev">Field Day Labs</a>.</p>
 * <script defer src="https://authorscollective.org/applets/v1/vector-search-revisited.js"></script>
 * Disclose real records/offline results, corpus date, and limited comparison scope.
 *
 * DONE: Deliver source, offline generator, fixtures/provenance, build/embed README,
 * preview HTML, and this standalone production bundle. Verify all 24 states,
 * source accuracy, deterministic order, unknown/empty results, no runtime search,
 * duplicate/delayed mounts, two instances, keyboard/mobile, and style isolation.
 */
/*
 * EDITING THIS APPLET
 * -------------------
 * Everything intended for later replacement is in EDITABLE_FIXTURE below.
 * Product records live in EDITABLE_FIXTURE.products. For each query, each method
 * (keyword/vector/hybrid), and each requirements state (off/on), edit the result
 * rows in EDITABLE_FIXTURE.queries[*].states. A row is [productId, score, note].
 * Keep at most five rows; strict states may contain fewer. Keep scores as raw
 * BM25, cosine, or RRF values for the selected method. These starter numbers are
 * deliberately marked PLACEHOLDER and must not be described as model outputs.
 * When importing a real fixture, replace those values and provenance metadata
 * together. `vector` values should be cosine similarities from the documented
 * embedding model; no embedding model or ranking code runs in this applet.
 * The app only selects and displays bundled rows. The 20 source records and all
 * eight states per query are local data. Product facts should be reviewed at the
 * listed manufacturer page before each corpus refresh.
 */
(function(){
  "use strict";
  var APP="ac-applet-vector-search-v1";
  /* EDITABLE_FIXTURE: copy-ready catalog and immutable display states. */
  var EDITABLE_FIXTURE={
    version:"0.1.0-placeholder",corpusDate:"2026-11-12",
    provenance:"PLACEHOLDER rankings: scores below are editable sample values, not BM25/model output. Replace from the offline generator before publication as measured results.",
    methods:{keyword:{label:"Keyword",score:"BM25"},vector:{label:"Vector",score:"Cosine"},hybrid:{label:"Hybrid",score:"RRF"}},
    products:[
      {id:"adidas-supernova-rise",name:"Supernova Rise",brand:"adidas",kind:"running shoe",desc:"Daily road-running shoe in the Supernova line.",facts:"Running footwear; exact material/spec details vary by version.",url:"https://www.adidas.com/us/supernova_rise"},
      {id:"adidas-supernova-rise-3",name:"Supernova Rise 3",brand:"adidas",kind:"running shoe",desc:"Current Supernova Rise generation listed by adidas.",facts:"Running footwear; model generation shown in the manufacturer listing.",url:"https://www.adidas.com/us/supernova_rise-running"},
      {id:"adidas-adizero-boston-13",name:"Adizero Boston 13",brand:"adidas",kind:"running shoe",desc:"Adizero road-running model.",facts:"Running footwear; manufacturer page for Boston 13.",url:"https://www.adidas.com/us/adizero_boston_13"},
      {id:"adidas-adizero-sl2",name:"Adizero SL 2",brand:"adidas",kind:"running shoe",desc:"Adizero road-running model.",facts:"Running footwear; manufacturer product family.",url:"https://www.adidas.com/us/adizero_sl_2"},
      {id:"nike-pegasus-41",name:"Nike Pegasus 41",brand:"Nike",kind:"running shoe",desc:"Pegasus 41 road-running shoe.",facts:"Exact identity: Nike Pegasus 41.",url:"https://www.nike.com/a/pegasus-41-release-info/"},
      {id:"nike-vomero-18",name:"Nike Vomero 18",brand:"Nike",kind:"running shoe",desc:"Nike road-running shoe in the Vomero line.",facts:"Running footwear.",url:"https://www.nike.com/w/mens-vomero-road-running-shoes-1gdj0znik1zy7ok"},
      {id:"brooks-ghost-17",name:"Brooks Ghost 17",brand:"Brooks",kind:"running shoe",desc:"Ghost 17 road-running shoe.",facts:"Running footwear.",url:"https://www.brooksrunning.com/en_us/mens/shoes/road-running-shoes/ghost-17/1104422E041.110.html"},
      {id:"asics-gel-nimbus-27",name:"ASICS GEL-NIMBUS 27",brand:"ASICS",kind:"running shoe",desc:"Neutral cushioned running shoe.",facts:"ASICS describes this model as a neutral cushioned running shoe.",url:"https://www.asics.com/ca/en-ca/gel-nimbus-27-1011b958-102"},
      {id:"saucony-ride-18",name:"Saucony Ride 18",brand:"Saucony",kind:"running shoe",desc:"Daily running shoe in the Ride line.",facts:"Running footwear.",url:"https://www.saucony.com/AD/en_AD/ride-18/59943M.html"},
      {id:"hoka-clifton-10",name:"HOKA Clifton 10",brand:"HOKA",kind:"running shoe",desc:"Clifton 10 road-running shoe.",facts:"Running footwear.",url:"https://www.hoka.com/en/us/mens-everyday-running-shoes/clifton-10/"},
      {id:"new-balance-1080v14",name:"New Balance Fresh Foam X 1080v14",brand:"New Balance",kind:"running shoe",desc:"Fresh Foam X 1080 road-running shoe.",facts:"Running footwear.",url:"https://www.newbalance.com/pd/fresh-foam-x-1080v14/M1080V14-46670.html"},
      {id:"asics-novablast-5",name:"ASICS NOVABLAST 5",brand:"ASICS",kind:"running shoe",desc:"NOVABLAST 5 running shoe.",facts:"Running footwear.",url:"https://www.asics.com/us/en-us/novablast-5/p/ANA_1011B974-001.html"},
      {id:"anker-715",name:"Anker 715 Charger (Nano II 65W)",brand:"Anker",kind:"charger",desc:"65W USB-C wall charger.",facts:"Single-port USB-C; listed maximum output 65W.",ports:1,usbC:true,watts:65,url:"https://www.anker.com/products/a2663"},
      {id:"anker-735",name:"Anker 735 Charger (Nano II 65W)",brand:"Anker",kind:"charger",desc:"65W multiport wall charger.",facts:"Three ports; can provide up to 65W from a single USB-C port.",ports:3,usbC:true,watts:65,url:"https://www.anker.com/products/a2667"},
      {id:"belkin-65w",name:"Belkin BoostCharge Compact USB-C Wall Charger 65W",brand:"Belkin",kind:"charger",desc:"Compact 65W USB-C wall charger.",facts:"Single-port USB-C; 65W.",ports:1,usbC:true,watts:65,url:"https://www.belkin.com/p/compact-usb-c-charger-65w/BBC032ttBK.html"},
      {id:"apple-67w",name:"Apple 67W USB-C Power Adapter",brand:"Apple",kind:"charger",desc:"Apple USB-C power adapter rated 67W.",facts:"One USB-C port; 67W adapter.",ports:1,usbC:true,watts:67,url:"https://support.apple.com/en-us/109509"},
      {id:"dell-65w",name:"Dell 65W USB-C AC Adapter",brand:"Dell",kind:"charger",desc:"65W USB-C AC adapter.",facts:"USB-C adapter rated 65W.",ports:1,usbC:true,watts:65,url:"https://www.dell.com/en-us/shop/dell-65w-usb-c-ac-adapter/apd/450-bfmc/pc-accessories"},
      {id:"ugreen-nexode-air-65w",name:"UGREEN Nexode Air USB-C Charger 65W",brand:"UGREEN",kind:"charger",desc:"65W GaN charger with foldable plug.",facts:"USB-C, 65W. Verify port count and exact variant in the linked listing before using strict fixtures.",ports:null,usbC:true,watts:65,url:"https://us.ugreen.com/products/nexode-air-usb-c-charger-65w-gan-foldable-plug"},
      {id:"anker-725",name:"Anker 725 Charger 65W",brand:"Anker",kind:"charger",desc:"65W wall charger.",facts:"65W product family; exact port-specific output is variant-dependent.",ports:null,usbC:true,watts:65,url:"https://service.anker.com/product-description/a085g000004x2BVAAY/anker-725-charger-65w"},
      {id:"lenovo-65w",name:"Lenovo 65W USB-C Power Adapter",brand:"Lenovo",kind:"charger",desc:"65W USB-C adapter listed in Lenovo's charger catalog.",facts:"65W USB-C. Port count may vary by product in this family; treated as unknown.",ports:null,usbC:true,watts:65,url:"https://www.lenovo.com/buy/us/en/pd-30-usb-c-power-adapters-0auz00a"}
    ],
    queries:[
      {id:"adidas",label:"Adidas running shoes",text:"Adidas running shoes",policy:"Brand is adidas and product is running footwear.",takeaway:"Brand and category constraints are application policy, separate from ranking.",states:{
        keyword:{off:[["adidas-supernova-rise",8.42,"Brand and running terms match"],["adidas-supernova-rise-3",7.9,"Brand and running terms match"],["adidas-adizero-boston-13",7.42,"Brand and running terms match"],["adidas-adizero-sl2",6.88,"Brand and running terms match"],["nike-pegasus-41",1.2,"Running match; brand mismatch"]],on:[["adidas-supernova-rise",8.42,"Constraint match"],["adidas-supernova-rise-3",7.9,"Constraint match"],["adidas-adizero-boston-13",7.42,"Constraint match"],["adidas-adizero-sl2",6.88,"Constraint match"]]},
        vector:{off:[["adidas-supernova-rise",.81,"Brand and running intent"],["adidas-supernova-rise-3",.78,"Brand and running intent"],["brooks-ghost-17",.75,"Running intent; brand mismatch"],["nike-pegasus-41",.73,"Running intent; brand mismatch"],["adidas-adizero-boston-13",.72,"Brand and running intent"]],on:[["adidas-supernova-rise",.81,"Constraint match"],["adidas-supernova-rise-3",.78,"Constraint match"],["adidas-adizero-boston-13",.72,"Constraint match"],["adidas-adizero-sl2",.69,"Constraint match"]]},
        hybrid:{off:[["adidas-supernova-rise",.0323,"Strong lexical and vector ranks"],["adidas-supernova-rise-3",.0318,"Strong lexical and vector ranks"],["adidas-adizero-boston-13",.0309,"Strong lexical rank"],["adidas-adizero-sl2",.0298,"Strong lexical rank"],["nike-pegasus-41",.0142,"Running intent; brand mismatch"]],on:[["adidas-supernova-rise",.0323,"Constraint match"],["adidas-supernova-rise-3",.0318,"Constraint match"],["adidas-adizero-boston-13",.0309,"Constraint match"],["adidas-adizero-sl2",.0298,"Constraint match"]]}}},
      {id:"comfort",label:"Comfortable shoes for standing all day",text:"Comfortable shoes for standing all day",policy:"No hard constraint for this query.",takeaway:"Comfort and long-wear intent can be expressed differently across product records.",states:{
        keyword:{off:[["brooks-ghost-17",2.12,"Description overlap"],["hoka-clifton-10",1.8,"Description overlap"],["asics-gel-nimbus-27",1.55,"Cushioning wording"],["new-balance-1080v14",1.44,"Cushioning wording"],["saucony-ride-18",.92,"Partial term match"]],on:[["brooks-ghost-17",2.12,"No constraint applied"],["hoka-clifton-10",1.8,"No constraint applied"],["asics-gel-nimbus-27",1.55,"No constraint applied"],["new-balance-1080v14",1.44,"No constraint applied"],["saucony-ride-18",.92,"No constraint applied"]]},
        vector:{off:[["hoka-clifton-10",.82,"Comfort intent"],["asics-gel-nimbus-27",.8,"Cushioning intent"],["new-balance-1080v14",.79,"Cushioning intent"],["brooks-ghost-17",.77,"Daily-run intent"],["adidas-supernova-rise",.72,"Daily-run intent"]],on:[["hoka-clifton-10",.82,"No constraint applied"],["asics-gel-nimbus-27",.8,"No constraint applied"],["new-balance-1080v14",.79,"No constraint applied"],["brooks-ghost-17",.77,"No constraint applied"],["adidas-supernova-rise",.72,"No constraint applied"]]},
        hybrid:{off:[["hoka-clifton-10",.0311,"Vector intent with lexical support"],["brooks-ghost-17",.0308,"Both methods contribute"],["asics-gel-nimbus-27",.0302,"Cushioning terms"],["new-balance-1080v14",.0297,"Cushioning terms"],["adidas-supernova-rise",.0278,"Daily-run match"]],on:[["hoka-clifton-10",.0311,"No constraint applied"],["brooks-ghost-17",.0308,"No constraint applied"],["asics-gel-nimbus-27",.0302,"No constraint applied"],["new-balance-1080v14",.0297,"No constraint applied"],["adidas-supernova-rise",.0278,"No constraint applied"]]}}},
      {id:"charger",label:"USB-C charger 65W",text:"USB-C charger 65W",policy:"Verified single-port USB-C output of at least 65W. Unknown port counts fail strict mode.",takeaway:"Requirement enforcement is a separate policy layer; unknown required facts fail strict mode.",states:{
        keyword:{off:[["anker-715",8.4,"65W USB-C terms"],["anker-735",8.2,"65W USB-C terms; multiple ports"],["belkin-65w",7.9,"65W USB-C terms"],["ugreen-nexode-air-65w",7.5,"65W USB-C terms; port count unknown"],["apple-67w",5.4,"USB-C and 67W"]],on:[["anker-715",8.4,"Verified single port, ≥65W"],["belkin-65w",7.9,"Verified single port, ≥65W"],["apple-67w",5.4,"One USB-C port, 67W"],["dell-65w",4.8,"65W USB-C adapter"]]},
        vector:{off:[["anker-735",.86,"Charger intent; 65W"],["ugreen-nexode-air-65w",.83,"Charger intent; 65W"],["anker-715",.81,"Charger intent; single port"],["belkin-65w",.8,"Charger intent; 65W"],["dell-65w",.78,"USB-C power adapter"]],on:[["anker-715",.81,"Verified single port, ≥65W"],["belkin-65w",.8,"Verified single port, ≥65W"],["dell-65w",.78,"65W USB-C adapter"],["apple-67w",.74,"One USB-C port, 67W"]]},
        hybrid:{off:[["anker-715",.0331,"Strong lexical and vector ranks"],["anker-735",.0328,"65W match; three ports"],["belkin-65w",.0322,"Strong lexical match"],["ugreen-nexode-air-65w",.0311,"Port count unknown"],["dell-65w",.0287,"USB-C 65W adapter"]],on:[["anker-715",.0331,"Verified single port, ≥65W"],["belkin-65w",.0322,"Verified single port, ≥65W"],["dell-65w",.0287,"65W USB-C adapter"],["apple-67w",.0251,"One USB-C port, 67W"]]}}},
      {id:"pegasus",label:"Nike Pegasus 41",text:"Nike Pegasus 41",policy:"Exact product identity: Nike Pegasus 41.",takeaway:"Exact identity constraints prevent related models from satisfying this request.",states:{
        keyword:{off:[["nike-pegasus-41",12.4,"Exact model-name match"],["nike-vomero-18",1.2,"Brand match; different model"],["adidas-adizero-boston-13",.4,"Running shoe; different brand/model"],["adidas-supernova-rise",.2,"Running shoe; different brand/model"]],on:[["nike-pegasus-41",12.4,"Exact identity match"]]},
        vector:{off:[["nike-pegasus-41",.9,"Exact identity"],["nike-vomero-18",.78,"Related Nike running model"],["brooks-ghost-17",.66,"Related running shoe"],["adidas-adizero-boston-13",.61,"Related running shoe"]],on:[["nike-pegasus-41",.9,"Exact identity match"]]},
        hybrid:{off:[["nike-pegasus-41",.0333,"Exact lexical and vector match"],["nike-vomero-18",.0161,"Related model"],["brooks-ghost-17",.0109,"Related running model"],["adidas-adizero-boston-13",.0098,"Related running model"]],on:[["nike-pegasus-41",.0333,"Exact identity match"]]}}}
    ]
  };
  var css=":host{all:initial;display:block;color:#202323;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}*{box-sizing:border-box}button{font:inherit;cursor:pointer}.app{max-width:820px;margin:0 auto;padding:18px 20px;border:1px solid #dce1df;border-radius:14px;background:#fff}.head{display:flex;align-items:center;justify-content:space-between;gap:12px}.head h2{margin:0;font-size:16px;letter-spacing:-.01em}.fixture-tag{display:inline-block;padding:4px 8px;border-radius:6px;background:#f3f5f4;color:#4d5954;font-size:11px;vertical-align:middle;font-weight:600}.group{margin-top:16px}.label{display:block;margin-bottom:6px;color:#53615b;font-size:12px;font-weight:650}.chips,.tabs{display:flex;gap:7px;flex-wrap:wrap;margin:0}.chip,.tab,.reset{border:1px solid #cad4d0;border-radius:7px;padding:7px 10px;background:#fff;color:#26312e}.chip{font-size:13px}.chip[aria-pressed=true]{background:#eef4f1;border-color:#52786c;color:#173f36}.method-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.tabs{gap:0;border:1px solid #cad4d0;border-radius:8px;overflow:hidden}.tab{border:0;border-radius:0;padding:7px 13px}.tab+ .tab{border-left:1px solid #cad4d0}.tab[aria-pressed=true]{background:#173f36;color:#fff}.requirements{display:flex;align-items:center;gap:8px;color:#26312e;font-size:13px}.requirements input{width:16px;height:16px;accent-color:#173f36}.reset{margin-left:auto;padding:6px 10px;font-size:12px}.caveat{margin:14px 0 10px;padding:8px 10px;border-left:3px solid #9a7a35;background:#faf8f1;color:#55451f;font-size:12px}.policy{font-size:12px;color:#53615b;margin:0 0 10px}.panel{border-top:1px solid #e0e6e3;padding-top:10px;min-width:0}.panel h3{margin:0 0 2px;font-size:15px}.small{font-size:12px;color:#626d69;font-weight:400}.change-summary{margin:0 0 6px;color:#626d69;font-size:12px}.product{padding:11px 0;border-bottom:1px solid #edf0ee;display:grid;grid-template-columns:25px 1fr;gap:8px;align-items:start}.product:last-child{border-bottom:0}.rank{font-variant-numeric:tabular-nums;color:#66716d}.title{font-weight:700}.brand{font-size:12px;color:#606c67}.fact{font-size:12px;margin-top:3px;color:#36423d}.note{margin-top:3px;font-size:12px;color:#53615b}.meta{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;font-size:11px}.source{color:#235c50}.movement{color:#606c67}.about{margin-top:12px;border-top:1px solid #e8ecea;padding-top:10px}.about summary{cursor:pointer;font-weight:650}.about p{max-width:75ch;font-size:13px;color:#4e5a55}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #df922d;outline-offset:2px}@media(max-width:560px){.app{padding:13px;border-radius:10px}.head{align-items:flex-start;flex-direction:column;gap:7px}.chip{padding:7px 8px}.method-row{gap:8px}.reset{margin-left:0}.product{grid-template-columns:21px 1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}";
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function mount(host){if(host.dataset.acMounted===APP)return;host.dataset.acMounted=APP;var root=host.shadowRoot||host.attachShadow({mode:"open"}),q=0,method="vector",strict=false;
    function render(){var query=EDITABLE_FIXTURE.queries[q],rows=query.states[method][strict?"on":"off"],baseline=query.states.keyword[strict?"on":"off"],baselineRank={};baseline.forEach(function(r,i){baselineRank[r[0]]=i+1;});var moved=rows.filter(function(r,i){return baselineRank[r[0]]!==i+1;}).length;var items=rows.map(function(r,i){var p=EDITABLE_FIXTURE.products.find(function(x){return x.id===r[0];});if(!p)return "";var old=baselineRank[r[0]],movement=method==="keyword"?"Keyword baseline":old?"vs Keyword: "+(old-(i+1)>0?"↑ "+(old-i-1):old-(i+1)<0?"↓ "+(i+1-old):"same position"):"New vs Keyword";return '<li class="product"><span class="rank">'+(i+1)+'.</span><div><div class="title">'+esc(p.name)+'</div><div class="brand">'+esc(p.brand)+' · '+esc(p.kind)+'</div><div class="fact">'+esc(p.facts)+'</div><div class="note">'+esc(r[2])+'</div><div class="meta"><a class="source" href="'+esc(p.url)+'" target="_blank" rel="noopener">Manufacturer source ↗</a><span class="movement">'+esc(movement)+'</span></div></div></li>';}).join("");var queryButtons=EDITABLE_FIXTURE.queries.map(function(x,i){return '<button class="chip" data-q="'+i+'" aria-pressed="'+(q===i)+'">'+esc(x.label)+'</button>';}).join("");var tabs=Object.keys(EDITABLE_FIXTURE.methods).map(function(k){return '<button class="tab" data-method="'+k+'" aria-pressed="'+(method===k)+'">'+esc(EDITABLE_FIXTURE.methods[k].label)+'</button>';}).join("");
      root.innerHTML='<style>'+css+'</style><main class="app"><header class="head"><h2>Search comparison</h2><span class="fixture-tag">Illustrative fixture — rankings and scores are placeholders</span></header><div class="group"><span class="label">Query</span><nav class="chips" aria-label="Preset query">'+queryButtons+'</nav></div><div class="group"><span class="label">Method</span><div class="method-row"><nav class="tabs" aria-label="Retrieval method">'+tabs+'</nav><label class="requirements"><input id="strict" type="checkbox" '+(strict?'checked':'')+'> Enforce requirements</label><button class="reset" id="reset">Reset</button></div></div><p class="caveat">Illustrative data only. These rankings are prewritten examples; no embedding model or search runs in your browser.</p><p class="policy"><b>“'+esc(query.text)+'”</b> · '+esc(strict?"Requirements applied: "+query.policy:"No hard constraint applied")+'</p><section class="panel"><h3>'+esc(EDITABLE_FIXTURE.methods[method].label)+' results <span class="small">('+rows.length+')</span></h3><p class="change-summary">'+(method==="keyword"?"Keyword baseline ranking.":moved+" of "+rows.length+" results change position versus Keyword in this illustrative fixture.")+'</p><ol style="list-style:none;margin:0;padding:0">'+(items||'<li>No matching fixture rows. The static strict state may be empty.</li>')+'</ol></section><details class="about"><summary>About This Comparison</summary><p>This compact example uses a fixed product fixture and prewritten result lists. Keyword refers to BM25, vector similarity to cosine similarity, and hybrid retrieval to equal-weight reciprocal-rank fusion (RRF, k=60). The rankings and displayed positions are placeholders, not measured search results. Fixture source date: '+esc(EDITABLE_FIXTURE.corpusDate)+'.</p><p>Requirements are applied equally across all methods and separately from hybrid fusion. Unknown required product facts fail strict mode. The comfort query has no hard requirement. This comparison is illustrative and is not a vendor benchmark.</p></details></main>';
      root.querySelectorAll("[data-q]").forEach(function(b){b.onclick=function(){q=Number(b.dataset.q);render();};});root.querySelectorAll("[data-method]").forEach(function(b){b.onclick=function(){method=b.dataset.method;render();};});root.querySelector("#strict").onchange=function(e){strict=e.target.checked;render();};root.querySelector("#reset").onclick=function(){q=0;method="vector";strict=false;render();};
    }render();
  }
  var ownScript=document.currentScript;
  function start(){var warned=false;function scan(){var nodes=[].slice.call(document.querySelectorAll('[data-ac-applet="vector-search-revisited"]'));if(!nodes.length&&ownScript&&ownScript.dataset.target){var a=document.querySelector(ownScript.dataset.target);if(a){var n=document.createElement("div");n.dataset.acApplet="vector-search-revisited";a.parentNode.insertBefore(n,a.nextSibling);nodes=[n];}}nodes.forEach(mount);if(!nodes.length&&!warned){warned=true;console.warn("Vector search applet: add [data-ac-applet=vector-search-revisited] or a data-target anchor.");}return nodes.length>0;}if(scan())return;if(window.MutationObserver){var ob=new MutationObserver(function(){if(scan())ob.disconnect();});ob.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){ob.disconnect();},15000);}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
