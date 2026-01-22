-- games テーブルの UPDATE / DELETE ポリシーを authenticated のみに限定
drop policy if exists "Authenticated users can update games" on games;
drop policy if exists "Authenticated users can delete games" on games;

create policy "Authenticated users can update games"
  on games
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete games"
  on games
  for delete
  to authenticated
  using (true);
