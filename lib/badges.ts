import supabase from "@/supabaseClient";

export const BADGE_META: Record<string, { emoji: string; label: string }> = {
  first_flush: { emoji: "🚽", label: "First Flush" },
  regular: { emoji: "⭐", label: "Regular" },
  top_reviewer: { emoji: "🏆", label: "Top Reviewer" },
  dev: { emoji: "💻", label: "Dev" },
};

export async function awardBadge(supabaseAuthId: string, badgeType: string) {
  const { data } = await supabase
    .from("badges")
    .select()
    .eq("user_id", supabaseAuthId)
    .eq("badge_type", badgeType);

  if (!data?.length) {
    await supabase
      .from("badges")
      .insert({ user_id: supabaseAuthId, badge_type: badgeType });
  }
}
