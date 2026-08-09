import {
  createClient,
} from "@supabase/supabase-js";

function obterUrlSupabase() {
  const url = String(
    import.meta.env.VITE_SUPABASE_URL || ""
  ).trim();

  if (!/^https?:\/\//i.test(url)) {
    throw new Error("VITE_SUPABASE_URL não configurada.");
  }

  return url;
}

function obterChaveSupabase() {
  const chave = String(
    import.meta.env
      .VITE_SUPABASE_PUBLISHABLE_KEY ||
      ""
  ).trim();

  if (!chave.startsWith("sb_publishable_") && !chave.startsWith("eyJ")) {
    throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY não configurada.");
  }

  return chave;
}

export const supabase = createClient(
  obterUrlSupabase(),
  obterChaveSupabase(),
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
);
