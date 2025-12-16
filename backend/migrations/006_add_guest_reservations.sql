-- ゲスト予約に対応するため、user_idをnullableにし、ゲスト情報を保存するカラムを追加

-- reservationsテーブルにゲスト情報カラムを追加
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- user_idの外部キー制約を削除
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

-- user_idをnullableにする（既にnullableの場合はスキップ）
ALTER TABLE reservations
ALTER COLUMN user_id DROP NOT NULL;

-- ゲスト予約用の関数を作成
CREATE OR REPLACE FUNCTION reserve_game_as_guest(
  p_game_id INT,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock INT;
  v_reservation_id INT;
BEGIN
  -- 在庫チェック
  SELECT stock INTO v_stock FROM games WHERE id = p_game_id FOR UPDATE;
  
  IF v_stock IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'ゲームが見つかりません');
  END IF;
  
  IF v_stock <= 0 THEN
    RETURN json_build_object('success', false, 'error', '在庫がありません');
  END IF;
  
  -- 在庫を減らす
  UPDATE games SET stock = stock - 1 WHERE id = p_game_id;
  
  -- 予約を作成（ゲスト情報を含む）
  INSERT INTO reservations (game_id, user_id, guest_name, guest_email, guest_phone, status)
  VALUES (p_game_id, NULL, p_guest_name, p_guest_email, p_guest_phone, 'reserved')
  RETURNING id INTO v_reservation_id;
  
  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id
  );
END;
$$;

-- インデックスを追加（ゲストメールでの検索用）
CREATE INDEX IF NOT EXISTS idx_reservations_guest_email ON reservations(guest_email);

COMMENT ON COLUMN reservations.guest_name IS 'ゲスト予約時の名前';
COMMENT ON COLUMN reservations.guest_email IS 'ゲスト予約時のメールアドレス';
COMMENT ON COLUMN reservations.guest_phone IS 'ゲスト予約時の電話番号';


