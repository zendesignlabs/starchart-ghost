import type { BuildGhostHtmlOptions } from "./types.js";

const HTML_CARD_BEGIN = "<!--kg-card-begin: html-->";
const HTML_CARD_END = "<!--kg-card-end: html-->";

const URL_ATTR_RE = /\b(src|href|poster)=(['"])(.*?)\2/gi;
const SRCSET_RE = /\bsrcset=(['"])(.*?)\1/gi;

/**
 * Resolve relative asset URLs in Starchart-rendered HTML to absolute public URLs.
 *
 * Ghost posts are served from the Ghost domain, so Starchart-relative chart/map/image
 * URLs like `/api/charts/svg?...` must be made absolute before publication.
 */
export function absolutizeAssetUrls(html: string, assetBaseUrl: string): string {
  const base = normalizeBaseUrl(assetBaseUrl);

  return html
    .replace(URL_ATTR_RE, (_match, attr: string, quote: string, value: string) => {
      return `${attr}=${quote}${escapeAttribute(resolveMaybeRelativeUrl(value, base))}${quote}`;
    })
    .replace(SRCSET_RE, (_match, quote: string, value: string) => {
      const resolved = value
        .split(",")
        .map((candidate) => {
          const trimmed = candidate.trim();
          if (!trimmed) return trimmed;
          const [url, ...descriptor] = trimmed.split(/\s+/);
          return [resolveMaybeRelativeUrl(url, base), ...descriptor].join(" ");
        })
        .join(", ");
      return `srcset=${quote}${escapeAttribute(resolved)}${quote}`;
    });
}

/**
 * Build the lossless Ghost HTML-card payload for a rendered Starchart writing/report.
 */
export function buildGhostHtmlCard(options: BuildGhostHtmlOptions): string {
  const wrapperClass = options.wrapperClass ?? "starchart-export";
  const html = absolutizeAssetUrls(options.html, options.assetBaseUrl);
  const css = options.css?.trim();
  const embeddedTitle = options.embeddedTitle?.trim();

  const parts = [HTML_CARD_BEGIN];
  if (css) parts.push(`<style>${css}</style>`);
  parts.push(`<article class="${escapeAttribute(wrapperClass)}">`);
  if (embeddedTitle) parts.push(`<h1 class="${escapeAttribute(wrapperClass)}__title">${escapeHtml(embeddedTitle)}</h1>`);
  parts.push(html);
  parts.push("</article>");
  parts.push(HTML_CARD_END);
  return parts.join("\n");
}

export function isGhostHtmlCard(html: string): boolean {
  return html.includes(HTML_CARD_BEGIN) && html.includes(HTML_CARD_END);
}

function normalizeBaseUrl(assetBaseUrl: string): URL {
  if (!assetBaseUrl) throw new Error("assetBaseUrl is required");
  return new URL(assetBaseUrl.endsWith("/") ? assetBaseUrl : `${assetBaseUrl}/`);
}

function resolveMaybeRelativeUrl(value: string, base: URL): string {
  if (!value || value.startsWith("#")) return value;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value;
  return new URL(value, base).toString();
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
