// Purge files marked deleted (deleted_at) more than 5 days ago: remove from Storage and delete row.
// Schedule with cron (e.g. daily). Uses SUPABASE_SERVICE_ROLE_KEY; set BUCKET_NAME if not "media".

import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = Deno.env.get("BUCKET_NAME") ?? "media";
const DAYS = 5;

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key);

  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error: selectError } = await supabase
    .from("files")
    .select("id, storage_path")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let purged = 0;
  for (const row of rows ?? []) {
    if (row.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }
    const { error: delError } = await supabase.from("files").delete().eq("id", row.id);
    if (!delError) purged++;
  }

  return new Response(
    JSON.stringify({ purged, cutoff }),
    { headers: { "Content-Type": "application/json" } }
  );
});
