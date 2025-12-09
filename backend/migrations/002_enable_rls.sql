-- Row Level Security (RLS) の有効化
-- 本番環境では必ずRLSを有効にしてセキュリティを確保してください

-- games テーブル
alter table games enable row level security;

-- 全員が参照可能
create policy "Games are viewable by everyone"
  on games for select
  using (true);

-- 認証済みユーザーのみ作成可能（管理者権限がある場合のみに変更することを推奨）
create policy "Authenticated users can insert games"
  on games for insert
  with check (auth.role() = 'authenticated');

-- reservations テーブル
alter table reservations enable row level security;

-- 自分の予約履歴のみ参照可能
create policy "Users can view own reservations"
  on reservations for select
  using (auth.uid() = user_id);

-- 認証済みユーザーは予約を作成可能
create policy "Authenticated users can create reservations"
  on reservations for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- 自分の予約のみ更新可能（返却処理など）
create policy "Users can update own reservations"
  on reservations for update
  using (auth.uid() = user_id);

-- reviews テーブル
alter table reviews enable row level security;

-- レビューは全員が参照可能
create policy "Reviews are viewable by everyone"
  on reviews for select
  using (true);

-- 認証済みユーザーはレビューを作成可能
create policy "Authenticated users can create reviews"
  on reviews for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- 自分のレビューのみ更新可能
create policy "Users can update own reviews"
  on reviews for update
  using (auth.uid() = user_id);

-- 自分のレビューのみ削除可能
create policy "Users can delete own reviews"
  on reviews for delete
  using (auth.uid() = user_id);

