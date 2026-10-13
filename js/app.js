/**
 * onucrom — list your investment need
 * -----------------------------------
 * Runs entirely in the browser. Nothing is uploaded.
 * Documents stay where the submitter already hosts them (Drive, a page, a site).
 *
 * STORAGE CONFIGURATION
 * Leave both URLs empty to stay on local data modeling.
 * Set either sheetWebhookUrl or endpointUrl when you are ready to receive packets.
 */
const STORAGE = {
  mode: "local-only",
  sheetWebhookUrl: "",
  endpointUrl: "",
  endpointSecret: "",
  notifyEmail: "onucromcorp@gmail.com",
  draftKey: "onu.listNeed.v1.draft",
  outboxKey: "onu.listNeed.v1.outbox",
};

const QUOTES = [
  "A name and a place are enough to start. The rest can be a link.",
  "Say what the money is for in one breath. Readers in Dhaka decide quickly.",
  "If a stranger cannot open the link, it is not proof yet.",
  "Nothing on this page moves a taka. It only asks to be read.",
];

const STEP_TITLES = [
  "Step 1 of 4 · You and the venture",
  "Step 2 of 4 · The capital you need",
  "Step 3 of 4 · Links, not files",
  "Step 4 of 4 · Read it back",
];

const LABELS = {
  role: {
    founder: "Founder",
    director: "Director",
    finance: "Finance lead",
    family: "Family business",
    advisor: "Advisor, for the owner",
  },
  sector: {
    agro: "Agro & food",
    rmg: "RMG & textiles",
    engineering: "Light engineering",
    health: "Health & clinics",
    education: "Education",
    logistics: "Transport & logistics",
    energy: "Power & energy",
    trading: "Trading & distribution",
    housing: "Housing & construction",
    ict: "ICT & services",
    livestock: "Livestock & fisheries",
    other: "Other",
  },
  stage: {
    selling: "Already selling",
    expansion: "Expansion or a new line",
    early: "Early, revenue still thin",
    project: "A specific asset or contract",
  },
  legal: {
    sole: "Sole proprietorship",
    partnership: "Partnership",
    "private-limited": "Private limited",
    cooperative: "Society or cooperative",
    unregistered: "Not registered yet",
  },
  instrument: {
    equity: "Equity",
    "profit-share": "Profit share",
    "revenue-share": "Revenue share",
    musharaka: "Musharaka",
    mudaraba: "Mudaraba",
    murabaha: "Murabaha",
    undecided: "Still deciding",
  },
  shariah: {
    standard: "Standard — no Shariah claim",
    "self-certified": "Self-certified",
  },
  platform: {
    facebook: "Facebook",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    website: "Website or page",
    other: "Other",
  },
  proof: {
    registry: "Trade licence, RJSC, TIN or BIN",
    proposal: "Investment proposal",
    deck: "Pitch deck",
    financials: "Accounts or financials",
    photos: "Photos of the work",
    other: "Other support",
  },
};

const PLATFORM_OPTIONS = Object.keys(LABELS.platform);
const PROOF_OPTIONS = Object.keys(LABELS.proof);

const SAMPLE = {
  contact: {
    name: "Nusrat Karim",
    role: "founder",
    email: "nusrat@example.com",
    mobile: "01711000000",
    showMobilePublicly: false,
  },
  venture: {
    name: "Fatullah Loom Works",
    oneLiner: "We weave cotton shirting for two Dhaka buying houses and need a second loom line.",
    district: "Narayanganj",
    area: "Fatullah",
    legalForm: "private-limited",
    registryId: "",
    tinOrBin: "",
    website: "https://example.com",
  },
  need: {
    sector: "rmg",
    stage: "expansion",
    amountBdt: 4000000,
    minimumTicketBdt: 500000,
    useOfFunds: "Two looms, a month of yarn, and the electrician for the new line. Not for old supplier dues.",
    instrument: "profit-share",
    shariahClaim: "self-certified",
    targetClose: "Before Eid-ul-Fitr 2027",
    statedAnnualReturnPct: 18,
  },
  presence: [{ platform: "facebook", url: "https://facebook.com" }],
  proofLinks: [
    {
      kind: "proposal",
      url: "https://google.com",
      label: "One-page proposal (sample link)",
    },
    {
      kind: "registry",
      url: "https://google.com",
      label: "Trade licence scan, viewer link",
    },
  ],
};

let form;
let step = 1;
let lastPacket = null;

function initOnuListNeed() {
  form = document.getElementById("onu-form");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("click", onFormClick);
  form.addEventListener("input", onFormInput);
  form.addEventListener("change", onFormInput);
  bindNavOnce();
  
  const outboxBtn = document.getElementById("btn-outbox");
  if (outboxBtn && outboxBtn.dataset.bound !== "1") {
    outboxBtn.dataset.bound = "1";
    outboxBtn.addEventListener("click", showOutbox);
  }
  
  ensureRows();
  const restored = restoreDraft();
  updateAmountHint();
  updateReturnHint();
  updateInstrumentHint();
  updateShariahHint();
  updateStorageBadge();
  go(restored ? restored : 1, false);
  
  const banner = document.getElementById("draft-banner");
  if (restored && banner) banner.classList.remove("hidden");
}

function bindNavOnce() {
  if (window.__onuNavBound) return;
  window.__onuNavBound = true;
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".dropdown-toggle");
    if (toggle) {
      event.preventDefault();
      const dd = toggle.closest(".dropdown");
      const willOpen = dd && !dd.classList.contains("open");
      document.querySelectorAll(".dropdown.open").forEach((node) => node.classList.remove("open"));
      if (willOpen) dd.classList.add("open");
      return;
    }
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((node) => node.classList.remove("open"));
    }
  });
}

function onFormClick(event) {
  const pill = event.target.closest(".pill-btn");
  if (pill && form.contains(pill)) {
    const row = pill.closest(".pill-row");
    row.querySelectorAll(".pill-btn").forEach((btn) => btn.classList.remove("active"));
    pill.classList.add("active");
    const hidden = form.querySelector(`[name="${row.dataset.field}"]`);
    if (hidden) hidden.value = pill.dataset.value;
    updateInstrumentHint();
    updateShariahHint();
    saveDraft();
    return;
  }
  const id = event.target.closest("button")?.id;
  if (id === "btn-next") onNext();
  else if (id === "btn-back") go(step - 1);
  else if (id === "btn-add-presence") addPresence();
  else if (id === "btn-add-proof") addProof();
  else if (id === "btn-sample") fillSample();
  else if (id === "btn-clear-draft") clearDraft(true);
  else if (id === "btn-download") downloadPacket();
  else if (id === "btn-copy") copyPacket();
  else if (id === "btn-email") emailDesk();
  else if (id === "btn-reset") resetForm();
  else if (event.target.closest(".js-remove")) {
    const row = event.target.closest(".presence-row, .proof-row");
    const list = row.parentElement;
    if (list.children.length === 1) {
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
    } else row.remove();
    saveDraft();
  }
}

function onFormInput(event) {
  const target = event.target;
  if (target && target.name) {
    target.removeAttribute("aria-invalid");
    const err = form.querySelector(`[data-error-for="${target.name}"]`);
    if (err) err.textContent = "";
  }
  if (target && (target.id === "amount-bdt" || target.id === "min-ticket" || !target)) updateAmountHint();
  if (target && (target.id === "stated-return" || !target)) updateReturnHint();
  if (!target) {
    updateInstrumentHint();
    updateShariahHint();
  }
  const one = document.getElementById("one-liner");
  const use = document.getElementById("use-of-funds");
  const oneCount = document.getElementById("one-count");
  const useCount = document.getElementById("use-count");
  if (one && oneCount) oneCount.textContent = `${one.value.length} / 180`;
  if (use && useCount) useCount.textContent = `${use.value.length} / 600`;
  saveDraft();
  if (step === 4) renderReview();
}

function ensureRows() {
  const presence = document.getElementById("presence-list");
  const proof = document.getElementById("proof-list");
  if (presence && presence.children.length === 0) presence.appendChild(presenceRow("facebook", ""));
  if (proof && proof.children.length === 0) proof.appendChild(proofRow("proposal", "", ""));
}

function optionList(keys, labels) {
  return keys
    .map((key) => `<option value="${key}">${labels[key]}</option>`)
    .join("");
}

function presenceRow(platform, url) {
  const row = document.createElement("div");
  row.className = "presence-row link-row";
  row.innerHTML = `
    <select class="js-platform" aria-label="Where this page lives">${optionList(PLATFORM_OPTIONS, LABELS.platform)}</select>
    <input class="js-url" type="url" inputmode="url" placeholder="https://" aria-label="Link to your page">
    <button type="button" class="btn btn-secondary btn-small js-remove">Remove</button>`;
  row.querySelector(".js-platform").value = platform || "facebook";
  row.querySelector(".js-url").value = url || "";
  return row;
}

function proofRow(kind, url, label) {
  const row = document.createElement("div");
  row.className = "proof-row link-row";
  row.innerHTML = `
    <select class="js-kind" aria-label="What this link proves">${optionList(PROOF_OPTIONS, LABELS.proof)}</select>
    <input class="js-url" type="url" inputmode="url" placeholder="https:// — viewer access, not editor" aria-label="Link to the document">
    <input class="js-label" type="text" maxlength="80" placeholder="Short label, optional" aria-label="Label for this link">
    <button type="button" class="btn btn-secondary btn-small js-remove">Remove</button>`;
  row.querySelector(".js-kind").value = kind || "proposal";
  row.querySelector(".js-url").value = url || "";
  row.querySelector(".js-label").value = label || "";
  return row;
}

function addPresence() {
document.getElementById("presence-list").appendChild(presenceRow("linkedin", ""));
}
function addProof() {
document.getElementById("proof-list").appendChild(proofRow("registry", "", ""));
}
function setPill(field, value) {
const hidden = form.querySelector([name="${field}"]);
if (hidden) hidden.value = value || "";
const row = form.querySelector(.pill-row[data-field="${field}"]);
if (!row) return;
row.querySelectorAll(".pill-btn").forEach((btn) => {
btn.classList.toggle("active", btn.dataset.value === value);
});
}
function val(name) {
const el = form.querySelector([name="${name}"]);
return el ? String(el.value).trim() : "";
}
function checked(name) {
const el = form.querySelector([name="${name}"]);
return !!(el && el.checked);
}
function readPresence() {
return [...form.querySelectorAll(".presence-row")]
.map((row) => ({
platform: row.querySelector(".js-platform").value,
url: row.querySelector(".js-url").value.trim(),
}))
.filter((row) => row.url);
}
function readProof() {
return [...form.querySelectorAll(".proof-row")]
.map((row) => ({
kind: row.querySelector(".js-kind").value,
url: row.querySelector(".js-url").value.trim(),
label: row.querySelector(".js-label").value.trim(),
}))
.filter((row) => row.url || row.label);
}
function collect() {
const minRaw = val("minimumTicketBdt");
const returnRaw = val("statedAnnualReturnPct");
return {
schema: "onucrom.investment-need/v1",
listingIntent: "seek-capital",
contact: {
name: val("personName"),
role: val("role"),
email: val("email").toLowerCase(),
mobile: normalizeBdMobile(val("mobile")),
showMobilePublicly: checked("showMobile"),
},
venture: {
name: val("ventureName"),
oneLiner: val("oneLiner"),
district: val("district"),
area: val("area"),
legalForm: val("legalForm"),
registryId: val("registryId"),
tinOrBin: val("tinOrBin"),
website: val("website"),
},
need: {
sector: val("sector"),
stage: val("stage"),
amountBdt: Number(val("amountBdt") || 0),
minimumTicketBdt: minRaw ? Number(minRaw) : null,
useOfFunds: val("useOfFunds"),
instrument: val("instrument"),
shariahClaim: val("shariahClaim"),
targetClose: val("targetClose"),
statedAnnualReturnPct: returnRaw ? Number(returnRaw) : null,
},
presence: readPresence(),
proofLinks: readProof().filter((row) => row.url),
consents: {
truthful: checked("consentTruth"),
noCustody: checked("consentCustody"),
publicSummaryAfterReview: checked("consentPublic"),
contactForVerification: checked("consentContact"),
},
};
}
function classifyUrl(value) {
const raw = value.trim();
if (!raw) return { empty: true };
if (/^(javascript|data):/i.test(raw)) return { ok: false, reason: "That link type is not allowed." };
if (!/^https?:///i.test(raw)) {
return { ok: false, reason: "Start with https://. A file name alone cannot be opened by a reader." };
}
try {
const url = new URL(raw);
if (!url.hostname.includes(".")) return { ok: false, reason: "That does not look like a full web address." };
return { ok: true, href: url.href };
} catch {
return { ok: false, reason: "That link could not be read. Check for spaces." };
}
}
function normalizeBdMobile(raw) {
let digits = String(raw || "").replace(/[^\d+]/g, "");
if (digits.startsWith("+880")) digits = 0${digits.slice(4)};
else if (digits.startsWith("880")) digits = 0${digits.slice(3)};
return digits;
}
function validMobile(raw) {
return /^01[3-9]\d{8}$/.test(normalizeBdMobile(raw));
}
function validEmail(raw) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(raw);
}
function validate(which) {
const errors = {};
const data = collect();
if (which === 1) {
if (data.contact.name.length < 2) errors.personName = "Put the name of a real person we can write to.";
if (!data.contact.role) errors.role = "Choose the hat you are wearing.";
if (data.venture.name.length < 2) errors.ventureName = "What should the listing call this venture?";
if (data.venture.oneLiner.length < 12) errors.oneLiner = "One plain sentence is enough — what you do, and for whom.";
if (!data.venture.district) errors.district = "Pick a district. Choose overseas if the work is not in Bangladesh.";
if (!validEmail(data.contact.email)) errors.email = "We need an email that can receive a reply.";
if (!validMobile(data.contact.mobile)) errors.mobile = "Use a Bangladesh mobile, like 017XXXXXXXX.";
const site = data.venture.website;
if (site && !classifyUrl(site).ok) errors.website = classifyUrl(site).reason;
}
if (which === 2) {
if (!data.need.sector) errors.sector = "Pick the closest sector. Other is fine.";
if (!data.need.stage) errors.stage = "Where is the venture today?";
if (!data.venture.legalForm) errors.legalForm = "If you are not registered yet, say so. That is allowed.";
if (!data.need.amountBdt || data.need.amountBdt < 10000) {
errors.amountBdt = "Enter the amount in taka. Ten thousand is the smallest figure this form will take.";
}
if (data.need.minimumTicketBdt && data.need.amountBdt && data.need.minimumTicketBdt > data.need.amountBdt) {
errors.minimumTicketBdt = "The smallest cheque cannot be larger than the whole need.";
}
if (data.need.useOfFunds.length < 12) errors.useOfFunds = "Say what the money buys. A line or two is enough.";
if (!data.need.instrument) errors.instrument = "Pick the closest instrument, or Still deciding.";
if (!data.need.shariahClaim) errors.shariahClaim = "Pick a label. Standard is honest if you are not claiming Shariah.";
if (data.need.statedAnnualReturnPct !== null && (data.need.statedAnnualReturnPct < 0 || data.need.statedAnnualReturnPct > 500)) {
errors.statedAnnualReturnPct = "That percentage does not look usable. Leave it blank if you are not quoting one.";
}
}
if (which === 3) {
const presenceUrls = data.presence.map((row) => row.url);
const site = data.venture.website;
const anyPresence = Boolean(site) || presenceUrls.length > 0;
const badPresence = data.presence.map((row) => classifyUrl(row.url)).find((item) => !item.ok);
if (!anyPresence) errors.presence = "Add a website or one social page, so a reader can see you exist.";
else if (badPresence) errors.presence = badPresence.reason;
if (data.proofLinks.length === 0) {
errors.proof = "Add at least one link that supports the proposal. We do not take the file itself.";
} else {
const badProof = data.proofLinks.map((row) => classifyUrl(row.url)).find((item) => !item.ok);
if (badProof) errors.proof = badProof.reason;
}
}
if (which === 4) {
if (!data.consents.truthful) errors.consentTruth = "Tick this only if the packet is true.";
if (!data.consents.noCustody) errors.consentCustody = "This one confirms you know we do not hold funds or files.";
if (!data.consents.publicSummaryAfterReview) errors.consentPublic = "The public card is optional only after review — we still need your yes.";
if (!data.consents.contactForVerification) errors.consentContact = "We can only finish verification if we may write to you.";
}
return errors;
}
function applyErrors(errors) {
form.querySelectorAll("[data-error-for]").forEach((node) => {
node.textContent = "";
});
form.querySelectorAll("[aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));
const keys = Object.keys(errors);
keys.forEach((key) => {
const slot = form.querySelector([data-error-for="${key}"]);
if (slot) slot.textContent = errors[key];
const field = form.querySelector([name="${key}"]);
if (field) field.setAttribute("aria-invalid", "true");
});
if (keys.length) {
const field = form.querySelector([name="${keys[0]}"]) || form.querySelector([data-error-for="${keys[0]}"]);
if (field && field.scrollIntoView) field.scrollIntoView({ behavior: "smooth", block: "center" });
}
return keys.length === 0;
}
function onNext() {
const errors = validate(step);
if (!applyErrors(errors)) return;
if (step < 4) {
go(step + 1);
return;
}
for (const which of) {
const bag = validate(which);
if (Object.keys(bag).length) {
go(which);
applyErrors(bag);
return;
}
}
submit();
}
function go(next, persist = true) {
step = Math.min(4, Math.max(1, next));
form.querySelectorAll(".wiz-step").forEach((panel) => {
const on = Number(panel.dataset.step) === step;
panel.classList.toggle("active", on);
});
const bar = document.getElementById("wiz-bar");
const label = document.getElementById("step-label");
const quote = document.getElementById("step-quote");
const back = document.getElementById("btn-back");
const forward = document.getElementById("btn-next");
if (bar) bar.style.width = ${step * 25}%;
if (label) label.textContent = STEP_TITLES[step - 1];
if (quote) quote.textContent = “${QUOTES[step - 1]}”;
if (back) back.classList.toggle("hidden", step === 1);
if (forward) forward.textContent = step === 4 ? "Save listing packet" : "Continue";
if (step === 4) renderReview();
if (persist) saveDraft();
const wizard = document.getElementById("wizard");
if (wizard && persist) wizard.scrollIntoView({ behavior: "smooth", block: "start" });
}
function bdt(amount) {
const number = Number(amount);
if (!number) return "৳0";
return ৳${number.toLocaleString("en-IN")};
}
function bdtWords(amount) {
const number = Number(amount);
if (!number) return "";
const crore = number / 10000000;
const lakh = number / 100000;
if (crore >= 1) return About ৳${trimNum(crore)} crore;
if (lakh >= 1) return About ৳${trimNum(lakh)} lakh;
return bdt(number);
}
function trimNum(value) {
return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function updateAmountHint() {
const hint = document.getElementById("amount-hint");
if (!hint) return;
const amount = Number(val("amountBdt") || 0);
const min = Number(val("minimumTicketBdt") || 0);
const parts = [];
if (amount) parts.push(bdtWords(amount));
if (min) parts.push(smallest cheque ${bdtWords(min)});
hint.textContent = parts.join(" · ");
}
function updateReturnHint() {
const hint = document.getElementById("return-hint");
if (!hint) return;
const raw = val("statedAnnualReturnPct");
hint.className = "hint";
if (!raw) {
hint.textContent = "Optional. If you leave this blank, the card will not quote a return.";
return;
}
const number = Number(raw);
if (number > 25) {
hint.className = "hint v-caution";
hint.textContent = "Above the 15–25% band shown for private fundraising on Onucrom. The card will mark this as your claim, not a forecast. FDR sits nearer 6–8%.";
return;
}
hint.textContent = "Readers will set this next to FDR rates around 6–8% and treasury yields. It is your claim, not Onucrom’s.";
}
function updateInstrumentHint() {
const hint = document.getElementById("instrument-hint");
if (!hint) return;
const instrument = val("instrument");
if (instrument === "murabaha") {
hint.textContent = "Murabaha is a disclosed cost-plus sale, not an annual yield. If you also fill a return %, say in the use-of-funds line what that number means.";
} else if (instrument === "undecided") {
hint.textContent = "That is fine for a first packet. A person will ask you to name a structure before anything is shown publicly.";
} else if (instrument === "equity") {
hint.textContent = "Equity means a share of the company, not a promised profit rate.";
} else {
hint.textContent = "Pick the closest fit. The public card will use this word, so plain is better than clever.";
}
}
function updateShariahHint() {
const hint = document.getElementById("shariah-hint");
if (!hint) return;
if (val("shariahClaim") === "self-certified") {
hint.textContent = "This will display as Self-certified (yellow), not Compliant (green). Green is only applied later, by Onucrom’s own screen, if you ask for it and the links support it.";
} else {
hint.textContent = "Standard means no Shariah claim. You cannot award yourself the green Compliant mark from this form.";
}
}
function shariahTag(claim) {
if (claim === "self-certified") return { text: "Self-certified", cls: "tag tag-yellow" };
return { text: "Standard", cls: "tag tag-gray" };
}
function renderReview() {
const data = collect();
const name = document.getElementById("pv-name");
const line = document.getElementById("pv-line");
const amount = document.getElementById("pv-amount");
const meta = document.getElementById("pv-meta");
const tag = document.getElementById("pv-shariah");
const note = document.getElementById("pv-note");
if (name) name.textContent = data.venture.name || "Venture name";
if (line) line.textContent = data.venture.oneLiner || "One-line description";
const ret = data.need.statedAnnualReturnPct;
if (amount) {
amount.textContent = data.need.amountBdt
? ${bdt(data.need.amountBdt)}${ret ?  · ${ret}% claimed : ""}
: "Amount not set";
}
if (meta) {
const sector = LABELS.sector[data.need.sector] || "Sector";
const where = data.venture.district || "District";
const instrument = LABELS.instrument[data.need.instrument] || "Instrument";
meta.textContent = ${sector} · ${where} · ${instrument};
}
if (tag) {
const badge = shariahTag(data.need.shariahClaim);
tag.className = badge.cls;
tag.textContent = badge.text;
}
if (note) {
note.textContent = data.contact.showMobilePublicly
? "You chose to show your mobile on the public card. Email still stays off it."
: "Phone and email stay off this card. Only the short public facts would be shown, and only after a person checks the links.";
}
const summary = document.getElementById("human-summary");
if (summary) {
const proofCount = data.proofLinks.length;
const presenceCount = data.presence.length + (data.venture.website ? 1 : 0);
summary.textContent = ${proofCount} proof link${proofCount === 1 ? "" : "s"} · ${presenceCount} public presence link${presenceCount === 1 ? "" : "s"} · ${LABELS.legal[data.venture.legalForm] || "Legal form not set"};
}
const view = document.getElementById("json-view");
if (view) {
view.textContent = JSON.stringify(
{
...data,
id: null,
status: "draft",
submittedAt: null,
_note: "id, status and submittedAt are filled when you save. This is the object an inbox would store.",
},
null,
2,
);
}
}
function dhakaStamp(date = new Date()) {
const parts = new Intl.DateTimeFormat("en-CA", {
timeZone: "Asia/Dhaka",
year: "numeric",
month: "2-digit",
day: "2-digit",
hour: "2-digit",
minute: "2-digit",
second: "2-digit",
hourCycle: "h23",
}).formatToParts(date);
const get = (type) => parts.find((part) => part.type === type)?.value || "00";
return ${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+06:00;
}
function makeId() {
const stamp = dhakaStamp().slice(0, 10).replace(/-/g, "");
const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
return ONU-${stamp}-${rand};
}
function buildStored(id) {
return {
...collect(),
id,
status: "pending-verification",
submittedAt: dhakaStamp(),
locale: "en-BD",
client: {
source: "list-your-need.html",
userAgent: navigator.userAgent.slice(0, 180),
},
};
}
function storageMode() {
if (STORAGE.sheetWebhookUrl) return "sheet";
if (STORAGE.endpointUrl) return "endpoint";
return "local-only";
}
function updateStorageBadge() {
const badge = document.getElementById("storage-status");
if (!badge) return;
const mode = storageMode();
if (mode === "local-only") {
badge.className = "tag tag-yellow";
badge.textContent = "Inbox not connected — this browser only";
} else if (mode === "sheet") {
badge.className = "tag tag-green";
badge.textContent = "Google Sheet inbox connected";
} else {
badge.className = "tag tag-green";
badge.textContent = "HTTPS inbox connected";
}
}
async function deliver(packet) {
if (STORAGE.sheetWebhookUrl) {
await fetch(STORAGE.sheetWebhookUrl, {
method: "POST",
mode: "no-cors",
body: JSON.stringify(packet),
});
return { channel: "sheet", confirmed: false };
}
if (STORAGE.endpointUrl) {
const headers = { "Content-Type": "application/json" };
if (STORAGE.endpointSecret) headers["X-Onucrom-Secret"] = STORAGE.endpointSecret;
const response = await fetch(STORAGE.endpointUrl, {
method: "POST",
headers,
body: JSON.stringify(packet),
});
if (!response.ok) throw new Error(Inbox responded ${response.status});
return { channel: "endpoint", confirmed: true };
}
return { channel: "local-only", confirmed: false };
}
function readOutbox() {
try {
const parsed = JSON.parse(localStorage.getItem(STORAGE.outboxKey) || "[]");
return Array.isArray(parsed) ? parsed : [];
} catch {
return [];
}
}
function pushOutbox(packet) {
const next = [packet, ...readOutbox()].slice(0, 20);
localStorage.setItem(STORAGE.outboxKey, JSON.stringify(next));
}
async function submit() {
const button = document.getElementById("btn-next");
if (button) {
button.disabled = true;
button.textContent = "Saving…";
}
const packet = buildStored(makeId());
lastPacket = packet;
try {
localStorage.removeItem(STORAGE.draftKey);
pushOutbox(packet);
const result = await deliver(packet);
showDone(packet, result, "");
} catch (error) {
pushOutbox(packet);
showDone(packet, { channel: storageMode(), confirmed: false }, error.message || "The inbox could not be reached.");
} finally {
if (button) button.disabled = false;
}
}
function showDone(packet, result, errorText) {
document.getElementById("wizard").classList.add("hidden");
document.getElementById("page-hero").classList.add("hidden");
const done = document.getElementById("done");
done.classList.remove("hidden");
document.getElementById("done-id").textContent = packet.id;
const status = document.getElementById("done-status");
if (errorText) {
status.textContent = Saved on this browser, but the inbox did not accept it (${errorText}). Download the JSON and send it by email.;
} else if (result.channel === "sheet") {
status.textContent = "Saved on this browser and handed to the Google Sheet URL. That inbox does not send a readable reply, so open the sheet and confirm a new row before you tell the venture it arrived.";
} else if (result.channel === "endpoint" && result.confirmed) {
status.textContent = "Saved on this browser and accepted by the connected inbox. It is still pending a person’s verification — nothing is public yet.";
} else {
status.textContent = "Saved on this browser only. sheetWebhookUrl and endpointUrl are still empty, so Onucrom has not received it. Download the JSON, or email the desk and attach the file.";
}
document.getElementById("done-json").textContent = JSON.stringify(packet, null, 2);
done.scrollIntoView({ behavior: "smooth", block: "start" });
}
function downloadPacket() {
if (!lastPacket) return;
const blob = new Blob([JSON.stringify(lastPacket, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = ${lastPacket.id}.json;
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);
}
async function copyPacket() {
if (!lastPacket) return;
const text = JSON.stringify(lastPacket, null, 2);
const button = document.getElementById("btn-copy");
try {
await navigator.clipboard.writeText(text);
if (button) button.textContent = "Copied";
} catch {
const area = document.createElement("textarea");
area.value = text;
document.body.appendChild(area);
area.select();
document.execCommand("copy");
area.remove();
if (button) button.textContent = "Copied";
}
setTimeout(() => {
if (button) button.textContent = "Copy JSON";
}, 1600);
}
function emailDesk() {
if (!lastPacket) return;
const subject = Investment need ${lastPacket.id};
const body = [
Reference: ${lastPacket.id},
Venture: ${lastPacket.venture.name},
District: ${lastPacket.venture.district},
Amount (BDT): ${lastPacket.need.amountBdt},
"",
"The JSON packet is attached (downloaded from the form). Onucrom does not host the documents — the proof is in the links inside the file.",
"",
"This message was prepared by list-your-need.html.",
].join("\n");
window.location.href = mailto:${STORAGE.notifyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)};
}
function saveDraft() {
if (!form || form.dataset.bound !== "1") return;
if (document.getElementById("done") && !document.getElementById("done").classList.contains("hidden")) return;
const packet = collect();
const empty = !packet.contact.name && !packet.venture.name && !packet.venture.oneLiner;
if (empty) return;
const draft = { savedAt: dhakaStamp(), step, packet };
try {
localStorage.setItem(STORAGE.draftKey, JSON.stringify(draft));
} catch {
/* Private mode or full disk catch */
}
}
function restoreDraft() {
let draft;
try {
draft = JSON.parse(localStorage.getItem(STORAGE.draftKey) || "null");
} catch {
return 0;
}
if (!draft || !draft.packet) return 0;
applyPacket(draft.packet);
return draft.step || 1;
}
function applyPacket(packet) {
const set = (name, value) => {
const el = form.querySelector([name="${name}"]);
if (el && "value" in el) el.value = value == null ? "" : value;
};
set("personName", packet.contact?.name);
set("email", packet.contact?.email);
set("mobile", packet.contact?.mobile);
set("ventureName", packet.venture?.name);
set("oneLiner", packet.venture?.oneLiner);
set("district", packet.venture?.district);
set("area", packet.venture?.area);
set("registryId", packet.venture?.registryId);
set("tinOrBin", packet.venture?.tinOrBin);
set("website", packet.venture?.website);
set("sector", packet.need?.sector);
set("amountBdt", packet.need?.amountBdt || "");
set("minimumTicketBdt", packet.need?.minimumTicketBdt || "");
set("useOfFunds", packet.need?.useOfFunds);
set("targetClose", packet.need?.targetClose);
set("statedAnnualReturnPct", packet.need?.statedAnnualReturnPct || "");
setPill("role", packet.contact?.role || "");
setPill("stage", packet.need?.stage || "");
setPill("legalForm", packet.venture?.legalForm || "");
setPill("instrument", packet.need?.instrument || "");
setPill("shariahClaim", packet.need?.shariahClaim || "");
const show = form.querySelector('[name="showMobile"]');
if (show) show.checked = Boolean(packet.contact?.showMobilePublicly);
["consentTruth", "consentCustody", "consentPublic", "consentContact"].forEach((name) => {
const box = form.querySelector([name="${name}"]);
if (box) box.checked = false;
});
const presence = document.getElementById("presence-list");
presence.innerHTML = "";
const presenceRows = packet.presence?.length ? packet.presence : [{ platform: "facebook", url: "" }];
presenceRows.forEach((row) => presence.appendChild(presenceRow(row.platform, row.url)));
const proof = document.getElementById("proof-list");
proof.innerHTML = "";
const proofRows = packet.proofLinks?.length ? packet.proofLinks : [{ kind: "proposal", url: "", label: "" }];
proofRows.forEach((row) => proof.appendChild(proofRow(row.kind, row.url, row.label)));
onFormInput({ target: null });
}
function fillSample() {
applyPacket(SAMPLE);
const banner = document.getElementById("draft-banner");
if (banner) {
banner.classList.remove("hidden");
const text = banner.querySelector("span");
if (text) text.textContent = "Sample packet filled — Fatullah Loom Works is fictional. Replace it before you save a real one.";
}
go(1, false);
saveDraft();
}
function clearDraft(resetFields) {
localStorage.removeItem(STORAGE.draftKey);
const banner = document.getElementById("draft-banner");
if (banner) banner.classList.add("hidden");
if (resetFields) resetForm();
}
function resetForm() {
localStorage.removeItem(STORAGE.draftKey);
lastPacket = null;
form.reset();
setPill("role", "");
setPill("stage", "");
setPill("legalForm", "");
setPill("instrument", "");
setPill("shariahClaim", "");
document.getElementById("presence-list").innerHTML = "";
document.getElementById("proof-list").innerHTML = "";
ensureRows();
document.getElementById("done").classList.add("hidden");
document.getElementById("wizard").classList.remove("hidden");
document.getElementById("page-hero").classList.remove("hidden");
const banner = document.getElementById("draft-banner");
if (banner) banner.classList.add("hidden");
applyErrors({});
updateAmountHint();
updateReturnHint();
updateInstrumentHint();
updateShariahHint();
go(1, false);
}
function showOutbox() {
const view = document.getElementById("outbox-view");
const rows = readOutbox();
view.classList.remove("hidden");
view.textContent = rows.length
? JSON.stringify(rows, null, 2)
: "No packets on this browser yet. Save a listing packet and it will land here.";
}
window.initOnuListNeed = initOnuListNeed;
initOnuListNeed();
