import prisma from "../lib/prisma";
import { awardBadge } from "../lib/badges";

async function backfill() {
  const users = await prisma.user.findMany({
    select: { id: true, supabaseAuthId: true },
  });

  for (const user of users) {
    const reviewCount = await prisma.review.count({ where: { user_id: user.id } });
    console.log(`${user.supabaseAuthId}: ${reviewCount} reviews`);
    if (reviewCount >= 1) await awardBadge(user.supabaseAuthId, "first_flush");
    if (reviewCount >= 5) await awardBadge(user.supabaseAuthId, "regular");
    if (reviewCount >= 15) await awardBadge(user.supabaseAuthId, "top_reviewer");
  }

  console.log("Done!");
}

void backfill();
