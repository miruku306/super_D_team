-- 既存のゲームデータを更新（プレイ時間とジャンルを追加）
update games set play_time = 75, genre = '戦略' where title = 'カタン';
update games set play_time = 30, genre = 'デッキ構築' where title = 'ドミニオン';
update games set play_time = 45, genre = '協力' where title = 'パンデミック';
update games set play_time = 45, genre = 'タイル配置' where title = 'アズール';
update games set play_time = 15, genre = 'パーティー' where title = 'コードネーム';
update games set play_time = 45, genre = '鉄道' where title = 'チケット・トゥ・ライド';
update games set play_time = 30, genre = '戦略' where title = 'スプレンダー';
update games set play_time = 15, genre = 'タイル配置' where title = 'キングドミノ';

-- 追加のゲームデータ（HTMLに表示されていたゲーム）
insert into games (title, description, player_min, player_max, play_time, genre, image_url, stock) values
  ('カルカソンヌ', 'タイルを配置して街を広げ、道を繋ぎ、修道院を建てる。手軽に楽しめるタイル配置ゲーム。', 2, 5, 35, 'タイル配置', '/img/carcassonne.jpg', 2),
  ('アグリコラ', '農場を発展させる本格的ワーカープレースメント。やり込み要素満載。', 1, 4, 105, 'ワーカープレイス', '/img/agricola.jpg', 1)
on conflict do nothing;

-- 画像URLを更新（ローカルパスに変更）
update games set image_url = '/img/catan.jpg' where title = 'カタン';
update games set image_url = '/img/dominion.jpg' where title = 'ドミニオン';
update games set image_url = '/img/pandemic.jpg' where title = 'パンデミック';
update games set image_url = '/img/ticket-to-ride.jpg' where title = 'チケット・トゥ・ライド';

