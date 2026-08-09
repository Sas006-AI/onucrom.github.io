// ============================================
// SANITY CHECK ? SCORING ENGINE
// ============================================
var SanityScore = (function() {

  function evaluate(data) {
    var totalPoints = 0;
    var maxPoints = 0;
    var warnings = [];
    var cautions = [];
    var passes = [];

    // --- RETURN REASONABILITY (20 pts) ---
    maxPoints += 20;
    if (data.returnPct > 0) {
      var annualReturn = data.returnPeriod === 'per month' ? data.returnPct * 12 : 
                         data.returnPeriod === 'over full period' ? data.returnPct / (data.tenor || 1) : 
                         data.returnPct;
      if (annualReturn <= 10) {
        totalPoints += 20;
        passes.push('Return of ' + annualReturn.toFixed(1) + '% is within reasonable range for Bangladesh market');
      } else if (annualReturn <= 15) {
        totalPoints += 12;
        cautions.push('Return of ' + annualReturn.toFixed(1) + '% is above bank FDR (6-8%) but possible for equity investments');
      } else if (annualReturn <= 24) {
        totalPoints += 6;
        cautions.push('Return of ' + annualReturn.toFixed(1) + '% demands strong evidence of underlying business viability');
      } else {
        warnings.push('CRITICAL: ' + annualReturn.toFixed(1) + '% annual return. Top 1% of businesses globally. Extreme skepticism warranted.');
      }
    }

    // --- GUARANTEE + EQUITY CONFLICT (15 pts) ---
    maxPoints += 15;
    if (data.guarantee === 'Guaranteed / Promised' && data.type.indexOf('Equity') > -1) {
      warnings.push('CONTRADICTION: Equity cannot have guaranteed returns. This is either debt mislabeled or a fundamental misunderstanding.');
    } else if (data.guarantee === 'Guaranteed / Promised') {
      totalPoints += 5;
      cautions.push('Guaranteed returns claimed ? verify what legally backs this guarantee');
    } else if (data.guarantee === 'Projected / Expected') {
      totalPoints += 12;
      passes.push('Returns are projected, not guaranteed ? honest representation');
    }

    // --- FIRM STRUCTURE (15 pts) ---
    maxPoints += 15;
    if (data.firm.indexOf('Private Limited') > -1 || data.firm.indexOf('Public Limited') > -1) {
      totalPoints += 15;
      passes.push('Registered limited company ? legal protections exist for investors');
    } else if (data.firm === 'Partnership Firm') {
      totalPoints += 8;
      cautions.push('Partnership firm ? fewer investor protections than a limited company');
    } else if (data.firm === 'Sole Proprietorship') {
      totalPoints += 4;
      cautions.push('Sole proprietorship ? your legal recourse is limited if things go wrong');
    } else if (data.firm === 'Unclear / Not Sure' || data.firm === 'Individual (person, not entity)') {
      warnings.push('CRITICAL: Unclear or individual entity means almost no legal protection for your investment');
    }

    // --- DEPOSIT SCHEME CHECK (10 pts) ---
    maxPoints += 10;
    if (data.type === 'Deposit Scheme' && data.firm.indexOf('Bank') === -1 && data.firm.indexOf('NBFI') === -1) {
      warnings.push('LEGAL RISK: Unregistered deposit-taking is illegal in Bangladesh. Only scheduled banks and licensed NBFIs can accept public deposits.');
    } else {
      totalPoints += 10;
    }

    // --- DOCUMENTATION (10 pts) ---
    maxPoints += 10;
    if (data.rfDocs && data.rfDocs.indexOf('Yes') > -1) {
      totalPoints += 10;
      passes.push('Proper documentation provided ? positive signal');
    } else if (data.rfDocs && data.rfDocs.indexOf('Some') > -1) {
      totalPoints += 5;
      cautions.push('Incomplete documentation ? request full set before committing any funds');
    } else if (data.rfDocs && data.rfDocs.indexOf('No') > -1) {
      warnings.push('No documentation shown ? no legitimate investment proceeds without paperwork');
    }

    // --- BANK LOAN LOGIC (10 pts) ---
    maxPoints += 10;
    if (data.rfBankLoan && data.rfBankLoan.indexOf('Reasonable') > -1) {
      totalPoints += 10;
      passes.push('Valid reason for seeking investor capital instead of bank financing');
    } else if (data.rfBankLoan && data.rfBankLoan.indexOf('Some') > -1) {
      totalPoints += 5;
      cautions.push('The bank loan question has partial answers ? probe deeper before committing');
    } else if (data.rfBankLoan && data.rfBankLoan.indexOf('No good') > -1) {
      warnings.push('No explanation for why bank financing was not used. This question unravels most bad investments.');
    }

    // --- URGENCY (5 pts) ---
    maxPoints += 5;
    if (data.rfPressure && data.rfPressure.indexOf('No pressure') > -1) {
      totalPoints += 5;
      passes.push('No urgency pressure ? professional approach');
    } else if (data.rfPressure && data.rfPressure.indexOf('urgent') > -1) {
      warnings.push('Urgency is a manipulation tactic, not an investment feature. Real opportunities allow time for due diligence.');
    }

    // --- SOURCE CHANNEL (5 pts) ---
    maxPoints += 5;
    if (data.source && data.source.indexOf('WhatsApp') > -1) {
      cautions.push('WhatsApp-forwarded investments have higher fraud incidence in Bangladesh ? verify independently through official channels');
    } else {
      totalPoints += 5;
    }

    // --- RETURN START TIMING (5 pts) ---
    maxPoints += 5;
    if (data.returnStart && data.returnStart.indexOf('Immediately') > -1) {
      cautions.push('Immediate returns from a business investment are structurally unusual ? classic characteristic of Ponzi schemes');
    } else {
      totalPoints += 5;
    }

    // --- REGULATORY REGISTRATION (5 pts) ---
    maxPoints += 5;
    if (data.rfRegistration && data.rfRegistration.indexOf('Yes') > -1) {
      totalPoints += 5;
      passes.push('Regulatory registration confirmed');
    } else if (data.rfRegistration && data.rfRegistration.indexOf('Claim') > -1) {
      totalPoints += 2;
      cautions.push('Registration claimed but not independently verified ? verify with RJSC/Bangladesh Bank/BSEC directly');
    } else if (data.rfRegistration && data.rfRegistration.indexOf('No') > -1) {
      warnings.push('No regulatory registration ? limited legal recourse if investment fails');
    }

    // Calculate final score
    var score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    
    var label, labelClass;
    if (score >= 80) { label = 'LOW CONCERN'; labelClass = 'score-low'; }
    else if (score >= 55) { label = 'MODERATE CONCERN'; labelClass = 'score-moderate'; }
    else if (score >= 30) { label = 'HIGH CONCERN'; labelClass = 'score-high'; }
    else { label = 'CRITICAL CONCERN'; labelClass = 'score-critical'; }

    // Generate assessor note
    var note = generateAssessorNote(score, warnings, cautions);

    return {
      score: score,
      label: label,
      labelClass: labelClass,
      warnings: warnings,
      cautions: cautions,
      passes: passes,
      note: note
    };
  }

  function generateAssessorNote(score, warnings, cautions) {
    if (score < 30) {
      return 'Based on what you have shared, this investment shows multiple patterns commonly associated with fraudulent or unsustainable schemes in Bangladesh. The combination of warning signs suggests extreme caution is warranted. If you still wish to explore this, insist on: RJSC registration documents, audited financial statements, a physical office visit, and a proper stamped investment agreement reviewed by an independent lawyer. If any of these are refused, walk away. This assessment is based on what you told us ? it is not a certification that the investment is fraudulent, but the risk indicators are severe.';
    }
    if (score < 55) {
      return 'This investment has significant warning signs that require professional investigation before any commitment. Several indicators fall below what we would expect from a well-structured investment opportunity in Bangladesh. The specific concerns noted above should be resolved with documentary evidence ? not verbal assurances ? before you proceed. Consider having an independent lawyer or financial professional review the proposal.';
    }
    if (score < 80) {
      return 'This investment has some points that need clarification, but does not show obvious fraud indicators. Standard due diligence should be sufficient: verify registration with RJSC, review financial statements, visit the physical office if possible, and ensure all terms are captured in a stamped written agreement. The concerns we flagged are common in early-stage and SME investments and may have reasonable explanations.';
    }
    return 'This investment passes basic sanity checks. The structure appears reasonable, documentation seems present, and the terms align with market norms for Bangladesh. Standard due diligence is still required ? no assessment tool replaces your own judgment ? but no critical warning signs were detected from the information you provided.';
  }

  // Public API
  return {
    evaluate: evaluate
  };
})();