-- ゲームテーブルにプレイ時間とジャンルを追加
alter table games
  add column if not exists play_time int,
  add column if not exists genre text;

-- 既存のゲームにデフォルト値を設定
update games set play_time = 60 where play_time is null;
update games set genre = 'その他' where genre is null;

-- コメント追加
comment on column games.play_time is 'プレイ時間（分）';
comment on column games.genre is 'ゲームのジャンル';

