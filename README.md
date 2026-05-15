# Starchart Ghost Bridge

V1 publishing bridge from Starchart Pro to Ghost.

The bridge publishes already-rendered Starchart writing/report HTML into Ghost as a single lossless Ghost HTML card. This preserves astrology-component fidelity better than translating chart/map/transit components into native Ghost Lexical blocks.

## What v1 does

- Accepts Starchart-rendered published HTML.
- Converts Starchart-relative asset/API URLs to absolute public URLs.
- Wraps the artifact in Ghost HTML-card markers:
  - `<!--kg-card-begin: html-->`
  - `<!--kg-card-end: html-->`
- Publishes or updates a Ghost post through the Ghost Admin API using `source=html`.
- Ships a small default scoped CSS bundle for `.starchart-export`.

## What v1 intentionally does not do

- It does not convert Starchart components into editable native Ghost Lexical blocks.
- It does not sync edits from Ghost back into Starchart.
- It does not guarantee email/newsletter fidelity. Target fidelity is Ghost web posts first.
- It does not preserve interactive map exploration unless the exported HTML includes a separate embed/script strategy. Static map images are the v1 target.

## Install

```bash
npm install @zendesignlabs/starchart-ghost
```

For local development:

```bash
npm install
npm test
npm run build
```

## Library usage

```ts
import {
  createGhostPost,
  defaultStarchartGhostCss,
} from "@zendesignlabs/starchart-ghost";

await createGhostPost(
  {
    url: process.env.GHOST_URL!,
    adminApiKey: process.env.GHOST_ADMIN_API_KEY!,
  },
  {
    title: writing.title,
    status: "draft",
    html: renderedStarchartHtml,
    assetBaseUrl: process.env.NEXT_PUBLIC_APP_URL!,
    css: defaultStarchartGhostCss,
    sourceId: writing.id,
    canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/w/${writing.shareToken}`,
    tags: ["Starchart"],
  },
);
```

In Starchart, `renderedStarchartHtml` should come from the same published renderer used by `/w/[shareToken]` or `/r/[shareToken]`, e.g. `renderNodes(writing.publishedContentJson ?? writing.contentJson)`.

## CLI usage

```bash
starchart-ghost \
  --ghost-url https://example.ghost.io \
  --admin-key "$GHOST_ADMIN_API_KEY" \
  --title "My Starchart Writing" \
  --html-file ./rendered-writing.html \
  --asset-base-url https://starchart.example \
  --status draft
```

To update an existing Ghost post:

```bash
starchart-ghost \
  --ghost-url https://example.ghost.io \
  --admin-key "$GHOST_ADMIN_API_KEY" \
  --title "My Starchart Writing" \
  --html-file ./rendered-writing.html \
  --asset-base-url https://starchart.example \
  --post-id "$GHOST_POST_ID" \
  --updated-at "$GHOST_UPDATED_AT"
```

Ghost requires `updated_at` when editing a post to protect against overwriting newer changes.

## Recommended Starchart integration shape

Add a server-side route/action in Starchart along these lines:

1. Load the Writing or Report and verify practitioner ownership.
2. Ensure it has a published snapshot (`publishedContentJson`) and generated static map images.
3. Render HTML through the same renderer used by the public Starchart link.
4. Call `createGhostPost` on first publish or `updateGhostPost` on later syncs.
5. Store a mapping in Starchart, e.g. `ghostPostId`, `ghostSlug`, `ghostUrl`, `ghostUpdatedAt`, `ghostLastSyncHash`.

## Fidelity notes

This bridge is designed around Starchart owning astrology-component rendering. Ghost hosts the finished artifact.

Good v1 fidelity:

- chart wheels as inline SVG or absolute image/API URLs
- static map snapshots
- transits, biwheel, lunation, aspects, transits-to blocks with frozen data
- city/line/place callouts

Known risk areas:

- relative URLs not reachable from the public internet
- Ghost theme CSS overriding exported content
- HTML cards in email/newsletter contexts
- Ghost Admin open/save behavior if the HTML card is manually edited
