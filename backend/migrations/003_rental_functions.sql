-- 在庫管理を安全に行うための関数

-- ゲームを予約する関数（在庫チェック付き）
create or replace function reserve_game(
  p_game_id int,
  p_user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_stock int;
  v_reservation_id int;
begin
  -- 在庫チェック（FOR UPDATE でロック）
  select stock into v_stock
  from games
  where id = p_game_id
  for update;

  if v_stock is null then
    return json_build_object(
      'success', false,
      'error', 'ゲームが見つかりません'
    );
  end if;

  if v_stock <= 0 then
    return json_build_object(
      'success', false,
      'error', '在庫がありません'
    );
  end if;

  -- 既に予約しているかチェック
  if exists (
    select 1 from reservations
    where game_id = p_game_id
      and user_id = p_user_id
      and status = 'reserved'
  ) then
    return json_build_object(
      'success', false,
      'error', '既にこのゲームを予約しています'
    );
  end if;

  -- 在庫を減らす
  update games
  set stock = stock - 1
  where id = p_game_id;

  -- 予約レコードを作成
  insert into reservations (game_id, user_id, status)
  values (p_game_id, p_user_id, 'reserved')
  returning id into v_reservation_id;

  return json_build_object(
    'success', true,
    'reservation_id', v_reservation_id
  );
end;
$$;

-- ゲームを返却する関数
create or replace function return_game(
  p_reservation_id int,
  p_user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_game_id int;
  v_current_status text;
begin
  -- 予約情報を取得（FOR UPDATE でロック）
  select game_id, status into v_game_id, v_current_status
  from reservations
  where id = p_reservation_id
    and user_id = p_user_id
  for update;

  if v_game_id is null then
    return json_build_object(
      'success', false,
      'error', '予約情報が見つかりません'
    );
  end if;

  if v_current_status = 'returned' then
    return json_build_object(
      'success', false,
      'error', '既に返却済みです'
    );
  end if;

  if v_current_status = 'cancelled' then
    return json_build_object(
      'success', false,
      'error', 'キャンセル済みの予約です'
    );
  end if;

  -- 在庫を戻す
  update games
  set stock = stock + 1
  where id = v_game_id;

  -- 予約レコードを更新
  update reservations
  set status = 'returned',
      returned_at = now()
  where id = p_reservation_id;

  return json_build_object(
    'success', true
  );
end;
$$;

-- 予約をキャンセルする関数
create or replace function cancel_reservation(
  p_reservation_id int,
  p_user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_game_id int;
  v_current_status text;
begin
  -- 予約情報を取得（FOR UPDATE でロック）
  select game_id, status into v_game_id, v_current_status
  from reservations
  where id = p_reservation_id
    and user_id = p_user_id
  for update;

  if v_game_id is null then
    return json_build_object(
      'success', false,
      'error', '予約情報が見つかりません'
    );
  end if;

  if v_current_status = 'returned' then
    return json_build_object(
      'success', false,
      'error', '既に返却済みです'
    );
  end if;

  if v_current_status = 'cancelled' then
    return json_build_object(
      'success', false,
      'error', '既にキャンセル済みです'
    );
  end if;

  -- 在庫を戻す
  update games
  set stock = stock + 1
  where id = v_game_id;

  -- 予約レコードを更新
  update reservations
  set status = 'cancelled',
      returned_at = now()
  where id = p_reservation_id;

  return json_build_object(
    'success', true
  );
end;
$$;

