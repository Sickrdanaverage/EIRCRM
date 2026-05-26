const { useState, useEffect, useRef, useMemo, useCallback } = React;
const Papa = window.Papa;

if (typeof window !== 'undefined' && !window.storage) window.storage = null;

// ── SUPABASE CLOUD SYNC CONFIGURATION ──────────────────────────────────────────
const supabaseUrl = 'https://zgavttwcdhrsarupbvrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYXZ0d2NkaHJzYXJ1cGJ2cnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTg3MDYsImV4cCI6MjA5NTM5NDcwNn0.T-PtsnleJ2g3AQN1KtFv9OoEr59C9J1vk8naCQTEVbI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ── CRM ENGINE CONSTANTS ───────────────────────────────────────────────────────
const STAGES = ["Prospect", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const SC = { Prospect: "#818cf8", Contacted: "#38bdf8", Qualified: "#fbbf24", Proposal: "#a78bfa", Negotiation: "#f472b6", "Closed Won": "#34d399", "Closed Lost": "#f87171" };
const SB = { Prospect: "#eef2ff", Contacted: "#e0f2fe", Qualified: "#fef3c7", Proposal: "#ede9fe", Negotiation: "#fce7f3", "Closed Won": "#d1fae5", "Closed Lost": "#fee2e2" };
const INDS = ["Technology", "Retail", "Healthcare", "Finance", "Manufacturing", "Hospitality", "Construction", "Education", "Professional Services", "Logistics", "Other"];
const CNTS = ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Kilkenny", "Wicklow", "Kildare", "Meath", "Clare", "Tipperary", "Wexford", "Other"];

const COUNTY_AREAS = {
  "Dublin": [
    "Dublin City Centre", "Dublin 1", "Dublin 2", "Dublin 4", "Dublin 6", "Dublin 8", "Dublin 9",
    "Ballsbridge", "Donnybrook", "Ranelagh", "Rathmines", "Sandymount",
    "Tallaght", "Dundrum", "Clondalkin", "Blanchardstown", "Swords", "Lucan",
    "Malahide", "Skerries", "Balbriggan", "Howth", "Portmarnock", "Sutton",
    "Dun Laoghaire", "Blackrock", "Stillorgan", "Sandyford", "Templeogue", "Rathfarnham",
    "Crumlin", "Drumcondra", "Finglas", "Glasnevin", "Clontarf", "Raheny",
    "Castleknock", "Phibsborough", "Inchicore", "Ballyfermot",
    "Ashbourne", "Ratoath", "Dunshaughlin", "Maynooth", "Leixlip", "Celbridge",
    "Bray", "Greystones", "Naas", "Newbridge"
  ],
  "Cork": ["Cork City", "Cork City Centre", "Douglas", "Ballincollig", "Carrigaline", "Bishopstown", "Midleton", "Mallow", "Cobh", "Youghal", "Bantry", "Macroom", "Bandon", "Kinsale", "Skibbereen", "Clonakilty", "Mitchelstown", "Fermoy", "Charleville", "Blarney"],
  "Galway": ["Galway City", "Galway City Centre", "Salthill", "Knocknacarra", "Oranmore", "Loughrea", "Tuam", "Ballinasloe", "Athenry", "Headford", "Clifden", "Gort", "Spiddal", "Moycullen"],
  "Limerick": ["Limerick City", "Limerick City Centre", "Castletroy", "Dooradoyle", "Raheen", "Annacotty", "Newcastle West", "Adare", "Kilmallock", "Abbeyfeale", "Rathkeale", "Patrickswell"],
  "Waterford": ["Waterford City", "Waterford City Centre", "Tramore", "Dungarvan", "Lismore", "Cappoquin", "Portlaw", "Kilmacthomas", "Dunmore East", "Ardmore", "Tallow"],
  "Kilkenny": ["Kilkenny City", "Kilkenny City Centre", "Castlecomer", "Thomastown", "Callan", "Graiguenamanagh", "Bennettsbridge", "Mooncoin", "Mullinavat", "Urlingford"],
  "Wicklow": ["Bray", "Greystones", "Wicklow Town", "Arklow", "Blessington", "Newtownmountkennedy", "Rathdrum", "Aughrim", "Ashford", "Roundwood", "Enniskerry", "Kilcoole"],
  "Kildare": ["Naas", "Newbridge", "Maynooth", "Leixlip", "Celbridge", "Kildare Town", "Athy", "Monasterevin", "Kilcock", "Clane", "Sallins", "Kilcullen", "Rathangan"],
  "Meath": ["Navan", "Trim", "Kells", "Ashbourne", "Ratoath", "Dunshaughlin", "Dunboyne", "Laytown", "Bettystown", "Slane", "Stamullen", "Enfield", "Athboy", "Oldcastle"],
  "Clare": ["Ennis", "Shannon", "Newmarket-on-Fergus", "Sixmilebridge", "Kilrush", "Kilkee", "Lahinch", "Ennistymon", "Tulla", "Scariff", "Killaloe", "Corofin"],
  "Tipperary": ["Clonmel", "Thurles", "Nenagh", "Tipperary Town", "Carrick-on-Suir", "Cashel", "Cahir", "Roscrea", "Templemore", "Fethard", "Newport", "Borrisokane"],
  "Wexford": ["Wexford Town", "Enniscorthy", "New Ross", "Gorey", "Bunclody", "Ferns", "Rosslare", "Courtown", "Kilmuckridge", "Taghmon"],
  "Other": []
};

const ATYPES = ["call", "email", "meeting", "demo", "proposal sent", "follow-up", "site visit"];
const AICO = { call: "📞", email: "📧", meeting: "🤝", demo: "💻", "proposal sent": "📄", "follow-up": "🔔", "site visit": "📍" };

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0c10" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f1f1a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2433" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1829" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#1e3a5f" }] },
];

const loadMarkerClusterer = () => {
  return new Promise((resolve, reject) => {
    if (window.markerClusterer) { resolve(window.markerClusterer); return; }
    const existing = document.querySelector("script[data-mc]");
    if (existing) { existing.addEventListener("load", () => resolve(window.markerClusterer)); return; }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@googlemaps/markerclusterer@2.5.3/dist/index.umd.js";
    s.async = true; s.setAttribute("data-mc", "true");
    s.onload = () => resolve(window.markerClusterer);
    s.onerror = () => reject(new Error("Failed to load MarkerClusterer"));
    document.head.appendChild(s);
    setTimeout(() => { if (!window.markerClusterer) reject(new Error("MarkerClusterer load timeout")); }, 8000);
  });
};

const loadGoogleMapsJS = (key) => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) { resolve(window.google.maps); return; }
    const existing = document.querySelector("script[data-gmaps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps JS")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async&v=weekly&callback=__gmReady__`;
    s.async = true; s.defer = true;
    s.setAttribute("data-gmaps", "true");
    window.__gmReady__ = () => resolve(window.google.maps);
    s.onerror = () => reject(new Error("Script load blocked — likely CSP (use the standalone HTML)"));
    document.head.appendChild(s);
    setTimeout(() => { if (!window.google?.maps?.Map) reject(new Error("Timeout — script blocked by browser sandbox")); }, 8000);
  });
};

const PRIS = ["Low", "Medium", "High", "Critical"];
const PCOL = { Low: "#6b7280", Medium: "#3b82f6", High: "#f59e0b", Critical: "#ef4444" };
const TMPLS = [{ id: "cold", label: "Cold Outreach", icon: "🧊", desc: "First contact" }, { id: "followup", label: "Follow-Up", icon: "🔔", desc: "Chase no response" }, { id: "postmeet", label: "Post-Meeting", icon: "🤝", desc: "Recap after call" }, { id: "proposal", label: "Proposal Follow-Up", icon: "📄", desc: "Chase sent proposal" }, { id: "winback", label: "Win-Back", icon: "🔄", desc: "Re-engage quiet lead" }, { id: "checkin", label: "Check-In", icon: "📅", desc: "Nurture long-term" }];

const CATEGORIES = {
  "Technology": { color: "#3b82f6", subs: ["Software Development", "IT Services", "Cybersecurity", "SaaS / Cloud", "Tech Startup", "Managed Services", "Web/Digital Agency", "E-commerce"] },
  "Legal": { color: "#a855f7", subs: ["Solicitors", "Barristers", "Conveyancing", "Family Law", "Personal Injury", "Commercial Law", "Criminal Law", "Property Law"] },
  "Healthcare": { color: "#ef4444", subs: ["GP Practice", "Specialist Clinic", "Dental Practice", "Physiotherapy", "Diagnostic", "Mental Health", "Veterinary", "Pharmacy"] },
  "Hospitality": { color: "#f59e0b", subs: ["Hotel", "Restaurant", "Cafe", "Pub / Bar", "Catering", "Bed & Breakfast", "Event Venue", "Fast Food"] },
  "Retail": { color: "#ec4899", subs: ["Fashion / Clothing", "Electronics", "Speciality Store", "Convenience Store", "Department Store", "Boutique", "Gift Shop", "Home & Garden"] },
  "Finance": { color: "#10b981", subs: ["Accountants", "Financial Advisors", "Tax Consultants", "Audit", "Wealth Management", "Insurance", "Mortgage Brokers", "Bookkeeping"] },
  "Construction": { color: "#f97316", subs: ["General Contractor", "Electrical", "Plumbing", "Architectural", "Civil Engineering", "Roofing", "Landscaping", "Painting & Decorating"] },
  "Manufacturing": { color: "#64748b", subs: ["Industrial", "Engineering", "Fabrication", "Production", "Food Production", "Pharmaceutical", "Precision Engineering"] },
  "Professional Services": { color: "#06b6d4", subs: ["Consulting", "Marketing Agency", "Creative Agency", "HR Consultancy", "Recruitment", "Business Coaching", "PR / Communications", "Translation"] },
  "Logistics": { color: "#8b5cf6", subs: ["Transport", "Warehousing", "Courier", "Shipping", "Haulage", "Freight", "Distribution", "Removals"] },
  "Education": { color: "#14b8a6", subs: ["School", "College / University", "Training Centre", "Language School", "Tutoring", "Childcare", "Vocational"] },
  "Automotive": { color: "#dc2626", subs: ["Car Dealership", "Garage / Mechanic", "Body Shop", "Tyre Centre", "Car Wash", "Car Rental", "Motor Factor"] },
  "Real Estate": { color: "#eab308", subs: ["Estate Agents", "Property Management", "Letting Agents", "Commercial Property", "Auctioneers", "Surveyors", "Architects"] },
  "Beauty & Wellness": { color: "#f472b6", subs: ["Salon", "Spa", "Barbershop", "Gym", "Yoga / Pilates", "Nail Bar", "Beauty Clinic"] },
  "Other": { color: "#64748b", subs: ["Other"] },
};

const CAT_ORDER = Object.keys(CATEGORIES);

const PRODUCTS = {
  "FTTH": { category: "Broadband", color: "#3b82f6", icon: "🌐", targetType: "broadband", description: "Fibre to the Home" },
  "FTTC": { category: "Broadband", color: "#06b6d4", icon: "🌐", targetType: "broadband", description: "Fibre to the Cabinet" },
  "NBI": { category: "Broadband", color: "#0ea5e9", icon: "🌐", targetType: "broadband", description: "National Broadband Ireland" },
  "5G POD": { category: "Broadband", color: "#8b5cf6", icon: "📡", targetType: "broadband", description: "5G Fixed Wireless" },
  "SIMO": { category: "Mobile", color: "#10b981", icon: "📱", targetType: "mobile_simo", description: "SIM Only — €20 per processed" },
  "Handset": { category: "Mobile", color: "#059669", icon: "📲", targetType: "mobile_handset", description: "Mobile + device — €50 per RGU" },
  "VOIP": { category: "Voice", color: "#a855f7", icon: "☎️", targetType: "voice", description: "VoIP / Hosted PBX" },
  "Landline": { category: "Voice", color: "#c084fc", icon: "📞", targetType: "voice", description: "Business landline" },
};

const PRODUCT_LIST = Object.keys(PRODUCTS);
const PRODUCT_CATEGORIES = ["Broadband", "Mobile", "Voice"];

const BROADBAND_TIERS = [
  { threshold: 1.30, label: "130%", perVisit: 160, monthly: 4160, yearly: 54080, color: "#10b981" },
  { threshold: 1.20, label: "120%", perVisit: 135, monthly: 3240, yearly: 42120, color: "#22c55e" },
  { threshold: 1.10, label: "110%", perVisit: 100, monthly: 2200, yearly: 28600, color: "#84cc16" },
  { threshold: 1.00, label: "100%", perVisit: 75, monthly: 1500, yearly: 19500, color: "#eab308" },
  { threshold: 0.90, label: "90%", perVisit: 30, monthly: 540, yearly: 7020, color: "#f59e0b" },
  { threshold: 0, label: "<90%", perVisit: 0, monthly: 0, yearly: 0, color: "#64748b" },
];

const MOBILE_TIERS = [
  { label: "15+ products + 2+ handsets", payoutPct: 100, color: "#10b981", path: "A", check: r => r.mobileCount >= 15 && r.handsetCount >= 2 },
  { label: "20+ SIMOs (no handset needed)", payoutPct: 100, color: "#10b981", path: "B", check: r => r.simoCount >= 20 },
  { label: "10–14 products + 2+ handsets", payoutPct: 50, color: "#f59e0b", path: "A", check: r => r.mobileCount >= 10 && r.handsetCount >= 2 },
  { label: "Below mobile target", payoutPct: 0, color: "#64748b", path: "-", check: r => true },
];

const SIMO_RATE = 20;
const HANDSET_RATE = 50;

const BUSINESS_TYPES = {
  "LTD": {
    label: "LTD Company", color: "#3b82f6", bgLight: "#dbeafe", icon: "🏢", description: "Limited Company — must be verified on CRO",
    sections: [
      {
        title: "Company verification",
        items: [
          { id: "ltd_crn", label: "Valid Company Registration Number & current listed directors checked", required: true, links: [{ url: "https://core.cro.ie/", label: "CRO" }, { url: "https://www.stubbsgazette.ie/", label: "Stubbs Gazette" }, { url: "https://www.solocheck.ie/", label: "SoloCheck" }] },
          { id: "ltd_status", label: "Status checked: Active/Normal — NOT Dissolved", required: true },
          { id: "ltd_name_match", label: "Company name matches CRO website EXACTLY", required: true },
          { id: "ltd_signatory", label: "Contract signed by authorised signatory ONLY (Director's Authorisation Email attached if not a listed Director)", required: true },
        ],
      },
      {
        title: "Proof of Address — All mobile sales & when available for fixed sales",
        items: [
          { id: "ltd_poa_recent", label: "Dated within the last 3 months", required: true },
          { id: "ltd_poa_name", label: "Matches registered company name on CRO & authorised signatory name", required: true },
          { id: "ltd_poa_address", label: "Matches service address & Eircode", required: true },
        ],
      },
      {
        title: "Eircode",
        items: [
          { id: "ltd_eircode_match", label: "Eircode matches the exact premises", required: true },
          { id: "ltd_eircode_single", label: "No multiple Eircodes on one R6 account", required: true },
          { id: "ltd_eircode_caf", label: "Each Eircode has a separate LBF & Salesforce CAF", required: true },
        ],
      },
      {
        title: "Proof of ID — All mobile sales (& DOB for NBI sales)",
        items: [{ id: "ltd_id_type", label: "Passport or Driving Licence ONLY & in date", required: true }],
      },
      {
        title: "IBAN (Irish ONLY) — ALL SALES including Add Subs",
        items: [{ id: "ltd_iban", label: "Irish IBAN validated", required: true, links: [{ url: "https://www.ibancalculator.com/", label: "IBAN Calculator" }] }],
      },
    ],
  },
  "SoleTrader": {
    label: "Sole Trader / CLG / Partnership / Unlimited", color: "#8b5cf6", bgLight: "#ede9fe", icon: "👤", description: "Sole trader, CLG, partnership, or unlimited company",
    sections: [
      {
        title: "VAT & business registration",
        items: [
          { id: "st_vat", label: "VAT Number provided (if VAT registered)", required: false, links: [{ url: "https://ec.europa.eu/taxation_customs/vies/#/vat-validation", label: "VAT VIES Check" }] },
          { id: "st_reg_letter", label: "Letter from Accountant / Business Reg Cert / Business Reg Number (if below VAT threshold)", required: true },
        ],
      },
      {
        title: "Proof of Address — ALL SALES",
        items: [
          { id: "st_poa_recent", label: "Dated within the last 3 months", required: true },
          { id: "st_poa_name", label: "Matches business name & authorised signatory name", required: true },
          { id: "st_poa_address", label: "Matches service address & Eircode", required: true },
        ],
      },
      {
        title: "Eircode",
        items: [
          { id: "st_eircode_match", label: "Eircode matches the exact premises", required: true },
          { id: "st_eircode_single", label: "No multiple Eircodes on one R6 account", required: true },
          { id: "st_eircode_caf", label: "Each Eircode has a separate LBF & Salesforce CAF", required: true },
        ],
      },
      {
        title: "Proof of ID — ALL SALES",
        items: [{ id: "st_id_type", label: "Passport or Driving Licence ONLY & in date", required: true }],
      },
      {
        title: "CLG & Unlimited Company ONLY",
        items: [
          { id: "st_clg_crn", label: "Valid Company Registration Number, status & current directors checked", required: false, links: [{ url: "https://core.cro.ie/", label: "CRO" }] },
          { id: "st_clg_signatory", label: "Name matches CRO & contract signed by authorised signatory ONLY (Director's Auth Email if not a listed Director)", required: false },
        ],
      },
      {
        title: "IBAN (Irish ONLY) — ALL SALES including Add Subs",
        items: [{ id: "st_iban", label: "Irish IBAN validated", required: true, links: [{ url: "https://www.ibancalculator.com/", label: "IBAN Calculator" }] }],
      },
    ],
  },
};

const complianceStatus = (lead) => {
  if (!lead?.businessType || !BUSINESS_TYPES[lead.businessType]) return null;
  const def = BUSINESS_TYPES[lead.businessType];
  const checked = lead.checklist || {};
  let requiredTotal = 0, requiredDone = 0, optionalDone = 0;
  for (const sec of def.sections) {
    for (const item of sec.items) {
      if (item.required) { requiredTotal++; if (checked[item.id]) requiredDone++; }
      else if (checked[item.id]) optionalDone++;
    }
  }
  const pct = requiredTotal > 0 ? Math.round(requiredDone / requiredTotal * 100) : 0;
  return { businessType: lead.businessType, def, requiredTotal, requiredDone, optionalDone, pct, isReady: requiredDone === requiredTotal && requiredTotal > 0 };
};

const calcEarnings = (processedProducts, targetVisits = 1) => {
  const r = { broadbandCount: 0, mobileCount: 0, handsetCount: 0, simoCount: 0, voiceCount: 0 };
  for (const p of processedProducts) {
    const def = PRODUCTS[p.type]; if (!def) continue;
    const qty = p.quantity || 1;
    if (def.targetType === "broadband") r.broadbandCount += qty;
    else if (def.targetType === "mobile_simo") { r.simoCount += qty; r.mobileCount += qty; }
    else if (def.targetType === "mobile_handset") { r.handsetCount += qty; r.mobileCount += qty; }
    else if (def.targetType === "voice") r.voiceCount += qty;
  }
  const bbRatio = targetVisits > 0 ? r.broadbandCount / targetVisits : 0;
  const bbTier = BROADBAND_TIERS.find(t => bbRatio >= t.threshold) || BROADBAND_TIERS[BROADBAND_TIERS.length - 1];
  let mbTier = MOBILE_TIERS[MOBILE_TIERS.length - 1];
  for (const t of MOBILE_TIERS) { if (t.check(r)) { mbTier = t; break; } }
  const simoEarn = r.simoCount * SIMO_RATE * (mbTier.payoutPct / 100);
  const handsetEarn = r.handsetCount * HANDSET_RATE * (mbTier.payoutPct / 100);
  const mobileTotal = simoEarn + handsetEarn;
  const bbBonus = bbTier.perVisit * targetVisits;
  return { ...r, bbRatio, broadbandTier: bbTier, mobileTier: mbTier, mobilePayoutPct: mbTier.payoutPct, simoEarnings: simoEarn, handsetEarnings: handsetEarn, totalMobile: mobileTotal, broadbandBonus: bbBonus, total: mobileTotal + bbBonus, targetVisits };
};

// ... Rest of your component logic, state declarations, and rendering blocks continue down from here ...
export default function App() {
  // Application layer UI rendering here
  return (
    <div>
       {/* Full eirCRM Component Tree Structure */}
    </div>
  );
}