-- テスト用のダミーデータ
-- 本番環境では実行しないでください

-- 注意: ユーザーはSupabase Authで作成してください
-- 以下のUUIDは、auth.usersに実際に存在するユーザーIDに置き換えてください

-- サンプルゲーム
insert into games (title, description, player_min, player_max, image_url, stock) values
  ('カタン', '無人島を舞台に開拓競争をする戦略ゲーム', 3, 4, 'https://example.com/catan.jpg', 3),
  ('ドミニオン', 'デッキ構築型カードゲームの代表作', 2, 4, 'https://example.com/dominion.jpg', 2),
  ('パンデミック', '協力型ボードゲーム。世界を救おう！', 2, 4, 'https://example.com/pandemic.jpg', 1),
  ('アズール', 'タイル配置系の美しいボードゲーム', 2, 4, 'https://example.com/azul.jpg', 2),
  ('コードネーム', 'チーム戦の連想ゲーム', 4, 8, 'https://example.com/codenames.jpg', 4),
  ('チケット・トゥ・ライド', '鉄道をテーマにした陣取りゲーム', 2, 5, 'https://example.com/ticket-to-ride.jpg', 2),
  ('スプレンダー', '宝石商となって富を築くゲーム', 2, 4, 'https://example.com/splendor.jpg', 3),
  ('キングドミノ', 'ドミノ牌で王国を作るゲーム', 2, 4, 'https://example.com/kingdomino.jpg', 2)
on conflict do nothing;

-- サンプルレビュー
-- 注意: user_idは実際にauth.usersに存在するユーザーIDに置き換えてください
-- 以下はコメントアウトしています
/*
insert into reviews (game_id, user_id, rating, comment) values
  (1, 'your-user-id-here', 5, '戦略性が高く、何度やっても飽きません！'),
  (1, 'your-user-id-here', 4, '楽しいけど、慣れるまで少し時間がかかります'),
  (2, 'your-user-id-here', 5, 'デッキ構築の面白さが詰まった名作です'),
  (3, 'your-user-id-here', 5, '協力プレイが熱い！チームワークが試されます'),
  (4, 'your-user-id-here', 5, 'シンプルだけど奥が深い。美しいコンポーネントも魅力'),
  (5, 'your-user-id-here', 4, 'パーティーゲームとして最高！'),
  (6, 'your-user-id-here', 4, '家族で楽しめるボードゲームです');
*/

