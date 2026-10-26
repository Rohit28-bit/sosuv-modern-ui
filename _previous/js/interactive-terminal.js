/**
 * SOSUV INSTITUTIONAL TERMINAL ENGINE
 * Precision capital markets simulation: SoFIX Conformance, ATDL360 Algo Visualizer, SOR, & Raw FIX Decoder
 */

document.addEventListener('DOMContentLoaded', () => {
  initTerminalTabs();
  initSoFIXCertSimulator();
  initATDLVisualizer();
  initSORRouter();
  initFIXDecoder();
});

/* ==========================================================================
   1. Terminal Tab Navigation
   ========================================================================== */
function initTerminalTabs() {
  const tabs = document.querySelectorAll('.terminal-tab-btn');
  const panels = document.querySelectorAll('.terminal-view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('data-target');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   FIX Protocol Tag Knowledge Base
   ========================================================================== */
const FIX_DICTIONARY = {
  '8': { name: 'BeginString', desc: 'FIX Protocol Version identifier (e.g. FIX.4.4, FIX.5.0SP2)' },
  '9': { name: 'BodyLength', desc: 'Message length in bytes, excluding header and checksum' },
  '35': { name: 'MsgType', desc: 'Message type definition (A=Logon, D=NewOrderSingle, 8=ExecutionReport, G=CancelReplace)' },
  '49': { name: 'SenderCompID', desc: 'Assigned trading participant identifier of the sending firm' },
  '56': { name: 'TargetCompID', desc: 'Broker-dealer or execution venue gateway identifier' },
  '34': { name: 'MsgSeqNum', desc: 'Deterministic integer sequence number for message synchronization' },
  '52': { name: 'SendingTime', desc: 'UTC timestamp of transmission with microsecond precision' },
  '11': { name: 'ClOrdID', desc: 'Unique order identifier assigned by client OMS/EMS' },
  '37': { name: 'OrderID', desc: 'Unique order identifier assigned by broker matching engine' },
  '41': { name: 'OrigClOrdID', desc: 'Original ClOrdID being amended or canceled' },
  '17': { name: 'ExecID', desc: 'Unique execution identifier generated for this fill/state' },
  '55': { name: 'Symbol', desc: 'Ticker symbol of traded equity, currency pair, or contract' },
  '54': { name: 'Side', desc: 'Order direction (1=Buy, 2=Sell, 5=Sell Short)' },
  '38': { name: 'OrderQty', desc: 'Total intended quantity of shares or contracts' },
  '40': { name: 'OrdType', desc: 'Order pricing style (1=Market, 2=Limit, 3=Stop, D=Previously Quoted)' },
  '44': { name: 'Price', desc: 'Per-share execution limit price in quote currency' },
  '59': { name: 'TimeInForce', desc: 'Order duration parameter (0=Day, 1=GTC, 3=IOC, 4=FOK, 6=GTD)' },
  '150': { name: 'ExecType', desc: 'Reason for execution report (0=New, 1=Partial Fill, 2=Fill, 4=Canceled, I=Status)' },
  '39': { name: 'OrdStatus', desc: 'Current state of the order in venue book (0=New, 1=Partially Filled, 2=Filled)' },
  '31': { name: 'LastPx', desc: 'Price of this specific fill transaction' },
  '32': { name: 'LastQty', desc: 'Quantity transacted on this specific fill' },
  '14': { name: 'CumQty', desc: 'Cumulative total quantity executed across all fills' },
  '6': { name: 'AvgPx', desc: 'Volume-weighted average price across all executed portions' },
  '847': { name: 'TargetStrategy', desc: 'FIXatdl algorithmic strategy identifier (VWAP, TWAP, POV)' },
  '848': { name: 'ParticipationRate', desc: 'Algorithmic volume target percentage of market volume' },
  '849': { name: 'MaxSpreadTolerance', desc: 'Maximum allowable bid-ask spread tolerance in basis points' },
  '957': { name: 'Urgency', desc: 'Algorithmic schedule aggression (1=Passive, 2=Neutral, 3=Aggressive)' },
  '958': { name: 'DarkPoolCross', desc: 'Boolean flag to allow midpoint crossing in non-displayed dark pools' },
  '10': { name: 'CheckSum', desc: 'Modulo 256 sum of all characters in the packet' }
};

function inspectTag(tagKey, tagVal) {
  const inspector = document.getElementById('activeTagInspector');
  if (!inspector) return;

  const tagInfo = FIX_DICTIONARY[tagKey] || { name: 'CustomBrokerTag', desc: 'Proprietary or venue-specific FIX tag definition' };
  
  inspector.innerHTML = `
    <div class="inspector-meta">
      <span>Tag: <strong>${tagKey}</strong></span>
      <span>Field: <strong>${tagInfo.name}</strong></span>
      <span>Value: <strong style="color:var(--text-primary); font-family:var(--font-mono);">${tagVal}</strong></span>
    </div>
    <div style="color:var(--text-muted); font-size:0.72rem;">${tagInfo.desc}</div>
  `;
}

/* ==========================================================================
   2. Module 1: SoFIX Automated AI Certification Simulator
   ========================================================================== */
function initSoFIXCertSimulator() {
  const runBtn = document.getElementById('runCertBtn');
  const consoleEl = document.getElementById('sofixConsole');
  const specSelect = document.getElementById('sofixSpecSelect');
  const progressBar = document.getElementById('certProgressBar');
  const progressText = document.getElementById('certProgressText');
  const speedupVal = document.getElementById('certSpeedupVal');

  const testCases = [
    { id: 'tc-logon', name: 'Logon (35=A) & Heartbeat Handshake', fixMsg: '8=FIX.4.4|9=72|35=A|49=CLIENT_DMA|56=SOSUV_GW|34=1|52=20261026-12:00:00.102|98=0|108=30|10=045|', latency: '0.84µs' },
    { id: 'tc-nos', name: 'NewOrderSingle (35=D) ClOrdID Validation', fixMsg: '8=FIX.4.4|9=142|35=D|49=CLIENT_DMA|56=SOSUV_GW|34=2|52=20261026-12:00:00.145|11=ORD-9021|55=AAPL|54=1|38=5000|40=2|44=185.50|59=0|10=182|', latency: '1.02µs' },
    { id: 'tc-qty', name: 'Tag 38 / 44 Bounds & Price Limits', fixMsg: '8=FIX.4.4|9=145|35=D|49=CLIENT_DMA|56=SOSUV_GW|34=3|52=20261026-12:00:00.180|11=ORD-9022|55=MSFT|54=2|38=100000|40=2|44=420.10|59=0|10=210|', latency: '0.91µs' },
    { id: 'tc-tif', name: 'TimeInForce Matrix (Day, IOC, FOK, GTD)', fixMsg: '8=FIX.4.4|9=138|35=D|49=CLIENT_DMA|56=SOSUV_GW|34=4|52=20261026-12:00:00.215|11=ORD-9023|55=NVDA|54=1|38=2500|40=2|44=138.20|59=3|10=165|', latency: '0.78µs' },
    { id: 'tc-cancel', name: 'OrderCancelReplaceRequest (35=G)', fixMsg: '8=FIX.4.4|9=156|35=G|49=CLIENT_DMA|56=SOSUV_GW|34=5|52=20261026-12:00:00.250|41=ORD-9021|11=ORD-9024|55=AAPL|54=1|38=3500|44=186.00|10=244|', latency: '1.14µs' },
    { id: 'tc-exec', name: 'ExecutionReport (35=8) Fill Math', fixMsg: '8=FIX.4.4|9=168|35=8|49=SOSUV_GW|56=CLIENT_DMA|34=5|52=20261026-12:00:00.285|37=MATCH-8891|11=ORD-9024|17=FILL-01|150=2|39=2|55=AAPL|38=3500|32=3500|31=186.00|14=3500|6=186.00|10=092|', latency: '0.69µs' },
    { id: 'tc-atdl', name: 'FIXatdl Algorithmic Parameter Bindings', fixMsg: '8=FIX.4.4|9=172|35=D|49=CLIENT_DMA|56=SOSUV_GW|34=6|52=20261026-12:00:00.320|11=ORD-9025|55=NVDA|54=1|38=10000|40=D|847=VWAP|848=15|849=5|957=2|958=Y|10=118|', latency: '0.88µs' },
    { id: 'tc-drop', name: 'Drop-Copy Clearing Reconciliation (35=8)', fixMsg: '8=FIX.4.4|9=162|35=8|49=SOSUV_GW|56=DROP_COPY|34=12|52=20261026-12:00:00.355|37=MATCH-8891|11=ORD-9024|17=FILL-01|150=I|39=2|55=AAPL|14=3500|6=186.00|10=132|', latency: '0.74µs' }
  ];

  if (!runBtn) return;

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.innerHTML = `
      <span style="display:inline-block; animation: spin 0.8s linear infinite;">⟳</span>
      Validating Protocol Packets...
    `;

    consoleEl.innerHTML = '';
    testCases.forEach(tc => {
      const card = document.getElementById(tc.id);
      if (card) {
        card.className = 'cert-test-card';
        const badge = card.querySelector('.cert-badge');
        if (badge) {
          badge.className = 'cert-badge running';
          badge.textContent = 'QUEUED';
        }
        const latEl = card.querySelector('.cert-latency');
        if (latEl) latEl.textContent = 'Awaiting packet';
      }
    });

    logMessage('INFO', 'INIT', `Loading automated specification profile: [${specSelect ? specSelect.value : 'Goldman Sachs DMA FIX 4.4'}]`);
    logMessage('INFO', 'SPEC_PARSER', 'Parsing dictionary repeating groups, conditional tags & custom FIXatdl bounds...');

    let currentStep = 0;

    function runNextStep() {
      if (currentStep >= testCases.length) {
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '8 of 8 Suites Passed (100%)';
        if (speedupVal) speedupVal.textContent = '80% Reduction';

        logMessage('SUCCESS', 'CERT_PASS', `Conformance verification complete. Digital Audit Trail & Conformance Pack generated.`);
        runBtn.disabled = false;
        runBtn.innerHTML = `
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
          Re-Run Automated Certification
        `;
        return;
      }

      const tc = testCases[currentStep];
      const card = document.getElementById(tc.id);
      if (card) {
        const badge = card.querySelector('.cert-badge');
        if (badge) {
          badge.className = 'cert-badge running';
          badge.textContent = 'INSPECTING';
        }
      }

      logMessage('OUTBOUND', 'TEST_PACK', formatFix(tc.fixMsg));

      setTimeout(() => {
        if (card) {
          card.classList.add('passed');
          const badge = card.querySelector('.cert-badge');
          if (badge) {
            badge.className = 'cert-badge success';
            badge.textContent = 'CONFORMANT';
          }
          const latEl = card.querySelector('.cert-latency');
          if (latEl) latEl.textContent = `Latency: ${tc.latency}`;
        }

        currentStep++;
        const pct = Math.round((currentStep / testCases.length) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `${currentStep} of ${testCases.length} (${pct}%)`;

        setTimeout(runNextStep, 250);
      }, 350);
    }

    setTimeout(runNextStep, 400);
  });

  function logMessage(type, subtype, text) {
    const entry = document.createElement('div');
    entry.className = 'fix-log-entry';

    const now = new Date();
    const timeStr = now.toISOString().substring(11, 23);

    let typeClass = 'inbound';
    if (type === 'OUTBOUND') typeClass = 'outbound';
    if (type === 'SUCCESS') typeClass = 'cert-pass';

    entry.innerHTML = `
      <span class="log-ts">${timeStr}</span>
      <span class="log-type ${typeClass}">[${subtype}]</span>
      <span class="log-content">${text}</span>
    `;

    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;

    // Attach click listener for tag inspection
    entry.querySelectorAll('.tag-item').forEach(el => {
      el.addEventListener('click', () => {
        inspectTag(el.dataset.k, el.dataset.v);
      });
    });
  }

  function formatFix(str) {
    return str.split('|').map(tag => {
      if (!tag) return '';
      const eqIdx = tag.indexOf('=');
      if (eqIdx === -1) return tag;
      const k = tag.substring(0, eqIdx);
      const v = tag.substring(eqIdx + 1);
      return `<span class="tag-item" data-k="${k}" data-v="${v}" title="Click to inspect Tag ${k}"><span class="tag-key">${k}</span>=<span class="tag-val">${v}</span></span><span class="tag-pipe">|</span>`;
    }).join('');
  }
}

/* ==========================================================================
   3. Module 2: ATDL360 Algo Strategy Visualizer & Tag Stream
   ========================================================================== */
function initATDLVisualizer() {
  const algoSelect = document.getElementById('atdlAlgoSelect');
  const povSlider = document.getElementById('atdlPovSlider');
  const povVal = document.getElementById('atdlPovVal');
  const spreadSlider = document.getElementById('atdlSpreadSlider');
  const spreadVal = document.getElementById('atdlSpreadVal');
  const urgencyRadios = document.querySelectorAll('.urgency-radio');
  const darkCheck = document.getElementById('atdlDarkCheck');
  const liveTagStream = document.getElementById('atdlLiveTagStream');
  const xmlPreview = document.getElementById('atdlXmlPreview');

  if (!algoSelect || !liveTagStream) return;

  function updateATDLOutput() {
    const algo = algoSelect.value;
    const pov = povSlider ? povSlider.value : 15;
    const spread = spreadSlider ? spreadSlider.value : 5;
    let urgency = 'Medium';
    urgencyRadios.forEach(r => {
      if (r.classList.contains('active')) urgency = r.dataset.val;
    });
    const allowDark = darkCheck ? darkCheck.checked : true;

    if (povVal) povVal.textContent = `${pov}%`;
    if (spreadVal) spreadVal.textContent = `${spread} bps`;

    let urgencyTagVal = '2';
    if (urgency === 'Low') urgencyTagVal = '1';
    if (urgency === 'High') urgencyTagVal = '3';

    const fixStr = `8=FIX.4.4|9=242|35=D|49=CLIENT_DMA|56=SOSUV_GW|11=ORD_ALGO_${Date.now().toString().slice(-4)}|55=NVDA|54=1|38=25000|40=D|847=${algo}|848=${pov}|849=${spread}|957=${urgencyTagVal}|958=${allowDark ? 'Y' : 'N'}|59=0|10=204|`;

    liveTagStream.innerHTML = fixStr.split('|').map(tag => {
      if (!tag) return '';
      const parts = tag.split('=');
      const isAlgoTag = ['847', '848', '849', '957', '958'].includes(parts[0]);
      return `<span class="tag-item" data-k="${parts[0]}" data-v="${parts[1]}" title="Click to inspect Tag ${parts[0]}"><span class="tag-key" style="${isAlgoTag ? 'color: var(--accent-sky); font-weight:700;' : ''}">${parts[0]}</span>=<span class="tag-val" style="${isAlgoTag ? 'color: #38bdf8;' : ''}">${parts[1]}</span></span><span class="tag-pipe">|</span>`;
    }).join('');

    liveTagStream.querySelectorAll('.tag-item').forEach(el => {
      el.addEventListener('click', () => {
        inspectTag(el.dataset.k, el.dataset.v);
      });
    });

    if (xmlPreview) {
      xmlPreview.textContent = `<?xml version="1.0" encoding="UTF-8"?>
<core:Strategy name="${algo}" uiRep="${algo} Strategy" wireValue="${algo}" fixMsgType="D" providerID="SOSUV">
  <val:StrategyParameters>
    <core:Parameter name="ParticipationRate" fixTag="848" type="Percentage_t" value="${pov}.0"/>
    <core:Parameter name="MaxSpreadTolerance" fixTag="849" type="Float_t" value="${spread}.0"/>
    <core:Parameter name="ExecutionUrgency" fixTag="957" type="Int_t" value="${urgencyTagVal}"/>
    <core:Parameter name="DarkPoolCrossing" fixTag="958" type="Boolean_t" value="${allowDark ? 'true' : 'false'}"/>
  </val:StrategyParameters>
  <flow:StateRule enabled="true">
    <flow:Edit logicOp="AND">
      <flow:Predicate operator="LE" field="ParticipationRate" value="50"/>
    </flow:Edit>
  </flow:StateRule>
</core:Strategy>`;
    }
  }

  algoSelect.addEventListener('change', updateATDLOutput);
  if (povSlider) povSlider.addEventListener('input', updateATDLOutput);
  if (spreadSlider) spreadSlider.addEventListener('input', updateATDLOutput);
  if (darkCheck) darkCheck.addEventListener('change', updateATDLOutput);

  urgencyRadios.forEach(r => {
    r.addEventListener('click', () => {
      urgencyRadios.forEach(el => el.classList.remove('active'));
      r.classList.add('active');
      updateATDLOutput();
    });
  });

  updateATDLOutput();
}

/* ==========================================================================
   4. Module 3: Smart Order Router (SOR) Simulator
   ========================================================================== */
function initSORRouter() {
  const runBtn = document.getElementById('runSorBtn');
  const routeLog = document.getElementById('sorRouteLog');
  const darkFill = document.getElementById('sorDarkFill');
  const priceImp = document.getElementById('sorPriceImp');

  if (!runBtn || !routeLog) return;

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    routeLog.innerHTML = '';

    const hops = [
      { ts: '00:00.001', msg: 'INGEST: Inbound 10,000 NVDA Buy Order at NBBO ($138.25 - $138.28)' },
      { ts: '00:00.018', msg: 'CROSS-CHECK: Querying Non-Displayed Midpoint Dark Pools (Liquidnet, Crossfinder, Sigma X)' },
      { ts: '00:00.042', msg: 'DARK FILL: 6,500 shares matched at midpoint $138.265 (Price Improvement: +1.5 bps)' },
      { ts: '00:00.065', msg: 'ROUTING LIT: Sweeping remaining 3,500 across NASDAQ (INET: 2,000) and BATS (EDGX: 1,500)' },
      { ts: '00:00.091', msg: 'EXECUTION COMPLETE: 10,000 shares filled across 3 venues. Total dispatch time: 0.89µs' }
    ];

    let i = 0;
    function printHop() {
      if (i >= hops.length) {
        if (darkFill) darkFill.textContent = '65% Midpoint Dark Fill';
        if (priceImp) priceImp.textContent = '+$227.50 (+1.5 bps)';
        runBtn.disabled = false;
        return;
      }

      const h = hops[i];
      const entry = document.createElement('div');
      entry.className = 'fix-log-entry';
      entry.innerHTML = `
        <span class="log-ts">${h.ts}</span>
        <span class="log-type outbound">[SOR_HOP]</span>
        <span class="log-content">${h.msg}</span>
      `;
      routeLog.appendChild(entry);
      routeLog.scrollTop = routeLog.scrollHeight;

      i++;
      setTimeout(printHop, 280);
    }

    printHop();
  });
}

/* ==========================================================================
   5. Module 4: Raw FIX Packet Decoder & Inspector (New Tool)
   ========================================================================== */
function initFIXDecoder() {
  const decodeBtn = document.getElementById('decodeFixBtn');
  const fixInput = document.getElementById('rawFixInput');
  const tableBody = document.getElementById('fixDecoderBody');
  const presetButtons = document.querySelectorAll('.fix-preset-btn');

  if (!decodeBtn || !fixInput || !tableBody) return;

  function parseAndRenderFIX(rawStr) {
    tableBody.innerHTML = '';
    const cleanStr = rawStr.trim();
    // Support pipe (|), SOH (\x01), and space delimiters
    const tags = cleanStr.split(/[|\x01]/).filter(t => t.trim().length > 0);

    tags.forEach(tag => {
      const eqIdx = tag.indexOf('=');
      if (eqIdx === -1) return;
      const k = tag.substring(0, eqIdx).trim();
      const v = tag.substring(eqIdx + 1).trim();

      const info = FIX_DICTIONARY[k] || { name: 'UserCustomTag', desc: 'Custom broker tag definition' };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="tag-badge">Tag ${k}</span></td>
        <td><strong>${info.name}</strong></td>
        <td><code>${v}</code></td>
        <td style="color:var(--text-secondary);">${info.desc}</td>
        <td><span class="status-dot"></span> <span style="font-size:0.7rem; color:var(--accent-emerald);">VALID</span></td>
      `;
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        inspectTag(k, v);
      });
      tableBody.appendChild(tr);
    });
  }

  decodeBtn.addEventListener('click', () => {
    parseAndRenderFIX(fixInput.value);
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.getAttribute('data-sample');
      if (sample) {
        fixInput.value = sample;
        parseAndRenderFIX(sample);
      }
    });
  });

  // Initial parse of default input
  parseAndRenderFIX(fixInput.value);
}
