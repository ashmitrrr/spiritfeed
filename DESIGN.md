# Visual Design — SpiritFeed

This is the design spec for the polish pass that happens after the MVP (Phases 1-2, functionality-first) is working and tested with the real friend group. Reference this — not `FEATURES.md`'s plain-Tailwind placeholder styling — once we're ready to make the app actually look like SpiritFeed.

## Direction

Pixel art / retro-cozy. Think a Game Boy Color era creature-collector game crossed with an old buddy-list app — blocky, warm, a little nostalgic, not slick or corporate. The spirit animal system is the emotional core of the app, so the visual identity should be built around illustrated pixel animals, not abstract UI chrome.

Reference: the app logo (provided by Ashmit) — a stacked column of pixel-art animal portraits (capybara, sheep, panda seen so far) on an olive-green background, with "spirit feed" set in a blocky white pixel font, lowercase, tight letter spacing.

## Color palette

Pulled from the logo. Treat these as a starting point — refine to exact hex once we have the actual logo file (not a pasted screenshot) to sample from.

- **Olive green** — the dominant background color across the logo and (per Ashmit) the landing page. Approx `#8A8A5C` – `#8B8C63` range; a muted, slightly warm olive, not bright/saturated green.
- **Light grey / bone** — secondary background and card surfaces. A warm off-white/light grey, not pure white — keeps the retro-cozy feel rather than looking like a clean modern app.
- **Dark warm brown-grey** — outlines, shadows, and the darker fur/shading tones in the pixel animals. Used for depth, not as a primary UI color.
- **White** — primary text on olive backgrounds (as in the logo wordmark).

Once real asset files are available, extract an actual token set (`--olive`, `--bone`, `--shadow`, etc.) rather than guessing — this list is a placeholder for planning purposes.

## Typography

The logo's "spirit feed" wordmark is a blocky, bitmap-style pixel font — lowercase, lots of visual weight, tight tracking. Closest free options to evaluate against the real logo once available:

- **Silkscreen** (Google Fonts) — clean bitmap look, closest visual match to what's in the logo
- **Press Start 2P** (Google Fonts) — more classic 8-bit arcade feel, chunkier
- **Pixelify Sans** (Google Fonts) — more readable at small sizes, good candidate for body text if a pure pixel font hurts legibility in longer UI copy (form labels, error messages)

Recommendation: use a true pixel font (Silkscreen or Press Start 2P) for the wordmark/headers/buttons, and consider Pixelify Sans or a clean monospace for body copy and form inputs if the fully-blocky font is hard to read at small sizes. Confirm once we can compare against the real logo font directly.

## UI style rules

Translating "pixelated cozy" into actual interface decisions:

- **No rounded corners.** Hard, square edges everywhere — buttons, cards, inputs, avatars. `border-radius: 0` is the rule, not the exception. (This is the single biggest change from the current Tailwind-default rounded-corner look.)
- **Chunky borders, not subtle ones.** 2-3px solid borders instead of the current hairline `border-foreground/10` style — pixel art reads through visible, deliberate outlines.
- **Flat color blocks over gradients/blur.** No soft shadows or translucent glass effects — flat olive/bone/brown blocks with hard-edged drop shadows (offset 2-4px, no blur) if depth is needed, like a retro game's UI panels.
- **Spirit animal avatars become real pixel art**, replacing the current emoji placeholders (`lib/spirit-animals.ts`). Each of the 28 animals needs a small square pixel-art portrait in a consistent style/palette (same "camera angle," similar canvas size, consistent outline weight) so the grid in the onboarding picker and the avatars throughout the feed feel like one cohesive set, not a mismatched collage.
- **Landing/login background**: a tiled or collaged arrangement of pixel animal portraits (per Ashmit's Pinterest reference), likely behind a semi-opaque olive overlay so foreground text/forms stay legible on top.
- **Buttons and interactive elements** get a slight "pressed" pixel-game feel on click — e.g. a 2px offset shift or border color swap — rather than the current opacity-fade hover state.

## Asset needs (blocking the actual implementation)

1. The real logo file (SVG or high-res PNG), not a chat screenshot — needed for exact color sampling and to use as the actual favicon/header logo.
2. A curated set of pixel animal art — ideally one clean portrait per SpiritFeed animal (see the 28 keys in `lib/spirit-animals.ts` / seeded in `spirit_animals` table), in a consistent style. The "hundreds of Pinterest images" are a good mood board/style reference, but the actual in-app set needs to be curated down to one-per-animal and stylistically consistent, not a random assortment.
3. Confirmation on the pixel font choice once compared against the real logo.

## Auth screen layout pattern (login / join / setup)

Reference: Canva's sign-in screen — a full-bleed background collage of content thumbnails, dimmed, with a centered white modal card floating on top holding the actual form.

SpiritFeed adaptation: same structure, different materials.

- **Background**: a tiled/collaged arrangement of the curated pixel animal portraits (see Asset needs above), covering the full viewport behind the auth card. Not the raw Pinterest dump — the same curated, stylistically-consistent set used for avatars, just shown large and tiled here.
- **Overlay**: a semi-opaque olive wash over the collage so it reads as background texture, not competing content — the card should be unmistakably the focal point.
- **Card**: centered, bone/light-grey surface, hard square corners (per the no-rounded-corners rule), chunky dark border, flat hard-edged drop shadow. Holds the actual username/password fields or the spirit animal picker.
- Applies to `/login`, `/join/[token]`, and `/setup` — the three auth-only screens — so a friend's first impression of the app is this collage-plus-card moment before they ever see the plain feed UI underneath.

## Where this applies

Every screen gets the pass eventually, but rough priority order once assets are ready: landing/login (first impression), the spirit animal picker (core identity moment), the feed (most-viewed screen), then admin/mood-dashboard/streaks screens last since they're used less often.
