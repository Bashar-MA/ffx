# Figure Tools

A small, no-dependency, multi-page site for building publication-style scientific figures by hand. Everything runs in the browser.

- **`index.html`** — home page linking to all tools.
- **`timeline.html`** — study/trial timeline diagrams.
- **`domains.html`** — protein domain / structure organization maps, with a manual plot width/height (cm/mm/in) and the 40-color hex palette (displays correctly in Adobe Illustrator).
- **`plots.html`** — Violin / Density / Line plots (tabs switch chart type):
  - CSV/TSV paste or CSV/Excel upload, one-click sample data.
  - Per-column "Show in plot" checkbox to include/exclude variables.
  - Explicit **Start / End / Tick count** for each axis, auto-filled from your data when you load it and freely editable, plus separate axis-line-to-label spacing (px) for X and Y.
  - Fully independent **font family, style, size and color** for axis tick numbers, axis titles, and legend/category labels.
  - Legend **position** (4 corners) and layout (stacked or row) for the series legend, and a separate positionable legend for the violin plot's 25–75% / 1.5×IQR / Mean key (editable text, stacked or 3-across).
  - Region annotations on line plots with an auto-built legend, and a **Renumber residues** offset field to shift X values (e.g. renumber a fragment to start at a different residue number).
  - Export as SVG, or as a **vector PDF** (via svg2pdf.js) that opens as editable paths/text in Adobe Illustrator — not a flattened image.
- **`multipanel.html`** — compose multiple datasets into one page:
  - **Violin + Density Grid**: upload multiple CSV/Excel files (one file = one column); every 3 files start a new violin-row + density-row pair. Each dataset has the same "show in plot" per-group checkboxes as Analysis Plots, tick-label spacing, per-role fonts, and either fits the panels to a page size or lets you set each grid column's width and each row's height manually (computed page size shown live).
  - **Line Stack**: add any number of line plots stacked vertically; each has its own per-series show/hide + color + width/style config, region annotations, and a residue-renumbering offset. Toggle "Same formatting for all" for one shared X/Y range, ticks, tick-label spacing, width and height, or uncheck it to set all of that independently per plot.
  - Both export to SVG or vector PDF.
- **`shared.js`** — palette (hex colors), CSV/Excel parsing, stats (quartiles, KDE), tick generation, reusable font-control UI, and SVG/PDF export helpers used by the other pages.

## Run it locally
Open `index.html` in any browser. Excel parsing, PDF export, and the sample-data buttons need an internet connection (they load small libraries from a CDN); everything else works offline.

## Host it on GitHub Pages
1. Create a new repository on GitHub (e.g. `figure-tools`).
2. Add all the files above to the repo — via the GitHub web UI ("Add file → Upload files") or:
   ```
   git init
   git add index.html timeline.html domains.html plots.html multipanel.html shared.js README.md
   git commit -m "Add multi-panel layout tool"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, set Source to "Deploy from a branch", branch `main`, folder `/ (root)`, then Save.
4. Your site will be live at: `https://<your-username>.github.io/<your-repo>/`

## Data format
- **Violin / Density**: each column is one group's sample values; first row = group names.
- **Line**: column 1 = X values; each remaining column is one line series, named by its header.
- **Multi-Panel Grid**: one file per grid column, each file in the Violin/Density format above.

## Editing further
Each HTML file is self-contained aside from the shared `shared.js`, so you can tweak one tool without affecting the others.
