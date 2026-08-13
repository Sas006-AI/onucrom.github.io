// ============================================
// ONUCROM TRADING TOOLS CALCULATORS
// ============================================
(function() {
  function tk(n) { return "Tk " + (n || 0).toFixed(2); }
  function pct(n) { return (n || 0).toFixed(1) + "%"; }
  function set(id, html) { document.getElementById(id).innerHTML = html; }
  function val(id) { return parseFloat(document.getElementById(id).value) || 0; }
  function setVerdict(id, text, cls) {
    var el = document.getElementById(id);
    el.innerHTML = text;
    el.className = "verdict-text " + cls;
  }

  function calcSL() {
    var price = val("sl-price"); 
    var qty = val("sl-qty"); 
    var pctVal = val("sl-pct");
    if (!price || !pctVal) {
      set("sl-avg", "—"); 
      set("sl-price-res", "—"); 
      set("sl-risk", "—");
      setVerdict("sl-verdict", "Enter values", "verdict-caution");
      set("sl-exp-risk", "Risk will show here"); 
      return;
    }
    var stop = price * (1 - pctVal/100); 
    var risk = (price - stop) * (qty || 1);
    set("sl-avg", tk(price)); 
    set("sl-price-res", tk(stop)); 
    set("sl-risk", tk(risk));
    var note = "Moderate stop. Typical for BD swing trades."; 
    var cls = "verdict-caution";
    if (pctVal <= 3) { cls = "verdict-bad"; note = "TIGHT — Likely hit by normal volatility"; }
    else if (pctVal >= 12) { cls = "verdict-bad"; note = "WIDE — Position size must allow this loss"; }
    else if (pctVal >= 8) { cls = "verdict-caution"; note = "WIDE — Requires conviction"; }
    else { cls = "verdict-good"; note = "ACTIVE — Place SL order now"; }
    setVerdict("sl-verdict", note, cls); 
    set("sl-exp-risk", "Maintain risk: " + tk(risk));
  }

  function calcAvg() {
    var oq = val("avg-old-qty"); 
    var op = val("avg-old-price");
    var nq = val("avg-new-qty"); 
    var np = val("avg-new-price");
    if (!oq || !op || !nq || !np) {
      set("avg-price", "—"); 
      set("avg-shares", "—"); 
      set("avg-invested", "—");
      setVerdict("avg-verdict", "Enter values", "verdict-caution");
      set("avg-exp-1", "New Avg Price will show here");
      set("avg-exp-2", "Total Invested will show here");
      set("avg-exp-3", "Break-Even will show here"); 
      return;
    }
    var oldCost = oq * op; 
    var newCost = nq * np;
    var total = oldCost + newCost; 
    var tq = oq + nq; 
    var avg = total / tq;
    var cls = np < op ? "verdict-good" : "verdict-caution";
    var verb = np < op ? "ACCUMULATE" : "CAUTION";
    set("avg-price", tk(avg)); 
    set("avg-shares", tq); 
    set("avg-invested", tk(total));
    setVerdict("avg-verdict", verb, cls);
    set("avg-exp-1", "New Avg: " + tk(avg) + " (was " + tk(op) + ")");
    set("avg-exp-2", "Total Invested: " + tk(total));
    set("avg-exp-3", "Break-Even: " + tk(avg));
  }

  function calcEE() {
    var entry = val("ee-entry"); 
    var target = val("ee-target");
    var stop = val("ee-stop"); 
    var qty = val("ee-qty");
    if (!entry || !target || !stop) {
      set("ee-rr", "—"); 
      set("ee-profit", "—"); 
      set("ee-loss", "—");
      setVerdict("ee-verdict", "Enter values", "verdict-caution");
      set("ee-exp-1", "R:R will show here");
      set("ee-exp-2", "Target and stop levels will show here"); 
      return;
    }
    var profit = target - entry; 
    var loss = entry - stop;
    var rr = loss > 0 ? profit / loss : 0;
    var profitAmt = profit * (qty || 1); 
    var lossAmt = loss * (qty || 1);
    set("ee-rr", "1:" + rr.toFixed(1)); 
    set("ee-profit", tk(profitAmt)); 
    set("ee-loss", tk(lossAmt));
    var cls = "verdict-caution"; 
    var note = "MARGINAL — Tighten stop or raise target";
    if (rr >= 3) { cls = "verdict-good"; note = "EXCELLENT — Favorable setup"; }
    else if (rr >= 2) { cls = "verdict-good"; note = "GOOD — Worth considering"; }
    else if (rr < 1.5) { cls = "verdict-bad"; note = "POOR — Reconsider entry"; }
    setVerdict("ee-verdict", note, cls);
    set("ee-exp-1", "R:R = 1:" + rr.toFixed(1) + " | Target: " + tk(target) + " | Stop: " + tk(stop));
    set("ee-exp-2", "Set SL at " + tk(stop) + ", target " + tk(target));
  }

  function calcDiv() {
    var price = val("div-price"); 
    var qty = val("div-qty");
    var div = val("div-amount"); 
    var tax = val("div-tax") / 100;
    if (!price || !div) {
      set("div-yield", "—"); 
      set("div-income", "—"); 
      set("div-net", "—");
      setVerdict("div-verdict", "Enter values", "verdict-caution");
      set("div-exp-1", "Yield will show here");
      set("div-exp-2", "Tax impact will show here"); 
      return;
    }
    var netDiv = div * (1 - tax); 
    var yieldPct = (netDiv / price) * 100; 
    var income = netDiv * (qty || 1);
    set("div-yield", pct(yieldPct)); 
    set("div-income", tk(income)); 
    set("div-net", tk(netDiv) + "/share");
    var cls = "verdict-caution"; 
    var note = "MODERATE — Factor in price risk";
    if (yieldPct >= 5) { cls = "verdict-good"; note = "ATTRACTIVE — Consider holding"; }
    else if (yieldPct < 3) { cls = "verdict-bad"; note = "LOW — Price appreciation matters more"; }
    setVerdict("div-verdict", note, cls);
    set("div-exp-1", "Yield: " + pct(yieldPct) + " after " + (tax*100).toFixed(0) + "% tax");
    set("div-exp-2", "Reinvest dividends for compounding growth");
  }

  function calcSw() {
    var aBuy = val("sw-a-buy"); 
    var aCur = val("sw-a-cur");
    var aQty = val("sw-a-qty"); 
    var bPrice = val("sw-b-price"); 
    var bGain = val("sw-b-gain");
    if (!aBuy || !aCur || !aQty || !bPrice || !bGain) {
      set("sw-proceeds", "—"); 
      set("sw-b-shares", "—"); 
      set("sw-needed", "—");
      setVerdict("sw-verdict", "Enter values", "verdict-caution");
      set("sw-exp-1", "Shows if switching recovers the loss");
      set("sw-exp-2", "Compares hold vs switch scenarios"); 
      return;
    }
    var aLoss = (aBuy - aCur) * aQty; 
    var proceeds = aCur * aQty;
    var bQty = Math.floor(proceeds / bPrice);
    var bTarget = bPrice * (1 + bGain/100); 
    var bNeeded = (aBuy / bPrice - 1) * 100;
    set("sw-proceeds", tk(proceeds)); 
    set("sw-b-shares", bQty); 
    set("sw-needed", pct(bNeeded));
    var cls = "verdict-caution"; 
    var note = "WAIT — Partial recovery only";
    if (bGain >= bNeeded) { cls = "verdict-good"; note = "SWITCH — Target covers loss"; }
    else if (bGain < bNeeded * 0.5) { cls = "verdict-bad"; note = "HOLD — Switch does not recover"; }
    setVerdict("sw-verdict", note, cls);
    set("sw-exp-1", "Stock A loss: " + tk(aLoss) + " | Need " + pct(bNeeded) + " on B");
    set("sw-exp-2", "Cash ready: " + tk(proceeds) + " | Monitor B entry at " + tk(bPrice));
  }

  function calcBE() {
    var buy = val("be-buy"); 
    var qty = val("be-qty"); 
    var comm = val("be-comm") / 100;
    if (!buy || !qty) {
      set("be-cost", "—"); 
      set("be-price", "—"); 
      set("be-pct", "—");
      setVerdict("be-verdict", "Enter values", "verdict-caution");
      set("be-exp-1", "Round-trip commission included");
      set("be-exp-2", "Must sell above break-even to profit"); 
      return;
    }
    var buyCost = buy * qty; 
    var buyComm = buyCost * comm; 
    var total = buyCost + buyComm;
    var be = total / (qty * (1 - comm)); 
    var bePct = ((be - buy) / buy) * 100;
    var roundTrip = buyCost * comm * 2;
    set("be-cost", tk(total)); 
    set("be-price", tk(be)); 
    set("be-pct", pct(bePct));
    var cls = bePct <= 1 ? "verdict-good" : "verdict-caution";
    var note = bePct <= 1 ? "LOW COST — Easy to break even" : "WATCH — Higher commission drag";
    setVerdict("be-verdict", note, cls);
    set("be-exp-1", "Round-trip commission: " + tk(roundTrip));
    set("be-exp-2", "Sell above " + tk(be) + " to make profit");
  }

  // Expose to global scope
  window.calcSL = calcSL;
  window.calcAvg = calcAvg;
  window.calcEE = calcEE;
  window.calcDiv = calcDiv;
  window.calcSw = calcSw;
  window.calcBE = calcBE;
})();