import type { Session } from "next-auth";
import { getDb, isDatabaseUrlConfigured } from "@/lib/db";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type AppUserInput = {
  keycloakSub: string;
  email: string;
  displayName: string;
};

function hasUserStore(): boolean {
  return isSupabaseConfigured() || isDatabaseUrlConfigured();
}

async function upsertViaSupabase(input: AppUserInput): Promise<string> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        keycloak_sub: input.keycloakSub,
        email: input.email,
        display_name: input.displayName,
      },
      { onConflict: "keycloak_sub" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`User upsert failed: ${error?.message ?? "no row"}`);
  }
  return data.id;
}

async function upsertViaPostgres(input: AppUserInput): Promise<string> {
  const sql = getDb();
  const rows = await sql<{ id: string }[]>`
    insert into public.users (keycloak_sub, email, display_name)
    values (${input.keycloakSub}, ${input.email}, ${input.displayName})
    on conflict (keycloak_sub) do update set
      email = excluded.email,
      display_name = excluded.display_name
    returning id
  `;
  const id = rows[0]?.id;
  if (!id) {
    throw new Error("User upsert failed: no id returned");
  }
  return id;
}

/** Ensures a `public.users` row for the Keycloak subject; returns internal user UUID. */
export async function ensureAppUser(input: AppUserInput): Promise<string> {
  if (!hasUserStore()) {
    throw new Error("Cart requires Supabase or DATABASE_URL");
  }
  if (isSupabaseConfigured()) {
    return upsertViaSupabase(input);
  }
  return upsertViaPostgres(input);
}

export async function getAppUserIdForSession(
  session: Session | null,
): Promise<string | null> {
  const sub = session?.user?.id;
  if (!sub) {
    return null;
  }
  return ensureAppUser({
    keycloakSub: sub,
    email: session.user?.email ?? "",
    displayName: session.user?.name ?? "",
  });
}

export async function findUserByKeycloakSub(
  keycloakSub: string,
): Promise<UserRow | null> {
  if (!hasUserStore()) {
    return null;
  }
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("keycloak_sub", keycloakSub)
      .maybeSingle();
    if (error) {
      throw new Error(`User lookup failed: ${error.message}`);
    }
    return data;
  }
  const sql = getDb();
  const rows = await sql<UserRow[]>`
    select *
    from public.users
    where keycloak_sub = ${keycloakSub}
    limit 1
  `;
  return rows[0] ?? null;
}
