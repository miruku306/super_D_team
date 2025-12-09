# ボードゲームの貸出システムの Backend

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend
npm install
```

### 2. 環境変数の設定

`.dev.vars.example` を `.dev.vars` にコピーして、Supabase の設定を記入：

```bash
cp .dev.vars.example .dev.vars
```

`.env` ファイルを編集：

```env
SUPABASE_URL=https://your-project-id.supabase.co

# 新形式のキー（推奨）
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

## 使い方

### フロントエンドからの使用例

```typescript
// バックエンドサービスをインポート
import {
  GamesService,
  ReservationsService,
  ReviewsService,
} from "./backend/src";

// ゲーム一覧を取得
const games = await GamesService.getAllGames();

// 在庫のあるゲームのみ取得
const availableGames = await GamesService.getAvailableGames();

// ゲームを検索
const searchResults = await GamesService.searchGames("カタン");

// プレイ人数でフィルタ
const gamesFor4Players = await GamesService.getGamesByPlayerCount(4);

// ゲームを予約する
const reservationResult = await ReservationsService.reserveGame(gameId, userId);

// ゲームを返却
const returnResult = await ReservationsService.returnGame(
  reservationId,
  userId
);

// 予約をキャンセル
await ReservationsService.cancelReservation(reservationId, userId);

// 現在予約中のゲームを取得
const currentReservations = await ReservationsService.getCurrentReservations(
  userId
);

// レビューを投稿
const review = await ReviewsService.createReview({
  game_id: gameId,
  user_id: userId,
  rating: 5,
  comment: "最高のゲームです！",
});

// ゲームのレビューを取得
const reviews = await ReviewsService.getGameReviews(gameId);

// ゲームの平均評価を取得
const stats = await ReviewsService.getGameRatingStats(gameId);
```

## 認証について

このプロジェクトは Supabase Auth を使用することを想定しています。

### 認証フロー

```typescript
import { supabase } from "./backend/src";

// サインアップ
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
});

// ログイン
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

// 現在のユーザーを取得
const {
  data: { user },
} = await supabase.auth.getUser();

// ログアウト
await supabase.auth.signOut();
```

## セキュリティ

RLS が有効になっています：

- **games**: 全員が参照可能、認証済みユーザーのみ作成可能
- **reservations**: 自分の予約履歴のみ参照・更新可能
- **reviews**: 全員が参照可能、自分のレビューのみ作成・更新・削除可能

認証は Supabase Auth を使用します。

## 主要な機能

### Games Service

- `getAllGames()` - 全ゲームを取得
- `getAvailableGames()` - 在庫のあるゲームを取得
- `getGameById(id)` - 特定のゲームを取得
- `getGameWithReviews(id)` - レビュー付きでゲームを取得
- `searchGames(query)` - ゲームを検索
- `getGamesByPlayerCount(count)` - プレイ人数でフィルタ
- `createGame(game)` - ゲームを追加
- `updateGame(id, updates)` - ゲームを更新
- `deleteGame(id)` - ゲームを削除

### Reservations Service

- `reserveGame(gameId, userId)` - ゲームを予約する（在庫チェック付き）
- `returnGame(reservationId, userId)` - ゲームを返却
- `cancelReservation(reservationId, userId)` - 予約をキャンセル
- `getUserReservations(userId)` - ユーザーの予約履歴
- `getCurrentReservations(userId)` - 現在予約中のゲーム
- `getGameReservations(gameId)` - ゲームの予約履歴
- `isGameReservedByUser(gameId, userId)` - 予約状況チェック
- `getReservationStats()` - 予約統計情報

### Reviews Service

- `getGameReviews(gameId)` - ゲームのレビューを取得
- `getUserReviews(userId)` - ユーザーのレビューを取得
- `createReview(review)` - レビューを投稿
- `updateReview(reviewId, userId, updates)` - レビューを更新
- `deleteReview(reviewId, userId)` - レビューを削除
- `getGameRatingStats(gameId)` - 評価統計（平均、分布）
- `getRecentReviews(limit)` - 最新のレビュー
- `hasUserReviewedGame(gameId, userId)` - レビュー済みかチェック

## トランザクション関数

在庫管理を安全に行うため、以下の Postgres 関数を使用：

- `reserve_game(game_id, user_id)` - 在庫チェック＆減算を 1 トランザクションで実行
- `return_game(reservation_id, user_id)` - 在庫を戻して返却処理を実行
- `cancel_reservation(reservation_id, user_id)` - 在庫を戻して予約をキャンセル

## テスト

```bash
npm run type-check  # 型チェック
```

## ビルド

```bash
npm run build  # TypeScriptをコンパイル
```
