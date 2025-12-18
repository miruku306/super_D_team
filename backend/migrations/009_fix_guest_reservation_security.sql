CREATE OR REPLACE FUNCTION reserve_game_as_guest(
  p_game_id INT,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_players TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- この行が重要：関数を所有者の権限で実行
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
  
  -- 予約を作成（ゲスト情報と詳細情報を含む）
  INSERT INTO reservations (
    game_id, 
    user_id, 
    guest_name, 
    guest_email, 
    guest_phone, 
    start_date,
    end_date,
    players,
    notes,
    status
  )
  VALUES (
    p_game_id, 
    NULL, 
    p_guest_name, 
    p_guest_email, 
    p_guest_phone,
    p_start_date,
    p_end_date,
    p_players,
    p_notes,
    'reserved'
  )
  RETURNING id INTO v_reservation_id;
  
  RETURN json_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'id', v_reservation_id
  );
END;
$$;

COMMENT ON FUNCTION reserve_game_as_guest IS 'ゲストユーザーがゲームを予約する関数。SECURITY DEFINERにより、匿名ユーザーでもRLSをバイパスして予約を作成できます。';

