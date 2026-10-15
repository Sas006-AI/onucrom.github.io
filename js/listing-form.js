/* Onucrom listing forms (enlist + update). Dependency-free.
   Renders into #lf-root. Config comes from data- attributes written by the site build:
   data-mode="enlist|update"  data-endpoint=<Apps Script web app URL>  data-cap=<daily cap, display only> */
(function () {
  'use strict';

  // Single client-side source of option lists (the server validates the same codes).
  var OPT = {
    role: [['SPONSOR', 'Project sponsor / owner'], ['INVESTOR', 'Investor or lead investor enlisting the project']],
    sector: [['agro', 'Agriculture & Agro'], ['manufacturing', 'Manufacturing'], ['textile', 'Textile & Garments'], ['technology', 'Technology & Software'],
      ['real_estate', 'Real Estate'], ['energy', 'Energy & Renewables'], ['healthcare', 'Healthcare'], ['education', 'Education'],
      ['trade_retail', 'Trade & Retail'], ['logistics', 'Transport & Logistics'], ['food_beverage', 'Food & Beverage'], ['other', 'Other']],
    instrument: [['equity', 'Equity stake'], ['pls', 'Profit-and-loss sharing (Mudaraba / Musharaka)'], ['debt_note', 'Debt / loan note'],
      ['revenue_share', 'Revenue share'], ['other', 'Other']],
    stage: [['idea', 'Idea / pre-revenue'], ['early', 'Early revenue'], ['operating', 'Operating (under 3 years)'], ['established', 'Established (3+ years)'], ['expansion', 'Expansion of an existing business']],
    division: [['Dhaka', 'Dhaka'], ['Chattogram', 'Chattogram'], ['Rajshahi', 'Rajshahi'], ['Khulna', 'Khulna'], ['Barishal', 'Barishal'],
      ['Sylhet', 'Sylhet'], ['Rangpur', 'Rangpur'], ['Mymensingh', 'Mymensingh'], ['Outside Bangladesh', 'Outside Bangladesh']],
    basis: [['not_specified', 'Not specified'], ['profit_share', 'Profit share'], ['fixed_target', 'Fixed target rate (a target, not a guarantee)'],
      ['revenue_share', 'Revenue share'], ['equity_upside', 'Equity appreciation']],
    shariah: [['standard', 'Standard (not claimed Shariah-compliant)'], ['self_certified', 'Self-certified Shariah-compliant (my own declaration)'],
      ['compliant', 'Certified by a recognized Shariah board (I can show the certificate)']]
  };
  var LIMITS = { name: [2, 80], project: [2, 80], summary: [40, 600], email: [5, 120], urlMax: 300, minAmount: 50000, maxAmount: 10000000000 };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // ---------- validation (mirrors the server; the server is the authority) ----------
  function normalizePhone(raw) {
    var v = String(raw || '').replace(/[\s\-().]/g, '');
    if (/^(\+?880|0)1[3-9]\d{8}$/.test(v)) return '+880' + v.replace(/^(\+?880|0)/, '');
    if (/^\+[1-9]\d{9,14}$/.test(v)) return v;
    return '';
  }
  function validEmail(v) { return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(v) && v.length <= LIMITS.email[1]; }
  function validHttps(v) { return /^https:\/\/[^\s"'<>]+$/i.test(v) && v.length <= LIMITS.urlMax; }
  function hasMarkup(v) { return /[<>]/.test(v); }

  function validate(d, mode) {
    var err = {};
    function need(k, msg) { if (!String(d[k] || '').trim()) { err[k] = msg || 'Required'; return false; } return true; }
    if (mode === 'enlist') {
      need('role'); 
      if (need('contact_name') && (d.contact_name.length < LIMITS.name[0] || hasMarkup(d.contact_name))) err.contact_name = 'Enter your real name';
      var s = [d.social_1, d.social_2, d.social_3];
      s.forEach(function (u, i) { if (u && !validHttps(u)) err['social_' + (i + 1)] = 'Use a full https:// link or leave blank'; });
    } else {
      if (need('ref_id') && !/^ONU-[A-Z0-9]{6}$/.test(String(d.ref_id).trim().toUpperCase())) err.ref_id = 'Looks like ONU-XXXXXX';
    }
    if (need('email') && !validEmail(d.email)) err.email = 'Enter a valid email';
    if (need('phone') && !normalizePhone(d.phone)) err.phone = 'Enter a Bangladesh mobile (01XXXXXXXXX) or an international number starting with +';
    if (need('project_name') && (d.project_name.length < LIMITS.project[0] || hasMarkup(d.project_name))) err.project_name = 'Enter the project or company name';
    ['sector', 'instrument', 'stage', 'division', 'basis', 'shariah'].forEach(function (k) { need(k, 'Choose one'); });
    var amt = Number(d.seeking_bdt);
    if (!d.seeking_bdt || isNaN(amt) || amt < LIMITS.minAmount || amt > LIMITS.maxAmount) err.seeking_bdt = 'Enter an amount between BDT 50,000 and BDT 10,00,00,00,000';
    if (d.return_pct !== '' && d.return_pct !== undefined) {
      var r = Number(d.return_pct);
      if (isNaN(r) || r < 0 || r > 100) err.return_pct = 'Enter 0 to 100, or leave blank';
    }
    var sm = String(d.summary || '').trim();
    if (sm.length < LIMITS.summary[0] || sm.length > LIMITS.summary[1] || hasMarkup(sm)) err.summary = 'Describe the project in ' + LIMITS.summary[0] + ' to ' + LIMITS.summary[1] + ' characters (no HTML)';
    var pubs = [d.public_link_1, d.public_link_2, d.public_link_3, d.public_link_4, d.public_link_5];
    if (!pubs[0]) err.public_link_1 = 'Add at least one public link (website, YouTube, Facebook, LinkedIn...)';
    pubs.forEach(function (u, i) { if (u && !validHttps(u)) err['public_link_' + (i + 1)] = 'Use a full https:// link'; });
    [d.proof_link_1, d.proof_link_2, d.proof_link_3].forEach(function (u, i) { if (u && !validHttps(u)) err['proof_link_' + (i + 1)] = 'Use a full https:// link'; });
    if (!d.c1) err.c1 = 'Required'; if (!d.c2) err.c2 = 'Required'; if (!d.c3) err.c3 = 'Required';
    return err;
  }

  // ---------- rendering ----------
  function field(id, label, control, hint, privacy) {
    var lab = el('label', { 'for': id, text: label });
    if (privacy) lab.appendChild(el('span', { 'class': 'lf-privacy ' + privacy, text: privacy === 'private' ? 'PRIVATE' : 'PUBLIC' }));
    var wrap = el('div', { 'class': 'lf-field', 'data-field': id }, [lab, control]);
    if (hint) wrap.appendChild(el('div', { 'class': 'lf-hint', text: hint }));
    wrap.appendChild(el('div', { 'class': 'lf-error' }));
    return wrap;
  }
  function input(id, type, ph, extra) { var a = { id: id, name: id, type: type, placeholder: ph || '', autocomplete: 'off' }; Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; }); return el('input', a); }
  function select(id, list) {
    var s = el('select', { id: id, name: id });
    s.appendChild(el('option', { value: '', text: 'Select…', disabled: 'disabled', selected: 'selected' }));
    list.forEach(function (o) { s.appendChild(el('option', { value: o[0], text: o[1] })); });
    return s;
  }
  function section(title, sub, kids) {
    var c = el('div', { 'class': 'card' }, [el('div', { 'class': 'lf-section-title', text: title }), el('div', { 'class': 'lf-section-sub', text: sub })]);
    kids.forEach(function (k) { c.appendChild(k); });
    return c;
  }
  function row(a, b) { return el('div', { 'class': 'lf-row' }, [a, b]); }
  function check(id, text) { return el('div', { 'class': 'lf-check', 'data-field': id }, [el('input', { type: 'checkbox', id: id, name: id }), el('label', { 'for': id, text: text }), el('div', { 'class': 'lf-error' })]); }

  function build(root, mode) {
    var form = el('form', { id: 'lf-form', novalidate: 'novalidate', autocomplete: 'off' });
    var parts = [];
    if (mode === 'enlist') {
      parts.push(section('1. About you', 'Only a project sponsor or an investor can enlist a project. These details are for human verification and are never shown on the site.', [
        field('role', 'Your role', select('role', OPT.role), '', 'private'),
        field('contact_name', 'Full name', input('contact_name', 'text', 'As on your ID'), '', 'private'),
        row(field('email', 'Email', input('email', 'email', 'name@example.com'), 'We send your reference ID and every decision here.', 'private'),
            field('phone', 'Mobile number', input('phone', 'tel', '01XXXXXXXXX or +country code'), 'We may call or message you during verification.', 'private')),
        field('social_1', 'Social profile link (optional)', input('social_1', 'url', 'https://linkedin.com/in/…'), 'LinkedIn, Facebook, etc. Helps us verify you. Optional, private.', 'private'),
        row(field('social_2', 'Another profile (optional)', input('social_2', 'url', 'https://…'), '', 'private'), field('social_3', 'Another profile (optional)', input('social_3', 'url', 'https://…'), '', 'private'))
      ]));
    } else {
      parts.push(section('Prove it is you', 'Enter the Reference ID from your email and the email and mobile number you listed with. Nothing from your earlier entry is shown here: you re-enter everything.', [
        field('ref_id', 'Reference ID', input('ref_id', 'text', 'ONU-XXXXXX', { maxlength: '10', style: 'text-transform:uppercase' }), '', 'private'),
        row(field('email', 'Email on file', input('email', 'email', 'name@example.com'), '', 'private'), field('phone', 'Mobile number on file', input('phone', 'tel', '01XXXXXXXXX'), '', 'private'))
      ]));
    }
    parts.push(section(mode === 'enlist' ? '2. The project' : 'The updated project details', 'Shown publicly only after we approve your listing for display.', [
      field('project_name', 'Project or company name', input('project_name', 'text', ''), '', 'public'),
      row(field('sector', 'Sector', select('sector', OPT.sector), '', 'public'), field('instrument', 'What are you offering?', select('instrument', OPT.instrument), '', 'public')),
      row(field('stage', 'Stage', select('stage', OPT.stage), '', 'public'), field('division', 'Where is the project?', select('division', OPT.division), '', 'public')),
      row(field('seeking_bdt', 'Amount sought (BDT)', input('seeking_bdt', 'number', 'e.g. 5000000', { min: '50000', step: '1' }), '', 'public'),
          field('return_pct', 'Stated return % (optional)', input('return_pct', 'number', 'e.g. 12', { min: '0', max: '100', step: '0.1' }), 'A target only. Claims of guaranteed or risk-free returns are not accepted.', 'public')),
      row(field('basis', 'Return basis', select('basis', OPT.basis), '', 'public'), field('shariah', 'Shariah status (your declaration)', select('shariah', OPT.shariah), 'We display exactly what you declare, labelled as such.', 'public')),
      field('summary', 'Summary for investors', el('textarea', { id: 'summary', name: 'summary', maxlength: '600', placeholder: 'What the business does, what the money is for, how investors are repaid or share in returns.' }), '40 to 600 characters. Plain text only.', 'public')
    ]));
    var pub = [field('public_link_1', 'Public link 1 (required)', input('public_link_1', 'url', 'https://…'), 'Your website, YouTube video, Facebook page, LinkedIn page, etc.', 'public')];
    for (var i = 2; i <= 5; i++) pub.push(field('public_link_' + i, 'Public link ' + i + ' (optional)', input('public_link_' + i, 'url', 'https://…'), '', 'public'));
    parts.push(section(mode === 'enlist' ? '3. Public links' : 'Public links', 'Only links that already work for anyone. Every link you give here becomes public with your listing.', pub));
    parts.push(section(mode === 'enlist' ? '4. Proof (optional)' : 'Proof (optional)', 'Self-hosted proof is allowed as a Google Drive or Google Docs link, or a GitHub page link. Set it to “anyone with the link can view”. No downloads, no archives, no programs.', [
      field('proof_link_1', 'Proof link 1', input('proof_link_1', 'url', 'https://drive.google.com/file/d/…'), '', 'public'),
      row(field('proof_link_2', 'Proof link 2', input('proof_link_2', 'url', 'https://…'), '', 'public'), field('proof_link_3', 'Proof link 3', input('proof_link_3', 'url', 'https://…'), '', 'public'))
    ]));
    var trap = el('div', { 'class': 'lf-trap', 'aria-hidden': 'true' }, [el('label', { 'for': 'company_site', text: 'Leave this field empty' }), el('input', { type: 'text', id: 'company_site', name: 'company_site', tabindex: '-1', autocomplete: 'off' })]);
    parts.push(section(mode === 'enlist' ? '5. Consent and submit' : 'Consent and submit', 'Please read each line. We review every entry by hand.', [
      check('c1', 'I consent to the fields marked PUBLIC, and every link I entered, being shown publicly on Onucrom if my listing is approved.'),
      check('c2', mode === 'enlist' ? 'I am the project sponsor or an investor authorised to enlist this project, and everything I entered is true. I understand false or misleading entries are disqualified.' : 'I am authorised to update this listing, and everything I entered is true.'),
      check('c3', 'I have read the listing terms. I understand Onucrom is a discovery platform with no liability for third-party links or for any dealings between parties.'),
      trap,
      el('div', { id: 'lf-form-alert', 'class': 'lf-alert hidden' }),
      el('button', { type: 'submit', 'class': 'btn btn-full', id: 'lf-submit', text: mode === 'enlist' ? 'Submit for review' : 'Submit update for review' })
    ]));
    parts.forEach(function (p) { form.appendChild(p); });
    root.appendChild(form);
    return form;
  }

  function collect(form) {
    var d = {};
    Array.prototype.forEach.call(form.elements, function (e) {
      if (!e.name) return;
      d[e.name] = e.type === 'checkbox' ? e.checked : String(e.value || '').trim();
    });
    return d;
  }
  function showErrors(form, errs) {
    Array.prototype.forEach.call(form.querySelectorAll('[data-field]'), function (w) {
      var k = w.getAttribute('data-field'), msg = errs[k];
      w.classList.toggle('has-error', !!msg);
      var e = w.querySelector('.lf-error'); if (e) e.textContent = msg || '';
    });
    var first = form.querySelector('.has-error');
    if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function alertBox(form, msg) { var a = form.querySelector('#lf-form-alert'); a.textContent = msg || ''; a.classList.toggle('hidden', !msg); }

  function post(endpoint, payload) {
    return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); });
  }

  function success(root, form, mode, res) {
    form.classList.add('hidden');
    var box = el('div', { 'class': 'card lf-success' }, [
      el('div', { 'class': 'lf-section-title', text: mode === 'enlist' ? '✓ Received. Your listing is in the review queue.' : '✓ Update received. It is in the review queue.' }),
      el('div', { 'class': 'lf-section-sub', text: 'Your Reference ID' }),
      el('div', { 'class': 'lf-ref', id: 'lf-ref', text: res.ref }),
      el('p', { text: 'We emailed this ID and the next steps to the address you gave. Keep it: you need it to update or renew your listing.', style: 'margin:12px 0' }),
      el('p', { text: 'Onucrom is human-run. Review sittings are held daily at 12:00 and 18:00 (Dhaka time). Human verification can take a few hours; you will get an email with the decision, whichever it is.', style: 'font-size:0.9rem' }),
      el('p', { text: 'Check your spam folder if nothing arrives within a few hours.', style: 'font-size:0.8rem;color:var(--muted);margin-top:8px' })
    ]);
    root.appendChild(box);
  }

  function initCapacity(root, endpoint, cap) {
    var badge = el('div', { id: 'lf-capacity', 'class': 'lf-capacity', text: 'Checking today\'s capacity…' });
    root.insertBefore(el('div', { style: 'margin-bottom:16px' }, [badge]), root.firstChild);
    if (!endpoint) { badge.textContent = 'Daily cap: ' + (cap || '30') + ' listings'; return; }
    fetch(endpoint + (endpoint.indexOf('?') > -1 ? '&' : '?') + 'action=capacity').then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) { badge.textContent = 'Daily cap: ' + (cap || '30') + ' listings'; return; }
      if (j.left <= 0) { badge.textContent = 'Today\'s ' + j.cap + ' slots are full. New entries open again after midnight (Dhaka time).'; badge.classList.add('closed'); var b = document.getElementById('lf-submit'); if (b) b.disabled = true; }
      else badge.textContent = j.left + ' of ' + j.cap + ' listing slots left today';
    }).catch(function () { badge.textContent = 'Daily cap: ' + (cap || '30') + ' listings'; });
  }

  function initStatus(root, endpoint) {
    var box = el('div', { 'class': 'card' }, [el('div', { 'class': 'lf-section-title', text: 'Check the status of a listing' }),
      el('div', { 'class': 'lf-section-sub', text: 'Reference ID and the email you used.' }),
      row(field('st_ref', 'Reference ID', input('st_ref', 'text', 'ONU-XXXXXX', { maxlength: '10' })), field('st_email', 'Email', input('st_email', 'email', ''))),
      el('button', { type: 'button', 'class': 'btn btn-secondary', id: 'st-btn', text: 'Check status' }), el('p', { id: 'st-out', style: 'margin-top:12px;font-size:0.9rem' })]);
    root.appendChild(box);
    box.querySelector('#st-btn').addEventListener('click', function () {
      var out = box.querySelector('#st-out'); out.textContent = 'Checking…';
      post(endpoint, { action: 'status', ref_id: box.querySelector('#st_ref').value.trim().toUpperCase(), email: box.querySelector('#st_email').value.trim() })
        .then(function (j) { out.textContent = j.message || 'No result.'; }).catch(function () { out.textContent = 'Could not reach the server. Try again shortly.'; });
    });
  }

  function init() {
    var root = document.getElementById('lf-root');
    if (!root || root.getAttribute('data-ready')) return;
    root.setAttribute('data-ready', '1');
    var mode = root.getAttribute('data-mode') || 'enlist';
    var endpoint = (root.getAttribute('data-endpoint') || '').trim();
    var cap = root.getAttribute('data-cap');
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(endpoint)) {
      root.appendChild(el('div', { 'class': 'card', html: '<div class="lf-section-title">Enlistment is temporarily unavailable</div><div class="lf-section-sub">Please check back shortly.</div>' }));
      return;
    }
    var form = build(root, mode);
    var t0 = Date.now();
    initCapacity(root, endpoint, cap);
    if (mode === 'update') {   // the email link carries only the Reference ID; everything else stays blank
      var m = /[?&]ref=([A-Za-z0-9-]{4,12})/.exec(window.location.search || '');
      var rid = form.querySelector('#ref_id');
      if (m && rid) rid.value = m[1].toUpperCase();
    }
    if (mode === 'update') initStatus(root, endpoint);
    var busy = false;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return;
      var d = collect(form), errs = validate(d, mode);
      showErrors(form, errs); alertBox(form, '');
      if (Object.keys(errs).length) { alertBox(form, 'Please fix the highlighted fields.'); return; }
      busy = true;
      var btn = form.querySelector('#lf-submit'); btn.disabled = true; btn.textContent = 'Submitting…';
      d.phone = normalizePhone(d.phone); d.action = mode === 'enlist' ? 'submit' : 'update'; d.elapsed_ms = Date.now() - t0;
      if (d.ref_id) d.ref_id = d.ref_id.toUpperCase();
      post(endpoint, d).then(function (res) {
        busy = false; btn.disabled = false; btn.textContent = mode === 'enlist' ? 'Submit for review' : 'Submit update for review';
        if (res && res.ok) { success(root, form, mode, res); return; }
        showErrors(form, (res && res.fields) || {});
        alertBox(form, (res && res.message) || 'Something went wrong. Please try again.');
      }).catch(function () {
        busy = false; btn.disabled = false; btn.textContent = mode === 'enlist' ? 'Submit for review' : 'Submit update for review';
        alertBox(form, 'Could not reach the server. Nothing was lost; please try again in a moment.');
      });
    });
  }

  window.OnucromListing = { OPT: OPT, LIMITS: LIMITS, validate: validate, normalizePhone: normalizePhone, init: init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
