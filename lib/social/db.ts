/**
 * Typed Supabase queries for generated_posts.
 *
 * One table, four operations:
 *   - recentForContext  : fetch last N angle_tags + displays (passed to Claude)
 *   - insertPending     : create a pending row from a Zod-validated generation
 *   - markFbPublished   : update FB success state with returned post_id
 *   - markIgPublished   : update IG success state with returned media_id
 *   - listPendingIg     : pull rows that need IG mirroring (fb done, ig not)
 *   - markFailed        : write a terminal-failure status with error message
 *
 * All queries use the service-role admin client — these routes run from
 * Vercel cron, never from a user session.
 */

import { createClient } from "@supabase/supabase-js";
import type { GeneratedPost } from "./post-generator";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface GeneratedPostRow {
  id: string;
  slug: string;
  angle_tag: string;
  rationale: string | null;
  eyebrow: string | null;
  display: string;
  body: string | null;
  caption: string;
  image_bg: string;
  accent_badge: string | null;
  display_color: string | null;
  footer: string | null;
  status: "pending" | "rendered" | "fb_published" | "fb_failed" | "ig_published" | "ig_failed";
  fb_post_id: string | null;
  ig_media_id: string | null;
  fb_published_at: string | null;
  ig_published_at: string | null;
  claude_model: string | null;
  generation_prompt_version: string | null;
  generation_metadata: Record<string, unknown>;
  errored_at: string | null;
  error_message: string | null;
  created_at: string;
}

export async function recentForContext(limit = 30): Promise<{
  angle_tags: string[];
  displays: string[];
  content_formats: string[];
}> {
  const sb = admin();
  const { data, error } = await sb
    .from("generated_posts")
    .select("angle_tag, display, generation_metadata")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`recentForContext: ${error.message}`);
  const rows = data ?? [];
  return {
    angle_tags: rows.map((r) => r.angle_tag).filter(Boolean),
    displays: rows.map((r) => r.display).filter(Boolean),
    content_formats: rows
      .map((r) => {
        const md = r.generation_metadata as { content_format?: unknown } | null;
        return typeof md?.content_format === "string" ? md.content_format : null;
      })
      .filter((f): f is string => Boolean(f)),
  };
}

export async function insertPending(args: {
  slug: string;
  post: GeneratedPost;
  claudeModel: string;
  promptVersion: string;
  metadata?: Record<string, unknown>;
}): Promise<GeneratedPostRow> {
  const sb = admin();
  const { data, error } = await sb
    .from("generated_posts")
    .insert({
      slug: args.slug,
      angle_tag: args.post.angle_tag,
      rationale: args.post.rationale,
      eyebrow: args.post.eyebrow,
      display: args.post.display,
      body: args.post.body,
      caption: args.post.caption,
      image_bg: args.post.image_bg,
      accent_badge: args.post.accent_badge,
      display_color: args.post.display_color,
      footer: "momfluence.app",
      status: "pending",
      claude_model: args.claudeModel,
      generation_prompt_version: args.promptVersion,
      generation_metadata: args.metadata ?? {},
    })
    .select("*")
    .single();
  if (error) throw new Error(`insertPending: ${error.message}`);
  return data as GeneratedPostRow;
}

export async function getBySlug(slug: string): Promise<GeneratedPostRow | null> {
  const sb = admin();
  const { data, error } = await sb
    .from("generated_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getBySlug: ${error.message}`);
  return (data as GeneratedPostRow) ?? null;
}

export async function markFbPublished(id: string, fbPostId: string): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from("generated_posts")
    .update({
      status: "fb_published",
      fb_post_id: fbPostId,
      fb_published_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`markFbPublished: ${error.message}`);
}

export async function markIgPublished(id: string, igMediaId: string): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from("generated_posts")
    .update({
      status: "ig_published",
      ig_media_id: igMediaId,
      ig_published_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`markIgPublished: ${error.message}`);
}

export async function markFailed(
  id: string,
  stage: "fb" | "ig",
  message: string
): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from("generated_posts")
    .update({
      status: stage === "fb" ? "fb_failed" : "ig_failed",
      errored_at: new Date().toISOString(),
      error_message: message.slice(0, 4000),
    })
    .eq("id", id);
  if (error) throw new Error(`markFailed: ${error.message}`);
}

export async function listPendingIgMirror(limit = 10): Promise<GeneratedPostRow[]> {
  const sb = admin();
  const { data, error } = await sb
    .from("generated_posts")
    .select("*")
    .not("fb_published_at", "is", null)
    .is("ig_published_at", null)
    .eq("status", "fb_published")
    .order("fb_published_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`listPendingIgMirror: ${error.message}`);
  return (data ?? []) as GeneratedPostRow[];
}
