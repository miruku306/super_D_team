-- games テーブルの UPDATE ポリシー（公開）
create policy "Authenticated users can update games"
  on games
  for update
  using (true)
  with check (true);

-- games テーブルの DELETE ポリシー（公開）
create policy "Authenticated users can delete games"
  on games
  for delete
  using (true);
