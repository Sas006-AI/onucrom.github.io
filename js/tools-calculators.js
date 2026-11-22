// ============================================
// ONUCROM TRADING TOOLS CALCULATORS (V2)
// ============================================
(function () {
  "use strict";

  function tk(n) {
    return "Tk " + (Number.isFinite(n) ? n : 0).toFixed(2);
  }

  function pct(n, decimals) {
    var d = typeof decimals === "number" ? decimals : 1;
    return (Number.isFinite(n) ? n : 0).toFixed(d) + "%";
  }

  function num(v) {
    var parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // ----- TOOL DEFINITIONS -----
  var tools = {
    stopLoss: {
      title: "Stop Loss Calculator",
      icon: "fa-stop-circle",
      badge: "risk",
      usesCommission: true,
      fields: [
        { id: "entryPrice", label: "Entry Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 100 },
        { id: "qty", label: "Quantity (Shares)", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 50 },
        { id: "slPercent", label: "Stop Loss %", placeholder: "5", icon: "fa-percent", type: "number", required: true, default: 5 },
        { id: "commPercent", label: "Commission %", placeholder: "0.5", icon: "fa-percent", type: "number", required: false, default: 0.5 }
      ],
      calculate: function (inputs, includeComm) {
        var entry = num(inputs.entryPrice);
        var qty = num(inputs.qty);
        var slPct = num(inputs.slPercent);
        var commPct = includeComm ? num(inputs.commPercent) : 0;

        if (!entry || !slPct) {
          return {
            metrics: [
              { label: "SL Price", value: "—", icon: "fa-flag" },
              { label: "Risk Amount", value: "—", icon: "fa-exclamation-triangle" },
              { label: "Position Value", value: "—", icon: "fa-chart-pie" }
            ],
            verdict: "Enter valid entry price & SL%",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var effectiveQty = qty > 0 ? qty : 1;
        var slPrice = entry * (1 - slPct / 100);
        var posValue = entry * effectiveQty;
        var grossRisk = (entry - slPrice) * effectiveQty;
        var estCommDrag = commPct > 0 ? posValue * (commPct / 100) * 2 : 0;
        var totalRisk = grossRisk + estCommDrag;

        var verdict = "ACTIVE — Place SL order now";
        var verdictClass = "tools-v2-verdict-good";

        if (slPct <= 3) {
          verdictClass = "tools-v2-verdict-bad";
          verdict = "TIGHT — Likely hit by normal volatility";
        } else if (slPct >= 12) {
          verdictClass = "tools-v2-verdict-bad";
          verdict = "WIDE — Position size must allow this loss";
        } else if (slPct >= 8) {
          verdictClass = "tools-v2-verdict-caution";
          verdict = "WIDE — Requires strong conviction";
        }

        return {
          metrics: [
            { label: "SL Price", value: tk(slPrice), icon: "fa-flag" },
            { label: "Risk Amount", value: tk(totalRisk), icon: "fa-exclamation-triangle" },
            { label: "Position Value", value: tk(posValue), icon: "fa-chart-pie" }
          ],
          verdict: verdict + " · Est. risk " + tk(totalRisk),
          verdictClass: verdictClass
        };
      }
    },

    averaging: {
      title: "Averaging Planner",
      icon: "fa-layer-group",
      badge: "average",
      usesCommission: false,
      fields: [
        { id: "avgPrice", label: "Current Avg Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 80 },
        { id: "avgShares", label: "Current Shares", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 100 },
        { id: "newPrice", label: "New Buy Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 70 },
        { id: "newShares", label: "New Shares", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 50 }
      ],
      calculate: function (inputs) {
        var oldP = num(inputs.avgPrice);
        var oldS = num(inputs.avgShares);
        var newP = num(inputs.newPrice);
        var newS = num(inputs.newShares);

        if (!oldP || !oldS || !newP || !newS) {
          return {
            metrics: [
              { label: "New Avg Price", value: "—", icon: "fa-chart-line" },
              { label: "Total Invested", value: "—", icon: "fa-coins" },
              { label: "Total Shares", value: "—", icon: "fa-cubes" }
            ],
            verdict: "Enter current and new position details",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var totalShares = oldS + newS;
        var totalInvested = (oldP * oldS) + (newP * newS);
        var newAvg = totalShares > 0 ? totalInvested / totalShares : 0;
        var isLoweringAvg = newP < oldP;

        return {
          metrics: [
            { label: "New Avg Price", value: tk(newAvg), icon: "fa-chart-line" },
            { label: "Total Invested", value: tk(totalInvested), icon: "fa-coins" },
            { label: "Total Shares", value: String(totalShares), icon: "fa-cubes" }
          ],
          verdict: (isLoweringAvg ? "ACCUMULATE" : "CAUTION") + " · New avg " + tk(newAvg) + " (was " + tk(oldP) + ")",
          verdictClass: isLoweringAvg ? "tools-v2-verdict-good" : "tools-v2-verdict-caution"
        };
      }
    },

    entryExit: {
      title: "Entry Exit Planner",
      icon: "fa-sign-in-alt",
      badge: "R:R",
      usesCommission: false,
      fields: [
        { id: "buyPrice", label: "Buy Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 100 },
        { id: "targetPrice", label: "Target Price", placeholder: "0.00", icon: "fa-bullseye", type: "number", required: true, default: 115 },
        { id: "stopPrice", label: "Stop Price", placeholder: "0.00", icon: "fa-flag", type: "number", required: true, default: 92 },
        { id: "qty", label: "Quantity", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 100 }
      ],
      calculate: function (inputs) {
        var entry = num(inputs.buyPrice);
        var target = num(inputs.targetPrice);
        var stop = num(inputs.stopPrice);
        var qty = num(inputs.qty);

        if (!entry || !target || !stop) {
          return {
            metrics: [
              { label: "R:R Ratio", value: "—", icon: "fa-balance-scale" },
              { label: "Max Profit", value: "—", icon: "fa-arrow-up" },
              { label: "Max Loss", value: "—", icon: "fa-arrow-down" }
            ],
            verdict: "Enter buy, target, and stop prices",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var effectiveQty = qty > 0 ? qty : 1;
        var rewardPerShare = target - entry;
        var riskPerShare = entry - stop;
        var rr = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
        var maxProfit = rewardPerShare * effectiveQty;
        var maxLoss = riskPerShare * effectiveQty;

        var verdict = "MARGINAL — Tighten stop or raise target";
        var verdictClass = "tools-v2-verdict-caution";

        if (target <= entry || stop >= entry || riskPerShare <= 0) {
          verdict = "Check levels — Target should be above buy & stop below buy";
          verdictClass = "tools-v2-verdict-bad";
        } else if (rr >= 3) {
          verdict = "EXCELLENT — Favorable setup";
          verdictClass = "tools-v2-verdict-good";
        } else if (rr >= 2) {
          verdict = "GOOD — Worth considering";
          verdictClass = "tools-v2-verdict-good";
        } else if (rr < 1.5) {
          verdict = "POOR — Reconsider entry";
          verdictClass = "tools-v2-verdict-bad";
        }

        return {
          metrics: [
            { label: "R:R Ratio", value: "1:" + rr.toFixed(1), icon: "fa-balance-scale" },
            { label: "Max Profit", value: tk(maxProfit), icon: "fa-arrow-up" },
            { label: "Max Loss", value: tk(maxLoss), icon: "fa-arrow-down" }
          ],
          verdict: verdict,
          verdictClass: verdictClass
        };
      }
    },

    dividend: {
      title: "Dividend Evaluator",
      icon: "fa-dollar-sign",
      badge: "yield",
      usesCommission: false,
      fields: [
        { id: "currentPrice", label: "Current Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 150 },
        { id: "sharesQty", label: "Shares Quantity", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 200 },
        { id: "divPerShare", label: "Dividend / Share", placeholder: "0.00", icon: "fa-hand-holding-usd", type: "number", required: true, default: 6.5 },
        { id: "taxRate", label: "Tax Rate %", placeholder: "10", icon: "fa-percent", type: "number", required: true, default: 10 }
      ],
      calculate: function (inputs) {
        var price = num(inputs.currentPrice);
        var shares = num(inputs.sharesQty);
        var div = num(inputs.divPerShare);
        var taxRate = num(inputs.taxRate);

        if (!price || !div) {
          return {
            metrics: [
              { label: "Net Annual Yield", value: "—", icon: "fa-percent" },
              { label: "Net Annual Income", value: "—", icon: "fa-money-bill-wave" },
              { label: "Net / Share", value: "—", icon: "fa-wallet" }
            ],
            verdict: "Enter current price & dividend per share",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var effectiveShares = shares > 0 ? shares : 1;
        var netDivPerShare = div * (1 - taxRate / 100);
        var netYield = (netDivPerShare / price) * 100;
        var netIncome = netDivPerShare * effectiveShares;

        var verdict = "MODERATE — Factor in price risk";
        var verdictClass = "tools-v2-verdict-caution";

        if (netYield >= 5) {
          verdict = "ATTRACTIVE — Consider holding";
          verdictClass = "tools-v2-verdict-good";
        } else if (netYield < 3) {
          verdict = "LOW — Price appreciation matters more";
          verdictClass = "tools-v2-verdict-bad";
        }

        return {
          metrics: [
            { label: "Net Annual Yield", value: pct(netYield), icon: "fa-percent" },
            { label: "Net Annual Income", value: tk(netIncome), icon: "fa-money-bill-wave" },
            { label: "Net / Share", value: tk(netDivPerShare), icon: "fa-wallet" }
          ],
          verdict: verdict + " · Net yield " + pct(netYield),
          verdictClass: verdictClass
        };
      }
    },

    switching: {
      title: "Stock Switching",
      icon: "fa-exchange-alt",
      badge: "switch",
      usesCommission: false,
      fields: [
        { id: "stockABuyPrice", label: "Stock A Buy Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 100 },
        { id: "stockACurrentPrice", label: "Stock A Current Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 90 },
        { id: "stockAQty", label: "Stock A Quantity", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 50 },
        { id: "stockBCurrentPrice", label: "Stock B Current Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 80 },
        { id: "expectedGain", label: "Expected Gain % (B)", placeholder: "10", icon: "fa-percent", type: "number", required: false, default: 10 }
      ],
      calculate: function (inputs) {
        var aBuy = num(inputs.stockABuyPrice);
        var aCur = num(inputs.stockACurrentPrice);
        var aQty = num(inputs.stockAQty);
        var bPrice = num(inputs.stockBCurrentPrice);
        var bGain = num(inputs.expectedGain);

        if (!aBuy || !aCur || !aQty || !bPrice) {
          return {
            metrics: [
              { label: "Proceeds", value: "—", icon: "fa-coins" },
              { label: "New B Shares", value: "—", icon: "fa-chart-bar" },
              { label: "Gain Needed %", value: "—", icon: "fa-arrow-up" }
            ],
            verdict: "Enter Stock A and Stock B details",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var proceeds = aCur * aQty;
        var bShares = Math.floor(proceeds / bPrice);
        var gainNeeded = ((aBuy / bPrice) - 1) * 100;

        var verdict = "WAIT — Partial recovery only";
        var verdictClass = "tools-v2-verdict-caution";

        if (bGain >= gainNeeded) {
          verdict = "SWITCH — Target covers loss (" + pct(bGain) + " vs " + pct(gainNeeded) + " needed)";
          verdictClass = "tools-v2-verdict-good";
        } else if (bGain < gainNeeded * 0.5) {
          verdict = "HOLD — Switch does not recover (" + pct(bGain) + " vs " + pct(gainNeeded) + " needed)";
          verdictClass = "tools-v2-verdict-bad";
        } else {
          verdict = "WAIT — Need " + pct(gainNeeded) + " on B vs " + pct(bGain) + " expected";
        }

        return {
          metrics: [
            { label: "Proceeds", value: tk(proceeds), icon: "fa-coins" },
            { label: "New B Shares", value: String(bShares), icon: "fa-chart-bar" },
            { label: "Gain Needed %", value: pct(gainNeeded), icon: "fa-arrow-up" }
          ],
          verdict: verdict,
          verdictClass: verdictClass
        };
      }
    },

    breakEven: {
      title: "Break Even Calculator",
      icon: "fa-arrow-up",
      badge: "comm",
      usesCommission: true,
      fields: [
        { id: "beBuyPrice", label: "Buy Price", placeholder: "0.00", icon: "fa-tag", type: "number", required: true, default: 250 },
        { id: "beQty", label: "Quantity", placeholder: "0", icon: "fa-cubes", type: "number", required: true, default: 30 },
        { id: "commPercent", label: "Commission %", placeholder: "0.5", icon: "fa-percent", type: "number", required: false, default: 0.5 }
      ],
      calculate: function (inputs, includeComm) {
        var buy = num(inputs.beBuyPrice);
        var qty = num(inputs.beQty);
        var comm = includeComm ? num(inputs.commPercent) / 100 : 0;

        if (!buy || !qty) {
          return {
            metrics: [
              { label: "Total Cost", value: "—", icon: "fa-shopping-cart" },
              { label: "Break Even Price", value: "—", icon: "fa-balance-scale" },
              { label: "Required Gain %", value: "—", icon: "fa-chart-line" }
            ],
            verdict: "Enter buy price and quantity",
            verdictClass: "tools-v2-verdict-caution"
          };
        }

        var buyCost = buy * qty;
        var buyComm = buyCost * comm;
        var totalCost = buyCost + buyComm;
        var denom = qty * (1 - comm);
        var bePrice = denom > 0 ? totalCost / denom : 0;
        var reqGainPct = ((bePrice / buy) - 1) * 100;

        var isLowCost = reqGainPct <= 1;

        return {
          metrics: [
            { label: "Total Cost", value: tk(totalCost), icon: "fa-shopping-cart" },
            { label: "Break Even Price", value: tk(bePrice), icon: "fa-balance-scale" },
            { label: "Required Gain %", value: pct(reqGainPct), icon: "fa-chart-line" }
          ],
          verdict: (isLowCost ? "LOW COST — Easy to break even" : "WATCH — Higher commission drag") + " · Sell above " + tk(bePrice),
          verdictClass: isLowCost ? "tools-v2-verdict-good" : "tools-v2-verdict-caution"
        };
      }
    }
  };

  // ----- DOM REFERENCES -----
  var pillContainer = document.getElementById("pillContainer");
  var dynamicFields = document.getElementById("dynamicFields");
  var panelIcon = document.getElementById("panelIcon");
  var panelTitle = document.getElementById("panelTitle");
  var panelBadge = document.getElementById("panelBadge");
  var resultGrid = document.getElementById("resultGrid");
  var resultBadge = document.getElementById("resultBadge");
  var verdictBadge = document.getElementById("verdictBadge");
  var verdictText = document.getElementById("verdictText");
  var includeCommCheckbox = document.getElementById("includeCommission");
  var optionalCheckboxRow = document.getElementById("optionalCheckboxRow");

  var currentToolKey = "stopLoss";

  function renderInputs(toolKey) {
    var tool = tools[toolKey];
    if (!tool || !dynamicFields) return;

    if (panelTitle) panelTitle.textContent = tool.title;
    if (panelIcon) panelIcon.className = "fas " + tool.icon;
    if (panelBadge) panelBadge.textContent = tool.badge || "tool";

    if (optionalCheckboxRow) {
      optionalCheckboxRow.style.display = tool.usesCommission ? "" : "none";
    }

    var html = "";
    tool.fields.forEach(function (f) {
      var badgeLabel = f.required
        ? '<span class="tools-v2-optional">required</span>'
        : '<span class="tools-v2-optional">optional</span>';
      var defaultVal = f.default !== undefined ? f.default : "";

      html +=
        '<div class="tools-v2-field-group">' +
          '<label for="field-' + f.id + '">' + f.label + " " + badgeLabel + "</label>" +
          '<div class="tools-v2-input-wrapper">' +
            '<i class="fas ' + f.icon + '"></i>' +
            '<input type="' + f.type + '" id="field-' + f.id + '" placeholder="' + f.placeholder + '" value="' + defaultVal + '" step="any">' +
          "</div>" +
        "</div>";
    });

    dynamicFields.innerHTML = html;
    calculateAndDisplay();
  }

  function calculateAndDisplay() {
    var tool = tools[currentToolKey];
    if (!tool || !resultGrid) return;

    var inputs = {};
    tool.fields.forEach(function (f) {
      var el = document.getElementById("field-" + f.id);
      if (el) inputs[f.id] = el.value;
    });

    var includeComm = includeCommCheckbox ? !!includeCommCheckbox.checked : false;
    var result;

    try {
      result = tool.calculate(inputs, includeComm);
    } catch (err) {
      result = {
        metrics: [{ label: "Error", value: "—", icon: "fa-exclamation-circle" }],
        verdict: "Calculation error",
        verdictClass: "tools-v2-verdict-bad"
      };
    }

    if (!result.metrics || result.metrics.length === 0) {
      resultGrid.innerHTML =
        '<div class="tools-v2-placeholder"><i class="fas fa-chart-simple"></i> No results</div>';
    } else {
      resultGrid.innerHTML = result.metrics
        .map(function (m) {
          return (
            '<div class="tools-v2-metric-card">' +
              '<span class="tools-v2-metric-label"><i class="fas ' + m.icon + '"></i> ' + m.label + "</span>" +
              '<span class="tools-v2-metric-value">' + m.value + "</span>" +
            "</div>"
          );
        })
        .join("");
    }

    if (verdictText) {
      verdictText.textContent = result.verdict || "Ready";
    }

    if (verdictBadge) {
      verdictBadge.className = "tools-v2-verdict-badge " + (result.verdictClass || "");
    }

    if (resultBadge) {
      resultBadge.textContent = "live";
    }
  }

  function setActiveTool(toolKey) {
    if (!tools[toolKey]) return;

    document.querySelectorAll(".tools-v2-pill").forEach(function (pill) {
      pill.classList.toggle("active", pill.getAttribute("data-tool") === toolKey);
    });

    currentToolKey = toolKey;
    renderInputs(toolKey);
  }

  // ----- EVENT BINDING -----
  if (pillContainer) {
    pillContainer.addEventListener("click", function (e) {
      var pill = e.target.closest(".tools-v2-pill");
      if (!pill) return;
      var toolKey = pill.getAttribute("data-tool");
      if (toolKey) setActiveTool(toolKey);
    });
  }

  if (dynamicFields) {
    dynamicFields.addEventListener("input", function (e) {
      if (e.target && e.target.tagName === "INPUT") {
        calculateAndDisplay();
      }
    });
  }

  if (includeCommCheckbox) {
    includeCommCheckbox.addEventListener("change", calculateAndDisplay);
  }

  function init() {
    setActiveTool("stopLoss");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API for external hooks if needed
  window.OnucromToolsV2 = {
    selectTool: setActiveTool,
    recalculate: calculateAndDisplay,
    tools: tools
  };
})();