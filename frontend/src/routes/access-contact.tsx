import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/access-contact")({
  component: AccessContactPage,
});

function AccessContactPage() {
  return (
    <div>
      <h1>アクセス＆お問い合わせページ</h1>
      <p>ここはアクセス情報とお問い合わせのページです。</p>
    </div>
  );
}
