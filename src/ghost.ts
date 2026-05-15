import { createHmac } from "node:crypto";
import type { GhostAdminConfig, GhostPostEditInput, GhostPostInput, GhostPostResult } from "./types.js";
import { buildGhostHtmlCard } from "./html.js";

interface GhostPostPayload {
  title: string;
  html: string;
  status?: string;
  slug?: string;
  custom_excerpt?: string;
  feature_image?: string;
  tags?: GhostPostInput["tags"];
  authors?: GhostPostInput["authors"];
  canonical_url?: string;
  meta_title?: string;
  meta_description?: string;
  codeinjection_foot?: string;
  updated_at?: string;
}

export async function createGhostPost(config: GhostAdminConfig, input: GhostPostInput): Promise<GhostPostResult> {
  const payload = toGhostPostPayload(input);
  const response = await ghostRequest(config, "/ghost/api/admin/posts/?source=html", {
    method: "POST",
    body: JSON.stringify({ posts: [payload] }),
  });
  return normalizePostResult(response);
}

export async function updateGhostPost(config: GhostAdminConfig, input: GhostPostEditInput): Promise<GhostPostResult> {
  const payload = toGhostPostPayload(input);
  payload.updated_at = input.updatedAt;
  const response = await ghostRequest(config, `/ghost/api/admin/posts/${encodeURIComponent(input.id)}/?source=html`, {
    method: "PUT",
    body: JSON.stringify({ posts: [payload] }),
  });
  return normalizePostResult(response);
}

export async function readGhostPost(config: GhostAdminConfig, id: string): Promise<GhostPostResult> {
  const response = await ghostRequest(config, `/ghost/api/admin/posts/${encodeURIComponent(id)}/?formats=html,lexical`, {
    method: "GET",
  });
  return normalizePostResult(response);
}

export async function upsertGhostPost(
  config: GhostAdminConfig,
  input: GhostPostInput & { id?: string; updatedAt?: string },
): Promise<GhostPostResult> {
  if (input.id) {
    const updatedAt = input.updatedAt ?? (await readGhostPost(config, input.id)).updatedAt;
    if (!updatedAt) throw new Error("Ghost post updated_at is required for update");
    return updateGhostPost(config, { ...input, id: input.id, updatedAt });
  }
  return createGhostPost(config, input);
}

function toGhostPostPayload(input: GhostPostInput): GhostPostPayload {
  const html = buildGhostHtmlCard(input);
  return pruneUndefined({
    title: input.title,
    html,
    status: input.status ?? "draft",
    slug: input.slug,
    custom_excerpt: input.customExcerpt,
    feature_image: input.featureImage,
    tags: input.tags,
    authors: input.authors,
    canonical_url: input.canonicalUrl,
    meta_title: input.metaTitle,
    meta_description: input.metaDescription,
    codeinjection_foot: input.sourceId ? `<!-- starchart-source-id:${safeCommentValue(input.sourceId)} -->` : undefined,
  });
}

async function ghostRequest(config: GhostAdminConfig, path: string, init: RequestInit): Promise<unknown> {
  const fetchImpl = config.fetch ?? fetch;
  const url = new URL(path, normalizeGhostUrl(config.url));
  const token = createGhostAdminJwt(config.adminApiKey);
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Accept-Version": config.version ?? "v6.0",
      "Authorization": `Ghost ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) as unknown : null;
  if (!response.ok) {
    const detail = extractGhostError(body) ?? response.statusText;
    throw new Error(`Ghost Admin API ${response.status}: ${detail}`);
  }
  return body;
}

export function createGhostAdminJwt(adminApiKey: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const [id, secret] = adminApiKey.split(":");
  if (!id || !secret) throw new Error("Ghost Admin API key must use keyId:hexSecret format");

  const header = { alg: "HS256", typ: "JWT", kid: id };
  const payload = {
    iat: nowSeconds,
    exp: nowSeconds + 5 * 60,
    aud: "/admin/",
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", Buffer.from(secret, "hex")).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function normalizePostResult(response: unknown): GhostPostResult {
  const post = (response as { posts?: Array<Record<string, unknown>> }).posts?.[0];
  if (!post) throw new Error("Ghost response did not include a post");
  return {
    id: String(post.id),
    uuid: typeof post.uuid === "string" ? post.uuid : undefined,
    title: String(post.title ?? ""),
    slug: typeof post.slug === "string" ? post.slug : undefined,
    status: typeof post.status === "string" ? post.status as GhostPostResult["status"] : undefined,
    url: typeof post.url === "string" ? post.url : undefined,
    updatedAt: typeof post.updated_at === "string" ? post.updated_at : undefined,
    raw: post,
  };
}

function normalizeGhostUrl(url: string): string {
  if (!url) throw new Error("Ghost URL is required");
  return url.endsWith("/") ? url : `${url}/`;
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function safeCommentValue(value: string): string {
  return value.replace(/-->/g, "").replace(/[\r\n]/g, " ");
}

function extractGhostError(body: unknown): string | undefined {
  const errors = (body as { errors?: Array<{ message?: string }> })?.errors;
  return errors?.map((error) => error.message).filter(Boolean).join("; ");
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}
