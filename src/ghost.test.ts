import { describe, expect, it } from "vitest";
import { createGhostAdminJwt, createGhostPost } from "./ghost.js";

const fakeSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("createGhostAdminJwt", () => {
  it("creates a Ghost JWT with expected header and payload", () => {
    const token = createGhostAdminJwt(`key123:${fakeSecret}`, 1_700_000_000);
    const [header, payload, signature] = token.split(".");

    expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({
      alg: "HS256",
      typ: "JWT",
      kid: "key123",
    });
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      iat: 1_700_000_000,
      exp: 1_700_000_300,
      aud: "/admin/",
    });
    expect(signature).toBeTruthy();
  });
});

describe("createGhostPost", () => {
  it("posts HTML-card content to Ghost with source=html", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({
        posts: [{
          id: "post-1",
          title: "Ghost Title",
          status: "draft",
          updated_at: "2026-01-01T00:00:00.000Z",
        }],
      }), { status: 201, headers: { "content-type": "application/json" } });
    };

    const result = await createGhostPost(
      { url: "https://ghost.example", adminApiKey: `key123:${fakeSecret}`, fetch: fakeFetch },
      {
        title: "Ghost Title",
        html: `<p><img src="/api/charts/svg"></p>`,
        assetBaseUrl: "https://starchart.example",
        status: "draft",
        sourceId: "writing-123",
      },
    );

    expect(result.id).toBe("post-1");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://ghost.example/ghost/api/admin/posts/?source=html");
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toMatch(/^Ghost /);

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.posts[0].html).toContain("<!--kg-card-begin: html-->");
    expect(body.posts[0].html).toContain(`src="https://starchart.example/api/charts/svg"`);
    expect(body.posts[0].codeinjection_foot).toContain("starchart-source-id:writing-123");
  });
});
