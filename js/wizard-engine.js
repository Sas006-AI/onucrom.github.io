// ============================================
// ONUCROM WIZARD ENGINE — GLOBAL FUNCTIONS
// ============================================
var currentStep = 1;
var totalSteps = 4;
var activeFlags = {};

var SLOGANS = [
  "In investing, knowing risk always comes before calculating return.",
  "If the structure is opaque, your capital is vulnerable.",
  "High pressure and secrecy are the twin pillars of financial scams.",
  "Never test the depth of the river with both feet."
];

function selectPill(btn, hiddenInputId, val) {
  var parent = btn.parentElement;
  var pills = parent.querySelectorAll(".pill-btn");
  for (var i = 0; i < pills.length; i++) { 
    pills[i].classList.remove("active"); 
  }
  btn.classList.add("active");
  document.getElementById(hiddenInputId).value = val;
}

function toggleFlagPill(btn, flagKey) {
  btn.classList.toggle("selected");
  activeFlags[flagKey] = btn.classList.contains("selected");
}

function navigateWizard(dir) {
  if (dir === 1 && currentStep === 1) {
    var name = document.getElementById("inv-name").value.trim();
    if (!name) { 
      alert("Please enter an investment name."); 
      return; 
    }
  }

  document.getElementById("wiz-step-" + currentStep).style.display = "none";
  currentStep += dir;

  if (currentStep > totalSteps) {
    calculateFinalRisk();
    return;
  }

  document.getElementById("wiz-step-" + currentStep).style.display = "block";
  document.getElementById("wiz-progress").style.width = (currentStep / totalSteps * 100) + "%";
  document.getElementById("wiz-slogan").innerText = '"' + SLOGANS[currentStep - 1] + '"';

  document.getElementById("wiz-prev-btn").style.display = currentStep > 1 ? "block" : "none";
  if (currentStep === totalSteps) {
    document.getElementById("wiz-next-btn").innerText = "Calculate Risk Score ✓";
  } else {
    document.getElementById("wiz-next-btn").innerText = "Next Step →";
  }
}

function calculateFinalRisk() {
  document.getElementById("wiz-slogan").style.display = "none";
  document.getElementById("wiz-nav").style.display = "none";
  document.getElementById("wiz-step-results").style.display = "block";
  document.getElementById("wiz-progress").style.width = "100%";

  var score = 0;
  var flagCount = 0;

  var keys = Object.keys(activeFlags);
  for (var i = 0; i < keys.length; i++) {
    if (activeFlags[keys[i]]) {
      flagCount++;
      score += 12;
    }
  }

  var expReturn = parseFloat(document.getElementById("inv-return").value) || 0;
  if (expReturn > 30) { score += 30; }
  else if (expReturn > 18) { score += 15; }

  var freq = document.getElementById("inv-freq-val").value;
  if (freq === "Daily") { score += 20; }

  var lossPolicy = document.getElementById("inv-loss-policy").value;
  if (lossPolicy === "guaranteed_back") { score += 20; }
  if (lossPolicy === "unclear") { score += 10; }

  score = Math.min(score, 100);

  var badgeClass = "v-good";
  var verdict = "Realistic Plan (Low Risk)";

  if (score >= 55) {
    badgeClass = "v-bad"; 
    verdict = "Critical Risk / Severe Red Flags";
  } else if (score >= 25) {
    badgeClass = "v-caution"; 
    verdict = "Moderate Risk / Proceed Carefully";
  }

  var badgeHTML = '<span class="verdict-badge ' + badgeClass + '" style="font-size:1rem; padding: 10px 16px;">' + verdict + '</span>';
  document.getElementById("inv-badge-container").innerHTML = badgeHTML;

  var breakdownHTML = "";
  breakdownHTML += '<div class="res-item"><span class="res-label">Overall Risk Score:</span><span class="res-val">' + score + ' / 100</span></div>';
  breakdownHTML += '<div class="res-item"><span class="res-label">Active Red Flags:</span><span class="res-val">' + flagCount + ' Flags</span></div>';
  breakdownHTML += '<div class="res-item"><span class="res-label">Target Return:</span><span class="res-val">' + expReturn + '% (' + freq + ')</span></div>';
  document.getElementById("inv-score-breakdown").innerHTML = breakdownHTML;
}

function resetWizard() {
  currentStep = 1;
  var keys = Object.keys(activeFlags);
  for (var i = 0; i < keys.length; i++) { 
    activeFlags[keys[i]] = false; 
  }
  var toggles = document.querySelectorAll(".toggle-pill");
  for (var i = 0; i < toggles.length; i++) { 
    toggles[i].classList.remove("selected"); 
  }
  document.getElementById("wiz-step-results").style.display = "none";
  document.getElementById("wiz-step-1").style.display = "block";
  document.getElementById("wiz-slogan").style.display = "block";
  document.getElementById("wiz-nav").style.display = "flex";
  document.getElementById("wiz-progress").style.width = "25%";
  document.getElementById("wiz-slogan").innerText = '"' + SLOGANS[0] + '"';
  document.getElementById("wiz-prev-btn").style.display = "none";
  document.getElementById("wiz-next-btn").innerText = "Next Step →";
}