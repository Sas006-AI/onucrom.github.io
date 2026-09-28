document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const form = document.getElementById('screener-form');
    const q0 = document.getElementById('q0');
    
    // Sections
    const sec1 = document.getElementById('sec-1');
    const sec2 = document.getElementById('sec-2');
    const sec3 = document.getElementById('sec-3');
    const sec4 = document.getElementById('sec-4');
    const sec5 = document.getElementById('sec-5');
    const secSubmit = document.getElementById('sec-submit');

    // Follow-ups
    const q1Followups = document.getElementById('q1-followups');
    const q3Group = document.getElementById('q3-group');
    const q3aGroup = document.getElementById('q3a-group');
    const finRatios = document.getElementById('financial-ratios');
    const q11Group = document.getElementById('q11-group');
    const q12Group = document.getElementById('q12-group');

    let currentLane = '';
    let isCertified = false;

    // ---- Form Routing Logic ----
    q0.addEventListener('change', (e) => {
        currentLane = e.target.value;
        resetFormVisibility();
        sec1.classList.remove('hidden');
        sec5.classList.remove('hidden');
        secSubmit.classList.remove('hidden');
        sec4.classList.remove('hidden'); // Instrument filter is required in all lanes

        if (currentLane === 'lane_a' || currentLane === 'lane_a_default') {
            sec2.classList.remove('hidden');
            sec3.classList.remove('hidden');
        }
    });

    document.getElementById('q1').addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            q1Followups.classList.remove('hidden');
        } else {
            q1Followups.classList.add('hidden');
            checkCertificationBypass();
        }
    });

    document.getElementById('q1c').addEventListener('change', checkCertificationBypass);

    function checkCertificationBypass() {
        const q1cVal = document.getElementById('q1c').value;
        if (q1cVal === 'verified') {
            isCertified = true;
            sec2.classList.add('hidden'); // Skip business screen
            sec3.classList.add('hidden'); // Skip financial screen
        } else {
            isCertified = false;
            if (currentLane === 'lane_a' || currentLane === 'lane_a_default') {
                sec2.classList.remove('hidden');
                sec3.classList.remove('hidden');
            }
        }
    }

    document.getElementById('q2').addEventListener('change', (e) => {
        if (e.target.value === 'halal') {
            q3Group.classList.remove('hidden');
        } else {
            q3Group.classList.add('hidden');
            q3aGroup.classList.add('hidden');
        }
    });

    document.getElementById('q3').addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            q3aGroup.classList.remove('hidden');
        } else {
            q3aGroup.classList.add('hidden');
        }
    });

    document.getElementById('q4').addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            finRatios.classList.remove('hidden');
        } else {
            finRatios.classList.add('hidden');
        }
    });

    document.getElementById('q10').addEventListener('change', (e) => {
        q11Group.classList.add('hidden');
        q12Group.classList.add('hidden');
        if (e.target.value === 'sukuk') q11Group.classList.remove('hidden');
        if (e.target.value === 'pe_pls') q12Group.classList.remove('hidden');
    });

    function resetFormVisibility() {
        sec1.classList.add('hidden');
        sec2.classList.add('hidden');
        sec3.classList.add('hidden');
        sec4.classList.add('hidden');
        sec5.classList.add('hidden');
        secSubmit.classList.add('hidden');
    }

    // ---- Assessment Evaluation Engine ----
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let flags = [];
        let score = 'green'; // Assume compliant unless degraded
        let hasUnknowns = false;

        // 1. Check Instrument Filter (Overrides upstream)[cite: 3]
        const inst = document.getElementById('q10').value;
        const peStruct = document.getElementById('q12').value;
        
        if (inst === 'haram_bond' || inst === 'haram_fdr') {
            score = 'red';
            flags.push("Riba — Conventional interest-bearing instrument.");
        }
        if (inst === 'pe_pls' && peStruct === 'guaranteed') {
            score = 'red';
            flags.push("Riba/Gharar — Guaranteed fixed minimum return on a PLS agreement.");
        }
        if (inst === 'unknown' || peStruct === 'unknown' || document.getElementById('q11').value === 'unknown') {
            hasUnknowns = true;
        }

        // 2. Check Business & Financials (Only if Lane A and Not Certified)
        if (!isCertified && (currentLane === 'lane_a' || currentLane === 'lane_a_default') && score !== 'red') {
            
            // Business Activity[cite: 3]
            const q2Val = document.getElementById('q2').value;
            const q3aVal = document.getElementById('q3a').value;
            
            if (q2Val === 'haram' || q3aVal === 'significant') {
                score = 'red';
                flags.push("Prohibited Exposure — Primary business activity or significant secondary exposure involves impermissible sectors.");
            } else if (q3aVal === 'minor') {
                if (score !== 'red') score = 'orange';
                flags.push("Minor Prohibited Exposure — Contains 5-15% haram sector exposure requiring purification.");
            } else if (q2Val === 'unknown' || q3aVal === 'unknown') {
                hasUnknowns = true;
            }

            // Financial Ratios[cite: 3]
            if (document.getElementById('q4').value === 'yes') {
                const ratios = ['q5', 'q6', 'q7', 'q8'];
                ratios.forEach(id => {
                    const val = document.getElementById(id).value;
                    if (val === 'fail') {
                        score = 'red';
                        flags.push(`Financial Threshold Breach — Ratio ${id} exceeds standard AAOIFI allowances (e.g. >30% debt).`);
                    } else if (val === 'borderline' && score !== 'red') {
                        score = 'orange';
                        flags.push(`Borderline Financials — Ratio ${id} is close to exceeding maximum Shariah allowances.`);
                    } else if (val === 'unknown') {
                        hasUnknowns = true;
                    }
                });
            } else {
                hasUnknowns = true; // No financials available
            }
        }

        // Determine final rating color
        if (score === 'red') {
            renderResult('🔴 Red (Non-Compliant)', 'bg-red', flags);
        } else if (score === 'orange') {
            renderResult('🟠 Orange (Appears Not Aligned)', 'bg-orange', flags);
        } else if (hasUnknowns) {
            renderResult('⚪ Grey (Unclear / Insufficient Info)', 'bg-grey', flags);
        } else if (isCertified) {
            renderResult('🟢 Green (Certified Compliant)', 'bg-green', flags);
        } else {
            renderResult('🔵 Blue (Appears Aligned, Not Certified)', 'bg-blue', flags);
        }

        // Niyat Check (Independent of score)[cite: 2, 3]
        const niyat = document.getElementById('q13').value;
        const niyatBox = document.getElementById('niyat-comment');
        if (niyat === 'short_term') {
            niyatBox.innerHTML = "<strong>Advisory Note:</strong> A short-term trading approach leans toward a pattern generally discouraged in Shariah scholarship, even when the underlying instrument itself is compliant. A longer holding horizon may better fit Shariah-conscious investing[cite: 3].";
            niyatBox.classList.remove('hidden');
        } else {
            niyatBox.classList.add('hidden');
        }

        // Final UI Updates
        document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        document.getElementById('results-dashboard').classList.remove('hidden');
        document.getElementById('results-dashboard').scrollIntoView({ behavior: 'smooth' });
    });

    function renderResult(text, cssClass, flags) {
        const badge = document.getElementById('rating-badge');
        badge.innerText = text;
        badge.className = `badge ${cssClass}`;

        const issuesBox = document.getElementById('flagged-issues');
        const issuesList = document.getElementById('issues-list');
        issuesList.innerHTML = '';

        if (flags.length > 0) {
            flags.forEach(f => {
                let li = document.createElement('li');
                li.innerText = f;
                issuesList.appendChild(li);
            });
            issuesBox.classList.remove('hidden');
        } else {
            issuesBox.classList.add('hidden');
        }
    }

    // ---- Social Sharing & DB Hook ----
    document.getElementById('share-wa-btn').addEventListener('click', () => {
        const text = `I just ran a Shariah Sanity Check on an investment using Onucrom and got: ${document.getElementById('rating-badge').innerText}. Run your own check here:`;
        const url = window.location.href;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`);
    });

    document.getElementById('share-fb-btn').addEventListener('click', () => {
        const url = window.location.href;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    });

    document.getElementById('submit-db-btn').addEventListener('click', () => {
        const name = document.getElementById('investment-name').value;
        if(!name) { alert("Please enter the name of the investment first."); return; }
        
        // This simulates a POST request to your Google Apps Script Web App URL
        const mockPayload = {
            investment: name,
            score: document.getElementById('rating-badge').innerText,
            date: new Date().toISOString()
        };
        
        console.log("Mocking send to GAS:", mockPayload);
        
        const msg = document.getElementById('db-status-msg');
        msg.innerText = `Successfully queued "${name}" for Onucrom database review!`;
        msg.classList.remove('hidden');
        document.getElementById('submit-db-btn').innerText = "Submitted ✓";
        document.getElementById('submit-db-btn').disabled = true;
    });
});