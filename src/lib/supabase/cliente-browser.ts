"use client";

import { createBrowserClient } from "@supabase/ssr";

export const loginSupabaseHabilitado =
  process.env.NEXT_PUBLIC_SUPABASE_LOGIN_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));

export function clienteSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!loginSupabaseHabilitado || !url || !chave) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  return createBrowserClient(url, chave);
}
