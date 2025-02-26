// /app/history/[id]/client-component.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getTaskHistory } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  apiOutput: string;
  // Add other task properties here
}

export function HistoryOutputClient({ taskId }: { taskId: number }) {
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskSections, setTaskSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setIsLoading(true);
        const history = await getTaskHistory();

        // Find the task with the matching ID
        const foundTask = history.find((item) => item.id === taskId);

        if (foundTask) {
          setTask(foundTask);

          if (foundTask.apiOutput) {
            setTaskSections(
              foundTask.apiOutput
                .split("\n\n")
                .filter((section) => section.trim() !== ""),
            );
          }
        } else {
          setError(`Task with ID ${taskId} not found`);
        }
      } catch (err) {
        setError("Failed to load task history");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const navigateHome = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4">
      <Button onClick={navigateHome}>Home</Button>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Task Plan</h1>

            {error && (
              <div className="text-red-500 p-4 border rounded-lg">
                Error: {error}
              </div>
            )}

            {isLoading && (
              <div className="p-4 border rounded-lg bg-muted">Loading...</div>
            )}

            {!isLoading && task && (
              <div className="grid gap-4 md:grid-cols-2">
                {taskSections.map((section, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4 bg-card">
                      <p className="whitespace-pre-line">{section}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
