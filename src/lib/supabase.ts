import { createClient } from "@supabase/supabase-js";

// Support either the ANON_KEY or the legacy/alternate PUBLISHABLE_KEY env name.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
