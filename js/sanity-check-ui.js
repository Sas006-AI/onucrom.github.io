// ============================================
// SANITY CHECK ? UI CONTROLLER
// ============================================
var SanityCheck = (function() {
  var API_URL = 'YOUR_SCRIPT_URL_HERE'; // Replace with your deployed web app URL
  var assessmentData = {};

  function init() {
    SanityDB.init(API_URL);
  }

  function search() {
    var name = document.getElementById('searchName').value.trim();
    if (!name) {
      document.getElementById('dbResult').innerHTML = '<div class="alert alert-caution mt-12">Please enter an investment name.</div>';
      return;
    }

    var result = SanityDB.checkName(name);
    var resultDiv = document.getElementById('dbResult');

    if (result.found === 'flagged') {
      resultDiv.innerHTML = 
        '<div class="alert alert-warning mt-12">' +
        '<strong>?? WARNING: Database Match</strong><br>' +
        'This matches an entry in our flagged investment database. Onucrom has received concerning reports about this entity.' +
        '</div>';
    } else if (result.found === 'listed') {
      resultDiv.innerHTML = 
        '<div class="alert alert-pass mt-12">' +
        '<strong>? Found in Onucrom Database</strong><br>' +
        '"' + result.data.name + '" is listed on Onucrom.<br>' +
        'Status: ' + (result.data.status || 'Listed') + ' | Verification: ' + (result.data.verification_tier || 'Basic') +
        '</div>' +
        '<button class="btn btn-secondary mt-12" onclick="SanityCheck.showEvalForm()">Continue Evaluation Anyway ?</button>';
    } else {
      resultDiv.innerHTML = 
        '<div class="alert alert-pass mt-12">' +
        '<strong>? Not in our database</strong><br>' +
        'This investment is not currently listed on Onucrom. Evaluate below.' +
        '</div>' +
        '<button class="btn mt-12" onclick="SanityCheck.showEvalForm()">Continue to Evaluation ?</button>';
    }
  }

  function showEvalForm() {
    document.getElementById('evalForm').classList.remove('hidden');
    document.getElementById('evalForm').scrollIntoView({ behavior: 'smooth' });
  }

  function getRadio(name) {
    var radios = document.getElementsByName(name);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return '';
  }

  function collectData() {
    return {
      name: document.getElementById('invName') ? document.getElementById('invName').value : '',
      desc: document.getElementById('invDesc') ? document.getElementById('invDesc').value : '',
      sector: document.getElementById('invSector') ? document.getElementById('invSector').value : '',
      firm: document.getElementById('invFirm') ? document.getElementById('invFirm').value : '',
      source: document.getElementById('invSource') ? document.getElementById('invSource').value : '',
      type: document.getElementById('invType') ? document.getElementById('invType').value : '',
      minAmt: parseFloat(document.getElementById('invMinAmt') ? document.getElementById('invMinAmt').value : 0) || 0,
      returnPct: parseFloat(document.getElementById('invReturn') ? document.getElementById('invReturn').value : 0) || 0,
      returnPeriod: document.getElementById('invReturnPeriod') ? document.getElementById('invReturnPeriod').value : '',
      guarantee: document.getElementById('invGuarantee') ? document.getElementById('invGuarantee').value : '',
      tenor: parseFloat(document.getElementById('invTenor') ? document.getElementById('invTenor').value : 0) || 0,
      tenorUnit: document.getElementById('invTenorUnit') ? document.getElementById('invTenorUnit').value : '',
      returnStart: document.getElementById('invReturnStart') ? document.getElementById('invReturnStart').value : '',
      rfPressure: getRadio('rfPressure'),
      rfVague: getRadio('rfVague'),
      rfDocs: getRadio('rfDocs'),
      rfPhysical: getRadio('rfPhysical'),
      rfRegistration: getRadio('rfRegistration'),
      rfReturnLogic: getRadio('rfReturnLogic'),
      rfBankLoan: getRadio('rfBankLoan'),
      rfVerify: getRadio('rfVerify'),
      rfAgreement: getRadio('rfAgreement')
    };
  }

  function evaluate() {
    var data = collectData();
    assessmentData = data;

    var result = SanityScore.evaluate(data);

    var html = '<div class="result-card">';
    
    // Score display
    html += '<div class="score-display">';
    html += '<div class="score-number ' + result.labelClass + '">' + result.score + '/100</div>';
    html += '<div class="score-label ' + result.labelClass + '">' + result.label + '</div>';
    html += '</div>';

    // Passes
    if (result.passes.length > 0) {
      html += '<div class="alert alert-pass"><strong>? What Passed</strong><br>';
      for (var i = 0; i < result.passes.length; i++) {
        html += '? ' + result.passes[i] + '<br>';
      }
      html += '</div>';
    }

    // Cautions
    if (result.cautions.length > 0) {
      html += '<div class="alert alert-caution"><strong>? Needs Investigation</strong><br>';
      for (var i = 0; i < result.cautions.length; i++) {
        html += '? ' + result.cautions[i] + '<br>';
      }
      html += '</div>';
    }

    // Warnings
    if (result.warnings.length > 0) {
      html += '<div class="alert alert-warning"><strong>? Critical Warnings</strong><br>';
      for (var i = 0; i < result.warnings.length; i++) {
        html += '? ' + result.warnings[i] + '<br>';
      }
      html += '</div>';
    }

    // Assessor note
    html += '<div class="assessor-note"><strong>???? Assessor\'s Note:</strong> ' + result.note + '</div>';
    
    html += '<p style="font-size:0.75rem;color:var(--muted);margin-top:16px">';
    html += 'This is not a certification. It is an assessment based on what you shared. Always conduct independent due diligence.</p>';
    html += '</div>';

    document.getElementById('resultsPanel').innerHTML = html;
    document.getElementById('resultsPanel').classList.remove('hidden');
    document.getElementById('submissionPanel').classList.remove('hidden');
    document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth' });
  }

  function submitToDb() {
    var submitRole = getRadio('submitRole') || 'investee';
    assessmentData.submitter_role = submitRole;
    
    SanityDB.submit(assessmentData).then(function(result) {
      var panel = document.getElementById('submissionPanel');
      if (result.success) {
        panel.innerHTML = '<div class="alert alert-pass"><strong>? Submitted Successfully</strong><br>Thank you. Your submission helps build Bangladesh\'s investment transparency.</div>';
      } else {
        panel.innerHTML = '<div class="alert alert-caution"><strong>?? Submission Unavailable</strong><br>Could not reach database. Your assessment is still valid. Try again later.</div>';
      }
    });
  }

  // Public API
  return {
    init: init,
    search: search,
    showEvalForm: showEvalForm,
    evaluate: evaluate,
    submitToDb: submitToDb
  };
})();