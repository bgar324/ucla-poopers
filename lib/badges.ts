import supabase from "@/supabaseClient";

export const BADGE_META: Record<string, { emoji: string; label: string; description: string }> = {
  first_flush: { emoji: "🚽", label: "First Flush", description: "Everyone has to start somewhere. Yours happened to be a bathroom."},
  regular: { emoji: "⭐", label: "Regular", description: "You've claimed 5 thrones. People are starting to talk." },
  top_reviewer: { emoji: "🏆", label: "Top Reviewer", description: "15 reviews. At this point you might just live here." },
  dev: { emoji: "💻", label: "Dev", description: "Responsible for all the bugs. And the bathrooms." },
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
