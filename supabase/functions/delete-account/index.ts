import { createClient } from "npm:@supabase/supabase-js@2.118.0";

import { asCaller, fail, json } from "../_shared/http.ts";

// POST, Authorization: Bearer <the signed-in user's access token>
//
// Deletes the caller's account. Their profile, plans, grocery lists, pantry and household links are removed
// with it, because every table references auth.users with on delete cascade. App stores require in-app
// account deletion for apps with sign-in. Uses the service role key Supabase provides to the function.

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const caller = await asCaller(req);
  if (caller instanceof Response) return caller;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(caller.userId);
  if (error) return fail("delete-account", "delete_failed", error.message);
  return json({ deleted: true });
});
