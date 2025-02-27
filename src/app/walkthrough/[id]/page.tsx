// /app/history/[id]/page.tsx (Server Component)
import { Walkthrough } from "./client-component";

type ParamsType = Promise<{ id: string }>;

export default async function WalkthroughServerside(props: {
  params: ParamsType;
}) {
  const { id } = await props.params;
  const taskId = parseInt(id, 10);

  return <Walkthrough taskId={taskId} />;
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: (i + 1).toString(), // IDs from 1 to 10
  }));
}
