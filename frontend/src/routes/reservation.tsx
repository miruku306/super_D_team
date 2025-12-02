import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reservation")({
  component: ReservationPage,
});

function ReservationPage() {
  return <div>予約ページ</div>;
}
