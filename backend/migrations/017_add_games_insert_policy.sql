-- games テーブルの INSERT ポリシー
CREATE POLICY "Authenticated users can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
