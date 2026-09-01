import { redirect } from "next/navigation";
import { ConfigRequired } from "@/components/config-required";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!hasSupabaseConfig()) return <ConfigRequired />;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  redirect(data?.claims?.sub ? "/app" : "/login");
}
