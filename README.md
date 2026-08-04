# Steven Howard — Writing & Publishing Coach

A one-page personal coaching site for Steven Howard, award-winning author of 22 books.
Positioned as personal coaching from an author, deliberately separate from the
Caliente Press publishing-house brand.

Static HTML/CSS/JS. No build step, no dependencies.

---

## ⚠️ Before launch — do these two things

### 1. Turn on real email delivery (2 minutes, free)

Right now the contact form falls back to opening the visitor's own email app with the
message pre-filled. That works, but it depends on the visitor having a mail client set
up and actually pressing send. Set up a real endpoint so nothing gets lost:

1. Go to <https://web3forms.com>
2. Enter `stevenhoward@verizon.net` and submit
3. Web3Forms emails an **Access Key** to that address
4. Open `assets/js/main.js` and replace the placeholder:

```js
ACCESS_KEY: 'YOUR_WEB3FORMS_ACCESS_KEY',   // <-- paste the key here
```

Submissions then arrive in Steven's inbox with the sender's name, email, focus area,
what they're writing, and what they want to do with it.

(Formspree works too — set `PROVIDER: 'formspree'` and fill in `FORMSPREE_URL`.)

### 2. Confirm the placeholder facts

These were pulled from Steven's existing sites and should be checked with him:

- **Pricing** — intentionally omitted. The site says rates are discussed on the first
  call. Add a price point when he sets one.
- **Session cadence** — described as weekly, bi-weekly, or shaped around the project.
- **"10,000+ people coached"** — Caliente Leadership says 10,000+; Steven Howard Speaks
  says 12,000+. The lower, more conservative number is used.
- **Testimonials** — Alex Chan and Rodrigo Martinelli, both from the Caliente Press site.
  Worth confirming he's happy to reuse them on a personal-brand site.

---

## What's on the page

| Section | Purpose |
|---|---|
| Hero | Portrait + positioning as a personal coach, not a publishing house |
| Stats | 22 books · 10,000+ coached · 45 years · Top 200 Global Voices |
| Coaching | The two tracks — learn to write it / get it published |
| What we work on | Eight concrete service areas |
| How it works | Zoom, 50 minutes, flexible cadence, built around the manuscript |
| Steps | The four-step path from first note to published book |
| About | Full bio, career, and awards |
| Testimonials | Two authors he's worked with |
| Contact | Modal inquiry form |

## The opening animation

On first open, a pen writes out "Steven Howard, writing and publishing coach" over
black, then the overlay fades and hands the page over. About 4 seconds.

**The letters are not live text.** They're real Dancing Script outlines, extracted with
fontTools and shaped with HarfBuzz (so the script connections and kerning are right),
baked into `index.html` as SVG paths. That matters: it's what lets the pen sit on the
*true curve* of each letter via `getPointAtLength`, moving up, down and around the way a
hand does.

An earlier version revealed each line with a straight `clip-path` wipe and bobbed the
pen along a sine wave to fake it. It never looked like writing, because the ink was
appearing behind a hard vertical edge no matter what the pen did. Don't go back to that.

How the ink appears: each glyph is its own `<clipPath>`, and a thick stroke travels that
glyph's outline via `stroke-dashoffset`. Clipped to the letter, the stroke fills the
shape in as the pen moves through it.

The rest of the motion:

- the nib **flies in and settles** onto the page rather than popping into place
- lines draw at near-constant speed with **softened ends**, so nothing starts or stops
  dead
- the pen **leans with the stroke direction** (tangent of the path, heavily damped so it
  doesn't spin through loops)
- between lines it **lifts, arcs over the words it just wrote, and lands** at the start
  of the next one. A quadratic bezier only reaches halfway to its control point, so the
  control is derived from the apex we want (`cy = 2*apexY - 0.5*(y0+y1)`); guessing an
  offset drags the nib straight through the finished line
- at the end it **lifts away** off the top-right and fades

To change the wording or font, see `tools/generate-handwriting.py`.

It deliberately stays out of the way:

- **Runs once per browser session** (`sessionStorage`), so refreshing doesn't replay it.
  To play it on every load, delete the `sh_intro_seen` check in the head script and in
  `finish()`.
- **Never runs for `prefers-reduced-motion`.**
- **Never runs without JavaScript.** The decision is made by a tiny inline script in
  `<head>` before first paint, which adds `html.intro-pending`. The CSS only shows the
  overlay when that class is present, so no JS means no overlay and no flash.
- **Skippable** by clicking anywhere, pressing Escape/Enter/Space, or the Skip button.
- Scroll is locked while it plays and released the moment it ends. An 8-second hard stop
  guarantees the page is never left covered.

Note for anyone editing the pen: `offsetWidth` is `undefined` on SVG elements, so the
nib offset is measured with `getBoundingClientRect().width`. Using `offsetWidth` there
silently misplaces the pen.

## The inquiry form

Clicking any "Apply to Work Together" button — or his email address in the footer
area — opens a modal asking for:

- Name (required)
- Email (required)
- What they need most help with (dropdown)
- What they're writing (required)
- What they want to do with it (required)

It has inline validation, a honeypot field for spam, keyboard focus trapping, and
Escape-to-close. If the endpoint ever fails, it falls back to the visitor's mail client
rather than silently dropping the message.

## Structure

```
index.html
assets/
  css/styles.css
  js/main.js
  img/
    steven-howard-portrait.jpg      hero (1200px)
    steven-howard-portrait-sm.jpg   about + mobile (640px)
    award-gold-medal.jpg            NFAA Gold Medal
    top-200-voices.jpg              Top 200 badge (unused, kept for future)
    favicon.svg
vercel.json
```

## Design

- **Black** background, **white** text, **maroon** accent
- Three accent tokens keep contrast honest against pure black:
  `--accent #be4152` (headings, icons, rules), `--accent-hi #d4586a` (small labels and
  hover, 5.4:1 so it clears WCAG AA), `--accent-btn #8e2438` (button fills, 8:1 with
  white text)
- No dashes: em dashes are kept out of the copy, and the decorative rules that sat
  beside section labels were removed. Coaching-list bullets are dots, not dashes.
  Hyphens remain in compound words (one-on-one, award-winning) since they're spelling.
- Fraunces (serif headings) + Inter (body), loaded from Google Fonts
- Fully responsive; respects `prefers-reduced-motion`

Photos are Steven's own, pulled from stevenhowardspeaks.com and calienteleadership.com.

## Running locally

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>.

## Related sites

- Caliente Leadership — calienteleadership.com
- Humony Leadership — humonyleadership.com
- Steven Howard Speaks — stevenhowardspeaks.com
- Caliente Press — calientepress.com *(currently down — see note below)*

### Note on calientepress.com

As of 3 Aug 2026 the domain resolves to Bluehost (`50.6.42.95`) but HTTPS redirects to
`/404.html` and serves a generic `*.bluehost.com` certificate instead of one for the
domain. The DNS is fine — the domain is no longer pointed at its site directory in the
Bluehost account. The site was archived working on 5 Jan 2026, so it broke sometime
after that. This is a hosting-account fix, not a code fix.
