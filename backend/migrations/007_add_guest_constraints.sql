-- ゲスト予約に関する制約を追加

-- user_idまたはguest_emailのどちらかは必須（両方NULLまたは両方設定は不可）
ALTER TABLE reservations
ADD CONSTRAINT check_user_or_guest 
CHECK (
  (user_id IS NOT NULL AND guest_email IS NULL) OR 
  (user_id IS NULL AND guest_email IS NOT NULL)
);

-- ゲスト予約の場合、guest_nameとguest_emailは必須
ALTER TABLE reservations
ADD CONSTRAINT check_guest_info_complete
CHECK (
  user_id IS NOT NULL OR 
  (guest_name IS NOT NULL AND guest_email IS NOT NULL)
);

COMMENT ON CONSTRAINT check_user_or_guest ON reservations IS '認証ユーザーまたはゲストのどちらか一方のみ設定可能';
COMMENT ON CONSTRAINT check_guest_info_complete ON reservations IS 'ゲスト予約の場合は名前とメールアドレスが必須';

