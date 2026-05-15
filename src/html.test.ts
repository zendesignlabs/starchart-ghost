import { describe, expect, it } from "vitest";
import { absolutizeAssetUrls, buildGhostHtmlCard, isGhostHtmlCard } from "./html.js";

const baseUrl = "https://starchart.example";

describe("absolutizeAssetUrls", () => {
  it("resolves Starchart-relative src, href, poster, and srcset values", () => {
    const html = `<img src="/api/charts/svg?x=1"><a href="/w/token">read</a><video poster='/poster.png'></video><img srcset="/a.png 1x, /b.png 2x">`;
    const out = absolutizeAssetUrls(html, baseUrl);

    expect(out).toContain(`src="https://starchart.example/api/charts/svg?x=1"`);
    expect(out).toContain(`href="https://starchart.example/w/token"`);
    expect(out).toContain(`poster='https://starchart.example/poster.png'`);
    expect(out).toContain(`srcset="https://starchart.example/a.png 1x, https://starchart.example/b.png 2x"`);
  });

  it("leaves absolute, protocol-relative, and anchor URLs alone", () => {
    const html = `<img src="https://cdn.example/a.png"><img src="//cdn.example/b.png"><a href="#section">jump</a>`;
    expect(absolutizeAssetUrls(html, baseUrl)).toBe(html);
  });
});

describe("buildGhostHtmlCard", () => {
  it("wraps rendered Starchart HTML in a lossless Ghost HTML card", () => {
    const out = buildGhostHtmlCard({
      html: `<p>Hello <img src="/chart.svg"></p>`,
      assetBaseUrl: baseUrl,
      css: `.starchart-export{color:red}`,
      embeddedTitle: "My <Title>",
    });

    expect(isGhostHtmlCard(out)).toBe(true);
    expect(out).toContain("<!--kg-card-begin: html-->");
    expect(out).toContain(`<style>.starchart-export{color:red}</style>`);
    expect(out).toContain(`<h1 class="starchart-export__title">My &lt;Title&gt;</h1>`);
    expect(out).toContain(`<img src="https://starchart.example/chart.svg">`);
    expect(out).toContain("<!--kg-card-end: html-->");
  });
});
