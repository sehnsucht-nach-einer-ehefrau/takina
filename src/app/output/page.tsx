"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getTaskHistory, indexExists } from "@/lib/db"; // Make sure this function is correctly implemented
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

import { House, ChevronLeft, ChevronRight, Play } from "lucide-react";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Task {
  id: number;
  title: string;
  steps: string[];
}

interface TaskHistory {
  id: number;
  apiOutput: string;
  date: string;
  dateDifference: number;
  tasks: Task[];
}

export default function OutputPage() {
  const [latestTask, setLatestTask] = useState<TaskHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskSections, setTaskSections] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<number | null>(0);
  const [openPlay, setOpenPlay] = useState(false);

  const openPlaySetter = () => {
    setOpenPlay(true);
  };

  const router = useRouter();

  useEffect(() => {
    const fetchLatestTask = async () => {
      try {
        const history = await getTaskHistory(); // Fetch all tasks from IndexedDB
        if (history.length > 0) {
          const task = history[history.length - 1]; // Get the most recent task
          setLatestTask(task);

          setTaskId(task.id);

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
        setError("Failed to load task history. Error: " + err);
      }
    };

    fetchLatestTask();
  }, []);

  const navigateHome = () => {
    router.push("/");
  };

  const navigateLeft = async () => {
    // Log the result of the check for debugging
    if (taskId === null) {
      console.error("Error: taskId is null, cannot navigate right.");
      return;
    }
    const exists = await indexExists(taskId - 1);
    console.log("Left navigation check:", exists); // Debugging output

    if (exists) {
      router.push(`/output/history/${taskId - 1}`);
    } else {
      toast("This is the oldest task plan.");
    }
  };

  const navigateRight = async () => {
    // Log the result of the check for debugging
    if (taskId === null) {
      console.error("Error: taskId is null, cannot navigate right.");
      return;
    }
    const exists = await indexExists(taskId + 1);
    console.log("Right navigation check:", exists); // Debugging output

    if (exists) {
      router.push(`/output/history/${taskId + 1}`);
    } else {
      toast("This is the most recent task plan.");
    }
  };

  const navigateWalkthrough = async () => {
    if (taskId === null) {
      console.error("Error: taskId is null, cannot navigate right.");
      return;
    }
    const exists = await indexExists(taskId);

    if (exists) {
      router.push(`/walkthrough/${taskId}`);
    } else {
      toast("This task plan does not supposed to exist.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between">
        <Button size="icon" onClick={navigateLeft} variant="ghost">
          <ChevronLeft />
        </Button>
        <Button size="icon" onClick={navigateHome} variant="ghost">
          <House />
        </Button>
        <Button size="icon" onClick={navigateRight} variant="ghost">
          <ChevronRight />
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold">Task Plan</h1>

              <Button size="icon" variant="ghost" onClick={openPlaySetter}>
                <Play />
              </Button>
            </div>

            <AlertDialog open={openPlay}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Begin task walkthrough?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <div className="flex justify-between gap-4 w-full">
                    <AlertDialogCancel onClick={() => setOpenPlay(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => navigateWalkthrough()}>
                      Continue
                    </AlertDialogAction>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
