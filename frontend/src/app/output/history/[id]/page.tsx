// /app/history/[id]/page.tsx (Server Component)
import { HistoryOutputClient } from "./client-component";

export default function HistoryOutputPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);

  return <HistoryOutputClient taskId={id} />;
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: (i + 1).toString(), // IDs from 1 to 10
  }));
}
