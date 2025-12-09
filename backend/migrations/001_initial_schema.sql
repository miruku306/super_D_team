-- UUID 関連の関数を使うための拡張（Supabase では既に入ってることが多いが念のため）
create extension if not exists "pgcrypto";

-- ------------------------
-- games テーブル
-- ------------------------
create table if not exists games (
  id serial primary key,
  title text not null,
  description text,
  player_min int not null,
  player_max int not null,
  image_url text,
  stock int not null default 1,
  created_at timestamptz not null default now()
);

-- ------------------------
-- reservations テーブル（予約・貸出）
-- ------------------------
create table if not exists reservations (
  id serial primary key,
  game_id int not null references games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reserved_at timestamptz not null default now(),
  returned_at timestamptz,
  status text not null default 'reserved',
  -- 簡単な整合性チェック（任意）
  check (status in ('reserved', 'returned', 'cancelled'))
);

-- インデックス（よく検索する列に対して）
create index if not exists idx_reservations_game_id on reservations(game_id);
create index if not exists idx_reservations_user_id on reservations(user_id);
create index if not exists idx_reservations_status on reservations(status);

-- ------------------------
-- reviews テーブル（レビュー）
-- ------------------------
create table if not exists reviews (
  id serial primary key,
  game_id int not null references games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int not null,
  comment text,
  created_at timestamptz not null default now(),
  check (rating >= 1 and rating <= 5)
);

create index if not exists idx_reviews_game_id on reviews(game_id);
create index if not exists idx_reviews_user_id on reviews(user_id);

