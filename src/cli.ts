#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createGhostPost, updateGhostPost } from "./ghost.js";
import { defaultStarchartGhostCss } from "./css.js";

interface CliOptions {
  ghostUrl?: string;
  adminKey?: string;
  title?: string;
  htmlFile?: string;
  assetBaseUrl?: string;
  status?: "draft" | "published" | "scheduled";
  slug?: string;
  postId?: string;
  updatedAt?: string;
  noDefaultCss?: boolean;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options.ghostUrl || !options.adminKey || !options.title || !options.htmlFile || !options.assetBaseUrl) {
    usage();
    process.exitCode = 1;
    return;
  }

  const html = await readFile(options.htmlFile, "utf8");
  const baseInput = {
    title: options.title,
    html,
    assetBaseUrl: options.assetBaseUrl,
    css: options.noDefaultCss ? undefined : defaultStarchartGhostCss,
    status: options.status ?? "draft",
    slug: options.slug,
  };

  const config = { url: options.ghostUrl, adminApiKey: options.adminKey };
  const result = options.postId
    ? await updateGhostPost(config, { ...baseInput, id: options.postId, updatedAt: requireOption(options.updatedAt, "--updated-at") })
    : await createGhostPost(config, baseInput);

  console.log(JSON.stringify(result, null, 2));
}

function parseArgs(args: string[]): CliOptions {
  const out: CliOptions = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = () => args[++i] ?? "";
    switch (arg) {
      case "--ghost-url": out.ghostUrl = next(); break;
      case "--admin-key": out.adminKey = next(); break;
      case "--title": out.title = next(); break;
      case "--html-file": out.htmlFile = next(); break;
      case "--asset-base-url": out.assetBaseUrl = next(); break;
      case "--status": out.status = next() as CliOptions["status"]; break;
      case "--slug": out.slug = next(); break;
      case "--post-id": out.postId = next(); break;
      case "--updated-at": out.updatedAt = next(); break;
      case "--no-default-css": out.noDefaultCss = true; break;
      case "--help": usage(); process.exit(0);
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function requireOption<T>(value: T | undefined, name: string): T {
  if (!value) throw new Error(`${name} is required when updating an existing Ghost post`);
  return value;
}

function usage(): void {
  console.error(`Usage:
  starchart-ghost --ghost-url https://site.example --admin-key keyId:secret \\
    --title "Post title" --html-file ./rendered.html --asset-base-url https://starchart.example \\
    [--status draft|published] [--slug slug] [--post-id id --updated-at timestamp]
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
