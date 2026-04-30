import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { db } from "./index";
import { users } from "./schema/users";

// Edit this list before running
const STAFF: Array<{ name: string; email: string; phone: string; role: "kitchen" | "admin" }> = [
  { name: "Erick", email: "erickchauke0217@gmail.com", phone: "+27000000000", role: "admin" },
  // { name: "Lwazi", email: "lwazi@salilamuha.co.za", phone: "+27000000001", role: "kitchen" },
];

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  for (const staff of STAFF) {
    console.log(`Creating ${staff.role}: ${staff.email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: staff.email,
      email_confirm: true,
    });

    if (error) {
      // If user already exists in Supabase, get their id via listUsers
      if (error.message.includes("already been registered")) {
        console.log(`  Already in Supabase, looking up id...`);
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users.find((u) => u.email === staff.email);
        if (!existing) throw new Error(`Cannot find existing Supabase user for ${staff.email}`);
        await upsertRds(existing.id, staff);
      } else {
        throw new Error(`Supabase error: ${error.message}`);
      }
    } else {
      await upsertRds(data.user.id, staff);
    }

    console.log(`  Done.`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

async function upsertRds(
  id: string,
  staff: { name: string; email: string; phone: string; role: "kitchen" | "admin" }
) {
  await db
    .insert(users)
    .values({ id, name: staff.name, email: staff.email, phone: staff.phone, role: staff.role })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: staff.name, email: staff.email, role: staff.role },
    });
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
