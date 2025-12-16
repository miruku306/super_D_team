-- 予約テーブルのRLSポリシーを緩和
-- お客様にアカウント登録を要求せず、気軽に予約できるようにする

-- 既存のポリシーを削除
drop policy if exists "Users can view own reservations" on reservations;
drop policy if exists "Authenticated users can create reservations" on reservations;
drop policy if exists "Users can update own reservations" on reservations;

-- 新しいポリシー: 誰でも予約を参照可能
create policy "Anyone can view reservations"
  on reservations for select
  using (true);

-- 新しいポリシー: 誰でも予約を作成可能
create policy "Anyone can create reservations"
  on reservations for insert
  with check (true);

-- 新しいポリシー: 誰でも予約を更新可能（返却処理など）
create policy "Anyone can update reservations"
  on reservations for update
  using (true);

-- 新しいポリシー: 誰でも予約を削除可能（キャンセル処理など）
create policy "Anyone can delete reservations"
  on reservations for delete
  using (true);

