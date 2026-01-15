DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_reservation_id_fkey;

DROP INDEX IF EXISTS uniq_reviews_game_user_id;

DROP INDEX IF EXISTS idx_reviews_user_id;
DROP INDEX IF EXISTS idx_reviews_guest_email;
DROP INDEX IF EXISTS idx_reviews_reservation_id;

ALTER TABLE reviews
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS guest_email,
DROP COLUMN IF EXISTS reservation_id;

CREATE POLICY "Anyone can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE reviews IS 'ゲームレビュー';
COMMENT ON COLUMN reviews.guest_name IS 'ニックネーム（任意・匿名の場合はNULL）';
