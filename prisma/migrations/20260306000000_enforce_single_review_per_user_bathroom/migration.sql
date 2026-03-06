-- Enforce one review per user per bathroom.
-- Keep the most recent review for each (bathroom_id, user_id) pair.
DELETE FROM "Review" older
USING "Review" newer
WHERE older.bathroom_id = newer.bathroom_id
  AND older.user_id = newer.user_id
  AND (
    older.created_at < newer.created_at
    OR (older.created_at = newer.created_at AND older.id < newer.id)
  );

CREATE UNIQUE INDEX "Review_bathroom_id_user_id_key" ON "Review"("bathroom_id", "user_id");
