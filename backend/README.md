# ボードゲームの貸出システムのバックエンドドキュメント

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
＃
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key

SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
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

// ゲームを予約する（認証ユーザー）
const reservationResult = await ReservationsService.reserveGame(gameId, userId);

// ゲームを予約する（ゲスト）
const guestReservation = await ReservationsService.reserveGameAsGuest(gameId, {
  name: "田中太郎",
  email: "tanaka@example.com",
  phone: "090-1234-5678", // オプション
});

// ゲストの予約を確認
const reservation = await ReservationsService.verifyGuestReservation(
  reservationId,
  "tanaka@example.com"
);

// ゲストの現在予約中のゲームを取得
const guestReservations = await ReservationsService.getCurrentGuestReservations(
  "tanaka@example.com"
);

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
- **reservations**: 自分の予約履歴のみ参照・更新可能（ゲスト予約は認証不要）
- **reviews**: 全員が参照可能、自分のレビューのみ作成・更新・削除可能

### 認証について

- 認証ユーザー: Supabase Auth を使用
- ゲスト予約: 認証不要（メールアドレスと名前のみで予約可能）

### ゲスト予約のセキュリティ

ゲスト予約では以下のセキュリティ対策を実施：

1. **メールアドレスのバリデーション**: 正しい形式のメールアドレスのみ受付
2. **予約確認の二重認証**: 予約 ID とメールアドレスの両方が必要
3. **データベース制約**: ゲスト情報の必須項目をデータベースレベルで保証

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

#### 認証ユーザー向け

- `reserveGame(gameId, userId)` - ゲームを予約する（在庫チェック付き）
- `returnGame(reservationId, userId)` - ゲームを返却
- `cancelReservation(reservationId, userId)` - 予約をキャンセル
- `getUserReservations(userId)` - ユーザーの予約履歴
- `getCurrentReservations(userId)` - 現在予約中のゲーム
- `isGameReservedByUser(gameId, userId)` - 予約状況チェック

#### ゲスト向け

- `reserveGameAsGuest(gameId, guestInfo)` - ゲストとしてゲームを予約
- `getGuestReservations(email)` - ゲストの予約履歴
- `getCurrentGuestReservations(email)` - ゲストの現在予約中
- `verifyGuestReservation(reservationId, email)` - 予約確認（ID + メール認証）

#### 共通

- `getGameReservations(gameId)` - ゲームの予約履歴
- `getReservationStats()` - 予約統計情報
- `getAllCurrentReservations()` - 全ての現在予約中（管理用）
- `getReservationById(reservationId)` - 特定の予約情報取得

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

- `reserve_game(game_id, user_id)` - 在庫チェック＆減算を 1 トランザクションで実行（認証ユーザー用）
- `reserve_game_as_guest(game_id, guest_name, guest_email, guest_phone)` - ゲスト予約用のトランザクション関数
- `return_game(reservation_id, user_id)` - 在庫を戻して返却処理を実行
- `cancel_reservation(reservation_id, user_id)` - 在庫を戻して予約をキャンセル

## データベース制約

データの整合性を保つため、以下の制約が設定されています：

- `check_user_or_guest` - 認証ユーザーまたはゲストのどちらか一方のみ設定可能
- `check_guest_info_complete` - ゲスト予約の場合は名前とメールアドレスが必須

## テスト

```bash
npm run type-check  # 型チェック
```

## ビルド

```bash
npm run build  # TypeScriptをコンパイル
```
