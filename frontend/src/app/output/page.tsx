"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getTaskHistory } from "@/lib/db"; // Make sure this function is correctly implemented
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

export default function OutputPage() {
  const [latestTask, setLatestTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskSections, setTaskSections] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchLatestTask = async () => {
      try {
        const history = await getTaskHistory(); // Fetch all tasks from IndexedDB
        if (history.length > 0) {
          const task = history[history.length - 1]; // Get the most recent task
          setLatestTask(task);

          // Split the task output by double newlines
          if (task.apiOutput) {
            setTaskSections(
              task.apiOutput
                .split("\n\n")
                .filter((section) => section.trim() !== ""),
            );
          }
        }
      } catch (err) {
        setError("Failed to load task history.");
      }
    };

    fetchLatestTask();
  }, []);

  const push = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4">
      <Button
        onClick={() => {
          push();
        }}
      >
        Home
      </Button>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Task Plan</h1>

            {error && (
              <div className="text-red-500 p-4 border rounded-lg">
                Error: {error}
              </div>
            )}

            {!latestTask && !error && (
              <div className="p-4 border rounded-lg bg-muted">Loading...</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {taskSections.map((section, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4 bg-card">
                    <p className="whitespace-pre-line">{section}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
