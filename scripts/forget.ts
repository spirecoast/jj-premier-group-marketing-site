/**
 * Erase one person from the site database, for a request under the privacy
 * page's "To see, correct or delete the personal information we hold about
 * you" (docs/SITE.md, "Personal data retention").
 *
 *   DATABASE_URL=... npx tsx scripts/forget.ts --email jane@example.com [--phone "(941) 555-0100"]
 *       A dry run: says what would go, changes nothing.
 *   DATABASE_URL=... npx tsx scripts/forget.ts --email jane@example.com --confirm
 *       Does it, in one transaction, and prints a receipt to keep or send.
 *
 * Removes their form submissions (leads, with lead_deliveries and anything
 * else that hangs off a lead), their contacts rows (with their events), their
 * newsletter subscriptions and the record of every newsletter email sent to
 * them. Where someone else referred them, their name, email, phone and the
 * note about them are scrubbed from the referrer's lead and event, and the
 * referrer's own record stays. One row goes into `erasures` (migration 0016)
 * with the date, the counts and a SHA-256 of the address and number, never
 * the address itself.
 *
 * Match by email, by phone, or both (a phone matches on its last ten digits,
 * however it was typed). Run the dry run first and read the counts.
 */
import postgres from "postgres";
import { eraseReceipt, parseEraseArgs, sha256, type EraseCounts } from "../lib/privacy/erase";

class DryRun extends Error {}

async function main() {
  let req;
  try {
    req = parseEraseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    console.error('Usage: npx tsx scripts/forget.ts --email jane@example.com [--phone "(941) 555-0100"] [--confirm]');
    process.exit(2);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL isn't set.");
    process.exit(2);
  }
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => undefined });
  const { email, phone } = req;
  const counts: EraseCounts = {};
  const at = new Date();
  let recorded = false;

  // The same tests on every table: lowercased email equal, or the last ten digits of a phone equal.
  const byEmail = (col: string) => (email ? sql`lower(${sql(col)}) = ${email}` : sql`false`);
  const byPhone = (expr: ReturnType<typeof sql.unsafe>) => (phone ? sql`right(regexp_replace(coalesce(${expr}, ''), '\\D', '', 'g'), 10) = ${phone}` : sql`false`);

  try {
    await sql.begin(async (tx) => {
      const contacts = await tx<{ id: string }[]>`select id from contacts where ${byEmail("email")} or ${byPhone(sql.unsafe("phone"))}`;
      const contactIds = contacts.map((c) => c.id);

      const leads = await tx`delete from leads where ${byEmail("email")} or ${byPhone(sql.unsafe("phone"))} returning id`;
      counts.leads = leads.length;

      const referrals = await tx`
        update leads set payload = payload - 'referral', message = null
         where (${email ? sql`lower(payload->'referral'->>'email') = ${email}` : sql`false`})
            or ${byPhone(sql.unsafe("payload->'referral'->>'phone'"))}
        returning id`;
      counts.referrals = referrals.length;

      const scrubbed = await tx`
        update events set payload = payload - array['referred_first_name', 'referred_last_name', 'referred_email', 'referred_phone', 'referred_plan', 'referral_note', 'message']
         where (${email ? sql`lower(payload->>'referred_email') = ${email}` : sql`false`})
            or ${byPhone(sql.unsafe("payload->>'referred_phone'"))}
        returning id`;
      counts.events = scrubbed.length;

      const deliveries = await tx`delete from newsletter_deliveries where ${byEmail("email")} returning id`;
      counts.deliveries = deliveries.length;
      const subscriptions = await tx`delete from newsletter_subscriptions where ${byEmail("email")} returning id`;
      counts.subscriptions = subscriptions.length;

      if (contactIds.length) {
        const removed = await tx`delete from contacts where id = any(${contactIds}::uuid[]) returning id`;
        counts.contacts = removed.length;
      } else counts.contacts = 0;

      if (!req.confirm) throw new DryRun();

      try {
        await tx.savepoint(async (sp) => {
          await sp`insert into erasures (email_sha256, phone_sha256, erased_at, counts)
                   values (${email ? sha256(email) : null}, ${phone ? sha256(phone) : null}, ${at.toISOString()}::timestamptz, ${sp.json(counts)})`;
        });
        recorded = true;
      } catch (err) {
        console.error(`(The erasure itself went through, but no record was kept in erasures: ${err instanceof Error ? err.message : err}. Apply migration 0016.)`);
      }
    });
  } catch (err) {
    if (!(err instanceof DryRun)) {
      console.error("Nothing was changed:", err instanceof Error ? err.message : err);
      await sql.end();
      process.exit(1);
    }
  }
  await sql.end();
  console.log(eraseReceipt(req, counts, at));
  if (req.confirm && !recorded) process.exitCode = 3;
}

main();
