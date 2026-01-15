ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS reservation_id INT REFERENCES reservations(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reviews_reviewer_present'
  ) THEN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_reviewer_present
    CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_reviews_game_user_id
  ON reviews (game_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_reviews_game_guest_email
  ON reviews (game_id, lower(guest_email))
  WHERE guest_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_guest_email ON reviews(guest_email);
CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id ON reviews(reservation_id);

CREATE OR REPLACE FUNCTION create_review_as_guest(
  p_reservation_id INT,
  p_email TEXT,
  p_rating INT,
  p_comment TEXT DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id INT;
  v_review_id INT;
BEGIN
  IF p_reservation_id IS NULL OR p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'reservation_idとemailを指定してください');
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('success', false, 'error', '評価は1〜5の範囲で指定してください');
  END IF;

  SELECT game_id
    INTO v_game_id
  FROM reservations
  WHERE id = p_reservation_id
    AND guest_email = p_email;

  IF v_game_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '予約が見つかりません');
  END IF;

  INSERT INTO reviews (game_id, user_id, guest_name, guest_email, reservation_id, rating, comment)
  VALUES (v_game_id, NULL, p_guest_name, p_email, p_reservation_id, p_rating, p_comment)
  RETURNING id INTO v_review_id;

  RETURN json_build_object(
    'success', true,
    'id', v_review_id,
    'review_id', v_review_id,
    'game_id', v_game_id
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'このゲームには既にレビューを投稿しています');
END;
$$;

COMMENT ON FUNCTION create_review_as_guest IS 'ゲストが予約ID+メールで本人性を確認し、レビューを投稿する（SECURITY DEFINERでRLSをバイパス）';

