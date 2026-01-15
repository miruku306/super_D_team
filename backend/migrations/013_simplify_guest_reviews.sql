ALTER TABLE reviews
ALTER COLUMN reservation_id DROP NOT NULL;

ALTER TABLE reviews
ALTER COLUMN guest_email DROP NOT NULL;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_reviewer_present;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_has_reviewer;

DROP INDEX IF EXISTS uniq_reviews_game_guest_email;

CREATE OR REPLACE FUNCTION create_simple_guest_review(
  p_game_id INT,
  p_guest_email TEXT DEFAULT NULL,
  p_rating INT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_id INT;
BEGIN
  IF p_game_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'game_id は必須です'
    );
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', '評価は1〜5の範囲で指定してください'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM games WHERE id = p_game_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ゲームが見つかりません'
    );
  END IF;

  INSERT INTO reviews (
    game_id,
    user_id,
    guest_name,
    guest_email,
    reservation_id,
    rating,
    comment
  )
  VALUES (
    p_game_id,
    NULL,
    p_guest_name,
    p_guest_email,
    NULL,
    p_rating,
    p_comment
  )
  RETURNING id INTO v_review_id;

  RETURN json_build_object(
    'success', true,
    'review_id', v_review_id,
    'id', v_review_id,
    'game_id', p_game_id
  );
END;
$$;

COMMENT ON FUNCTION create_simple_guest_review IS 'ゲストユーザーが予約なし・メールなしで匿名レビューを投稿する関数';
