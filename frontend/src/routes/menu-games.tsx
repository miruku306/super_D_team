import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/menu-games")({
  component: MenuGamesPage,
});

function MenuGamesPage() {
  return (
    <div>
      <h1>メニュー＆ゲームページ</h1>
      <p>ここはメニューとゲームのページです。</p>
    </div>
  );
}
