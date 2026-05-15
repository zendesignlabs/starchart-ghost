export type GhostPostStatus = "draft" | "published" | "scheduled";

export interface GhostAdminConfig {
  /** Ghost site URL, e.g. https://example.com or https://example.ghost.io */
  url: string;
  /** Admin API key from a Ghost custom integration, format: keyId:hexSecret */
  adminApiKey: string;
  /** Ghost Admin API version header. */
  version?: string;
  /** Optional fetch replacement for tests or custom runtimes. */
  fetch?: typeof fetch;
}

export interface StarchartGhostExport {
  /** Already-rendered Starchart published HTML, usually from renderNodes(publishedContentJson). */
  html: string;
  /** Absolute public Starchart base URL used to resolve relative chart/map/image URLs. */
  assetBaseUrl: string;
  /** Optional scoped CSS to travel with the Ghost HTML card. */
  css?: string;
  /** Wrapper class for the exported artifact. Defaults to starchart-export. */
  wrapperClass?: string;
  /** Optional title rendered above the artifact inside the card; Ghost post title is separate. */
  embeddedTitle?: string;
}

export interface GhostPostInput extends StarchartGhostExport {
  title: string;
  status?: GhostPostStatus;
  slug?: string;
  customExcerpt?: string;
  featureImage?: string;
  tags?: Array<string | { name: string; slug?: string }>;
  authors?: Array<string | { id?: string; email?: string; slug?: string }>;
  canonicalUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Preserve Starchart identifiers for future reconciliation. */
  sourceId?: string;
}

export interface GhostPostEditInput extends GhostPostInput {
  id: string;
  /** Ghost requires updated_at on edit to avoid overwriting newer content. */
  updatedAt: string;
}

export interface GhostPostResult {
  id: string;
  uuid?: string;
  title: string;
  slug?: string;
  status?: GhostPostStatus;
  url?: string;
  updatedAt?: string;
  raw: unknown;
}

export interface BuildGhostHtmlOptions extends StarchartGhostExport {}
