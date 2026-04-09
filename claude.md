# Baby Steps — Baby Milestone Tracker

## What this is
A personal PWA for tracking baby developmental milestones from pre-natal through Year 3. Users set up a profile for their baby (name, gender, birth/due date), then scroll through a pre-populated milestone timeline and mark each milestone as reached. Custom milestones can be added. Designed for a single family — no accounts, no backend, no multi-user support.

## Tech stack
- Vanilla JS (no frameworks)
- CSS custom properties for theming
- localStorage for all persistence
- PWA: service worker with cache-first strategy, web app manifest
- No build step — plain HTML/CSS/JS, deployable as static files

## App structure
```
/
├── index.html          # Entry point; renders onboarding or main app
├── app.js              # App logic, routing between views
├── milestones.js       # Pre-populated milestone data (exported array)
├── storage.js          # localStorage read/write helpers
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── style.css           # Global styles and CSS variables
└── CLAUDE.md
```

## Views
1. **Onboarding** — shown once on first launch; collects:
   - Baby name (with "undecided" checkbox — renders as "Your baby" / "your baby's" throughout the app with correct grammar)
   - Gender: boy / girl / unknown
   - Birth date or expected due date
2. **Milestone feed** — main view; scrolling list starting from the top (pre-natal then Day 0 onward); sections grouped by stage label
3. **Milestone detail modal** — triggered on "Reached" button; date picker defaults to today; backdating allowed; forward-dating never allowed; date is optional (user can mark reached with no date)
4. **Add custom milestone** — form to add a milestone with a title, optional description, and age range (lower bound day + upper bound day)
5. **Add custom pre-natal milestone** — separate prenatal milestone form for pregnancy events like "found out the gender", "anatomy scan", or "felt first kick"
6. **Settings view** — separate full view (not a panel); allows editing of baby name, gender, and birth/due date at any time; toggle to hide/show pre-natal milestones; ability to unmark any completed milestone

## Milestone categories

### Pre-natal milestones
- Anchored to gestational week (e.g. week 8, week 12, week 20)
- Each built-in entry includes a weekly developmental fact ("baby is the size of a navel orange", "baby's eyelids are now fully formed")
- Auto-complete: built-in pre-natal items are marked complete automatically once the gestational week passes relative to the due date
- Custom prenatal milestones can also be added and marked reached manually
- Completed pre-natal milestones collapse by default in the feed and expand on tap
- Visible by default; hidden via Settings toggle ("Hide pre-natal milestones")
- Appear above Day 0 in the feed

### Postnatal milestones (Day 0 to Year 3)
- Anchored to a day range (lower bound + upper bound)
- Sorted by lower bound ascending
- Critical milestones (pediatric significance) are starred (★)
- Display format: age range label + milestone title + star if critical
- Once reached: checkmark + date (if provided)
- Milestones may be reached out of order
- User can unmark a completed milestone from the Settings view

### Custom milestones
- User-defined; culturally or personally significant events (e.g. christening, naming ceremony, first family outing)
- Includes both postnatal and prenatal custom events
- Postnatal custom milestones are assigned a day range (lower bound + upper bound)
- Prenatal custom milestones are assigned a gestational week range
- Custom milestones appear in the appropriate section and behave like other milestones once created

## Feed behaviour
- Feed always starts at the top (pre-natal / Day 0)
- Completed milestones remain in place in scroll order with a checkmark and optional date
- Completed milestones collapse by default and can be expanded on tap to show details
- Uncompleted milestones show a "Reached" button
- Postnatal completed milestones can be unmarked directly from the expanded card in the feed
- Prenatal custom milestones can also be marked reached or unmarked manually
- Milestones are not reordered after completion
- An age tracker banner appears at the top of the feed showing gestational age for expected due dates, or baby age after birth

## Data model (localStorage keys)
- `baby_profile` — `{ name: string|null, undecidedName: boolean, gender: "boy"|"girl"|"unknown", birthDate: "YYYY-MM-DD", isExpectedDueDate: boolean }`
- `settings` — `{ hidePrenatal: boolean }`
- `milestones_custom` — array of custom milestone objects
- `milestones_reached` — object keyed by milestone ID: `{ date: "YYYY-MM-DD"|null, notes?: string }`

## Milestone data structure
```js
// Postnatal milestone
{
  id: "m_001",              // unique stable string
  type: "postnatal",
  ageLowerDays: 60,         // sort key
  ageUpperDays: 90,
  ageLabel: "2–3 months",   // display label
  title: "Social smile",
  description: "",          // optional
  critical: false,          // true = starred (★)
  custom: false
}

// Pre-natal milestone
{
  id: "pn_08",
  type: "prenatal",
  gestationalWeek: 8,
  title: "First prenatal visit",
  weeklyFact: "The embryo is now about the size of a raspberry.",
  description: ""           // optional detail about the visit or milestone
}
```

## Grammar rules for baby name
- Name known: use the name directly ("Emma reaches for objects")
- Undecided: "Your baby" as subject, "your baby's" as possessive
- Never use gendered pronouns unless gender is boy (he/his) or girl (she/her); use "they/their" for unknown

## Conventions
- All dates stored and compared as ISO strings (`YYYY-MM-DD`)
- No date-fns or moment — use native `Date` and `Intl.DateTimeFormat`
- Never allow forward-dating: max selectable date on any milestone date picker is today
- `storage.js` is the only file that touches `localStorage`
- Pre-populated milestone IDs are stable strings (`m_001`, `pn_08` etc.)
- Custom milestone IDs: `custom_${Date.now()}`
- No external dependencies — zero npm packages
- CSS variables for all colours; support light/dark via `prefers-color-scheme`

## PWA requirements
- Must be installable (valid manifest + service worker)
- Offline-first: app shell and all assets cached on install
- Service worker strategy: cache-first for all static assets
- `manifest.json`: `display: standalone`, appropriate icons, theme colour consistent with app palette
- No push notifications required

## Commands
```bash
# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8080
```
No build step required.

## Future scope (do not implement now)
- Pre-natal section is designed to eventually accommodate doctor visit tracking and clinical results (e.g. anatomy scan outcomes, glucose test results)
- Multi-child support is not in scope but the data model should not actively prevent it

## Out of scope
- User accounts or authentication
- Server-side anything
- Photo attachments
- Sharing or export
- Notifications or reminders
- Internationalisation
- Nuclear reset / delete all data