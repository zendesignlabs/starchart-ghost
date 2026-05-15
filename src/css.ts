export const defaultStarchartGhostCss = `
.starchart-export {
  box-sizing: border-box;
  max-width: 800px;
  margin: 0 auto;
  color: #0a0a0a;
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  line-height: 1.65;
}
.starchart-export *, .starchart-export *::before, .starchart-export *::after {
  box-sizing: inherit;
}
.starchart-export__title,
.starchart-export h1,
.starchart-export h2,
.starchart-export h3 {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.2;
}
.starchart-export img,
.starchart-export svg {
  max-width: 100%;
  height: auto;
}
.starchart-export .chart-block,
.starchart-export .map-block,
.starchart-export .macro-block-published {
  margin: 1.5rem 0;
}
.starchart-export .block-caption {
  margin-top: 0.5rem;
  color: #5f5f5f;
  font-size: 0.875rem;
  text-align: center;
}
.starchart-export .city-callout,
.starchart-export .line-callout-header,
.starchart-export .place-callout-header {
  border-left: 2px solid rgba(10, 10, 10, 0.25);
  padding-left: 0.75rem;
}
.starchart-export .table-scroll-wrapper {
  overflow-x: auto;
}
.starchart-export table {
  width: 100%;
  border-collapse: collapse;
}
.starchart-export th,
.starchart-export td {
  border-bottom: 1px solid rgba(10, 10, 10, 0.12);
  padding: 0.4rem 0.5rem;
  text-align: left;
}
`;
