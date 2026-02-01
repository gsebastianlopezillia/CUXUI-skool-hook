// Supabase Configuration (Auth, Postgres, Storage)
// Set SUPABASE_URL, SUPABASE_ANON_KEY from Dashboard → Settings → API. Bucket name from Storage.
const SUPABASE_URL = "https://leotenvgpoelihwyxsay.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3RlbnZncG9lbGlod3l4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTc3NzMsImV4cCI6MjA4NTUzMzc3M30.WevuOiKhFJ2uCxfB8zO4hMpxXjj1ioXcjxVUfnqN7Ww";
const SUPABASE_BUCKET = "CUXUI-Skool-Router";

if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY ) {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseBucket = SUPABASE_BUCKET;
}
