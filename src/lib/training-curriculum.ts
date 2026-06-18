// Alabama Aviation Sandbox — Private Pilot Curriculum (FAA Part 61)
export type Quiz = {
  question: string;
  /** Optional illustrative image shown above the question text (URL or data URI). */
  image?: string;
  /** Optional caption rendered under the question image. */
  imageCaption?: string;
  options: string[];
  /** Optional per-option image (parallel to `options`). Renders alongside the option label. */
  optionImages?: string[];
  correct: number;
};

export type Module = {
  id: string;
  title: string;
  summary: string;
  body: string;
  highlights?: string[];
  quizzes: Quiz[];
  tracker?: boolean;
  maneuvers?: string[];
};

// Tiny inline SVG helpers so visual quizzes work offline with zero deps.
const svg = (inner: string, w = 220, h = 140) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`,
  )}`;

const WINDSOCK_FULL = svg(
  `<rect width="220" height="140" fill="#0b1220"/><line x1="40" y1="120" x2="40" y2="40" stroke="#d4af37" stroke-width="3"/><polygon points="40,40 180,55 180,95 40,80" fill="#e94560" opacity="0.85"/><text x="110" y="135" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Sock fully extended, horizontal</text>`,
);
const WINDSOCK_PARTIAL = svg(
  `<rect width="220" height="140" fill="#0b1220"/><line x1="40" y1="120" x2="40" y2="40" stroke="#d4af37" stroke-width="3"/><polygon points="40,40 150,70 150,95 40,80" fill="#e94560" opacity="0.85"/><text x="110" y="135" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Sock partially drooping</text>`,
);

// Cloud silhouettes for cloud-type recognition.
const CB = svg(
  `<rect width="220" height="140" fill="#0b1220"/><path d="M30,110 Q40,60 90,55 Q110,15 150,30 Q200,30 200,80 Q210,110 180,115 L40,115 Z" fill="#e6e6e6"/><text x="110" y="135" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Towering anvil top</text>`,
);
const CIRRUS = svg(
  `<rect width="220" height="140" fill="#0b1220"/><path d="M20,60 Q60,40 100,55 Q140,40 180,60" stroke="#e6e6e6" stroke-width="3" fill="none"/><path d="M30,80 Q70,70 110,82 Q150,70 190,82" stroke="#e6e6e6" stroke-width="3" fill="none"/><text x="110" y="120" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Wispy, high altitude</text>`,
);
const STRATUS = svg(
  `<rect width="220" height="140" fill="#0b1220"/><rect x="10" y="60" width="200" height="22" fill="#cfcfcf"/><rect x="10" y="85" width="200" height="14" fill="#bdbdbd"/><text x="110" y="130" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Flat, uniform layer</text>`,
);
const CUMULUS = svg(
  `<rect width="220" height="140" fill="#0b1220"/><circle cx="80" cy="80" r="28" fill="#e6e6e6"/><circle cx="115" cy="70" r="32" fill="#e6e6e6"/><circle cx="150" cy="85" r="26" fill="#e6e6e6"/><text x="110" y="130" fill="#9aa0a6" font-family="sans-serif" font-size="11" text-anchor="middle">Puffy fair-weather</text>`,
);

export const MODULES: Module[] = [
  {
    id: "m1",
    title: "Eligibility & Medical",
    summary: "Age, medical certificate, language, background — what's required to start.",
    body: `To begin Private Pilot License (PPL) training under FAA Part 61, you must:

• Be at least 17 years old to earn a PPL (16 to fly solo)
• Hold a current FAA Third Class Medical Certificate from an Aviation Medical Examiner (AME)
• Read, speak, write, and understand English
• Complete TSA security vetting (Alien Flight Student Program for non-US citizens)
• Basic math: addition, multiplication, division — used for weight & balance and flight planning

Find an AME near you using the FAA AME Locator. Alabama training partners include Auburn University Aviation, Executive Flight Center (Huntsville), Tuscaloosa Flight School, and the Birmingham Flight Center at BHM.`,
    highlights: ["17+ for PPL", "3rd Class Medical", "English proficiency", "TSA check (non-US)"],
    quizzes: [
      { question: "Minimum age to earn a Private Pilot License?", options: ["14", "16", "17", "21"], correct: 2 },
      { question: "Which medical class does a PPL require?", options: ["First Class", "Second Class", "Third Class", "BasicMed only"], correct: 2 },
      { question: "Who issues your FAA medical certificate?", options: ["Your family doctor", "An AME", "The DPE", "The TSA"], correct: 1 },
    ],
  },
  {
    id: "m2",
    title: "Ground School",
    summary: "Aerodynamics, systems, weather, FAR/AIM, navigation, radio comms.",
    body: `Ground school covers the academic core of flying. Six required domains:

1. Aerodynamics & Principles of Flight — lift, drag, thrust, weight, stalls, load factor
2. Aircraft Systems & Instruments — powerplant, electrical, vacuum, pitot-static, six-pack
3. Aviation Weather — METAR/TAF, fronts, icing, thunderstorms, density altitude
4. Navigation — VFR sectional charts, pilotage, dead reckoning, VOR, GPS
5. FAR/AIM — Part 61 (certification), Part 91 (general operating rules), Part 141 (schools)
6. Airport Operations & Radio Communications — pattern entry, CTAF, ATIS, ATC phraseology`,
    highlights: ["6 academic domains", "FAR Part 61/91/141", "VFR sectional charts", "ATC phraseology"],
    quizzes: [
      { question: "Which force opposes lift?", options: ["Thrust", "Weight", "Drag", "Yaw"], correct: 1 },
      { question: "VFR stands for?", options: ["Visual Flight Rules", "Vertical Flight Reference", "Vector Flight Range", "Variable Flight Rate"], correct: 0 },
      { question: "Standard sea-level pressure (inHg)?", options: ["28.92", "29.92", "30.92", "31.92"], correct: 1 },
      { question: "FAR Part governing private pilot certification?", options: ["Part 61", "Part 91", "Part 121", "Part 135"], correct: 0 },
      { question: "CTAF is used at airports without...?", options: ["Runways", "A control tower", "Fuel", "Lights"], correct: 1 },
      {
        question: "Based on the windsock below, what wind condition is shown?",
        image: WINDSOCK_FULL,
        imageCaption: "Wind sock fully extended and horizontal",
        options: ["Calm / no wind", "Light wind ~5 kt", "Moderate-to-strong wind (15 kt+)", "Tailwind only"],
        correct: 2,
      },
      {
        question: "Identify the cloud type associated with thunderstorm activity:",
        options: ["Cirrus", "Stratus", "Cumulonimbus", "Fair-weather cumulus"],
        optionImages: [CIRRUS, STRATUS, CB, CUMULUS],
        correct: 2,
      },
    ],
  },
  {
    id: "m3",
    title: "Flight Hours Requirements",
    summary: "Minimum 40 hours — instructor, solo, cross-country, night, instrument, test prep.",
    body: `FAA Part 61.109 minimums for Private Pilot — Airplane Single-Engine Land:

• 40 total flight hours
• 20 hours of dual instruction with a CFI
• 10 hours of solo flight time
• 3 hours cross-country dual
• 5 hours solo cross-country (with one leg ≥ 50 NM, full-stop landings at 3 points, one ≥ 50 NM)
• 3 hours of night flight (10 takeoffs / 10 landings to full stop)
• 3 hours of basic instrument training
• 3 hours of test prep within 60 days of the checkride

Nationally the average is ~70 hours — log honestly; quality matters more than minimums.`,
    highlights: ["40 hr minimum", "20 dual + 10 solo", "Night: 10 takeoffs/landings", "3 hr instrument"],
    tracker: true,
    quizzes: [],
  },
  {
    id: "m4",
    title: "Written Knowledge Test (PAR)",
    summary: "60-question FAA knowledge test — 70% to pass — register via IACRA.",
    body: `The Private Pilot Airplane (PAR) written exam is 60 multiple-choice questions, 2.5 hours, computer-based at a PSI testing center.

Subject categories: regulations, weather, navigation, performance, aerodynamics, weight & balance, human factors, ADM (aeronautical decision making).

Pre-requisites:
• Endorsement from your CFI confirming you completed ground training
• FTN (FAA Tracking Number) — register at iacra.faa.gov
• Government-issued photo ID

Passing score: 70%. Results are valid for 24 calendar months — your checkride must happen within that window. Score report lists missed knowledge areas; your DPE will quiz you on those during the oral exam.`,
    highlights: ["60 questions", "70% to pass", "Register via IACRA", "Score valid 24 months"],
    quizzes: [
      { question: "Minimum visibility for VFR in Class E below 10,000 ft?", options: ["1 SM", "3 SM", "5 SM", "10 SM"], correct: 1 },
      { question: "A METAR reports current...?", options: ["Forecast", "Weather observation", "NOTAM", "TFR"], correct: 1 },
      { question: "Left-turning tendency on takeoff is caused by?", options: ["Adverse yaw only", "P-factor, torque, spiraling slipstream", "Crosswind", "Wing dihedral"], correct: 1 },
      { question: "Class B airspace requires?", options: ["Nothing", "ATC clearance", "Flight plan", "IFR rating"], correct: 1 },
      { question: "Hypoxia is caused by?", options: ["Too much oxygen", "Insufficient oxygen at altitude", "Carbon dioxide", "Dehydration"], correct: 1 },
      { question: "How long are PAR written results valid?", options: ["6 months", "12 months", "24 months", "Indefinitely"], correct: 2 },
      {
        question: "The wind sock below indicates roughly what wind speed?",
        image: WINDSOCK_PARTIAL,
        imageCaption: "Sock partially drooping",
        options: ["Calm", "~5–10 kt", "~25 kt", "Reverse direction"],
        correct: 1,
      },
    ],
  },
  {
    id: "m5",
    title: "Solo & Cross-Country Milestones",
    summary: "Pre-solo test, solo endorsement, Alabama XC routes.",
    body: `Before your first solo flight you must complete:

• Pre-solo written test administered by your CFI (covers regs, your aircraft, local airspace)
• Demonstrated proficiency in maneuvers, takeoffs, and landings
• 90-day solo endorsement in your logbook (renewable)

Cross-country requirements — one solo XC ≥ 150 NM total distance with full-stop landings at three points, one leg ≥ 50 NM.

Alabama VFR landmarks & corridors:
• Birmingham (BHM) — Class C, the state's busiest GA hub
• Huntsville (HSV) — Class C, Redstone Restricted Area to the south
• Mobile Regional (MOB) — Class C on the Gulf Coast
• Montgomery (MGM) — Class C, near Maxwell AFB Class D
• Tuscaloosa (TCL) — Class D, easy training airport
• Gulf Shores (JKA) — popular VFR XC destination, watch for P-area along the coast

Practice routes: BHM → TCL → HSV (triangle ~155 NM), MGM → MOB → JKA (Gulf corridor).`,
    highlights: ["Pre-solo written test", "Solo endorsement (90 days)", "1 solo XC ≥ 150 NM", "Watch Restricted Areas"],
    quizzes: [
      { question: "Solo endorsement is valid for how long?", options: ["30 days", "60 days", "90 days", "1 year"], correct: 2 },
      { question: "Total distance required for the long solo cross-country?", options: ["50 NM", "100 NM", "150 NM", "200 NM"], correct: 2 },
      { question: "Birmingham (BHM) airspace class?", options: ["B", "C", "D", "E"], correct: 1 },
    ],
  },
  {
    id: "m6",
    title: "FAA Checkride (Practical Exam)",
    summary: "Oral exam + flight test with a Designated Pilot Examiner.",
    body: `The practical exam is administered by an FAA Designated Pilot Examiner (DPE) and follows the Airman Certification Standards (ACS).

Two parts:
1. Oral exam (~1–2 hours) — regulations, systems, weather decisions, ADM, scenario questions, knowledge areas you missed on the written
2. Flight test (~1.5–2 hours) — preflight, maneuvers, navigation, emergencies, landings

Bring: logbook with endorsements, photo ID, IACRA app, written test report, medical, aircraft documents (ARROW: Airworthiness, Registration, Radio license if intl, Operating limitations, Weight & balance), and the examiner's fee (~$700–900 in Alabama).

Use the maneuver checklist below to track each ACS task as you master it.`,
    highlights: ["Oral 1–2 hrs", "Flight ~2 hrs", "ACS standards", "DPE fee $700–900"],
    maneuvers: [
      "Preflight inspection", "Cockpit management", "Engine start & taxi",
      "Normal takeoff & landing", "Crosswind takeoff & landing",
      "Soft-field takeoff & landing", "Short-field takeoff & landing",
      "Steep turns", "Slow flight", "Power-on stall", "Power-off stall",
      "Emergency descent", "Engine failure simulation", "Forced landing",
      "Pilotage & dead reckoning", "VOR navigation", "Diversion to alternate",
      "Lost procedures", "Night operations (if applicable)",
      "Go-around / rejected landing", "Post-flight procedures",
    ],
    quizzes: [],
  },
  {
    id: "m7",
    title: "Alabama FSDO",
    summary: "Birmingham FSDO — jurisdiction, location, contact, scheduling.",
    body: `The Birmingham Flight Standards District Office (FSDO) is the FAA field office responsible for pilot certification, enforcement, and oversight in Alabama and northwest Florida.

Address: Liberty Park area, Birmingham, AL (3925 Liberty Pkwy, Vestavia Hills, AL 35242)
Phone: (205) 968-3800
Hours: Monday–Friday, by appointment only — walk-ins are not accepted.

Jurisdiction: All of Alabama plus several northwest Florida panhandle counties (Escambia, Santa Rosa, Okaloosa, Walton, Holmes, Washington, Bay).

When you'll interact with the FSDO:
• Initial PPL application processing (after your DPE submits)
• Temporary airman certificate issuance
• Replacement / lost certificate processing
• Accident & incident reporting
• Pilot deviation follow-up
• Air carrier certification (Part 135 — relevant once we begin commercial ops)

Always call ahead. The FSDO is a regulatory office, not a walk-in service counter.`,
    highlights: ["Birmingham (Vestavia Hills)", "AL + NW Florida", "Appointment only", "(205) 968-3800"],
    quizzes: [
      { question: "Where is the FSDO with jurisdiction over Alabama?", options: ["Mobile", "Montgomery", "Birmingham", "Huntsville"], correct: 2 },
      { question: "Can you walk into the FSDO without an appointment?", options: ["Yes anytime", "Only on Fridays", "No — appointments only", "Only with a DPE"], correct: 2 },
    ],
  },
  {
    id: "m8",
    title: "Beyond PPL — Career Path",
    summary: "Instrument → Commercial → ATP → Part 135 (flying passengers for hire).",
    body: `Career progression for a private pilot heading toward commercial jet operations:

Instrument Rating (IR)
• +40 hours instrument time
• Adds the ability to fly in clouds and IMC weather
• Cost: ~$10–15k

Commercial Pilot License (CPL)
• 250 total flight hours
• Allows you to be paid to fly
• Cost: ~$30–50k (often combined with multi-engine and CFI ratings)

Airline Transport Pilot (ATP)
• 1,500 total hours (PIC/cross-country/night minimums apply)
• Required to act as PIC of scheduled airline ops and turbojet aircraft requiring two pilots
• Cost: ~$5–10k testing + recurrent training

Part 135 Air Carrier — flying passengers for hire
This is the regulation Air 5 Wing Pilots USA operates under. Part 135 covers on-demand charter and air taxi service. To fly Part 135 you need:
• Commercial Pilot License at minimum (ATP for jets requiring 2 pilots)
• Type ratings for specific aircraft (e.g., CE-525S for Citation jets)
• 135.293 / 135.297 / 135.299 recurring checks every 12 months
• Drug & alcohol testing program enrollment

Typical timeline: PPL (Year 1) → IR (Year 1–2) → CPL (Year 2–3) → CFI (Year 2–3) → 1,500 hrs (Year 3–5) → ATP → Part 135 First Officer → Captain.`,
    highlights: ["IR → CPL → ATP", "1,500 hrs for ATP", "Part 135 = charter ops", "Type ratings per jet"],
    quizzes: [
      { question: "Total hours required for ATP?", options: ["250", "500", "1,000", "1,500"], correct: 3 },
      { question: "Which certificate is the minimum to be paid to fly?", options: ["PPL", "IR", "CPL", "ATP"], correct: 2 },
      { question: "Which FAR Part governs on-demand charter ops?", options: ["Part 61", "Part 91", "Part 135", "Part 121"], correct: 2 },
    ],
  },
];
