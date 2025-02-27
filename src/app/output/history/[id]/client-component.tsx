// /app/history/[id]/client-component.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getTaskHistory, indexExists } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  walkthroughIndexExists,
  deleteWalkthroughState,
} from "@/lib/indexedDB";
import {
  House,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";

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
  const [openPlay, setOpenPlay] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [walkthroughExists, setWalkthroughExists] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const checkWalkthroughExists = async () => {
      try {
        const result = await walkthroughIndexExists(taskId); // Replace 1 with your taskId
        setWalkthroughExists(result);
      } catch (error) {
        console.error("Error checking index:", error);
      }
    };

    if (taskId) {
      checkWalkthroughExists();
    }
  }, [taskId]); // Empty dependency array means this runs only once on mount

  const openPlaySetter = () => {
    setOpenPlay(true);
  };

  const openDeleteSetter = () => {
    setOpenDelete(true);
  };

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

  const navigateLeft = async () => {
    // Log the result of the check for debugging
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
    const exists = await indexExists(taskId + 1);
    console.log("Right navigation check:", exists); // Debugging output

    if (exists) {
      router.push(`/output/history/${taskId + 1}`);
    } else {
      toast("This is the most recent task plan.");
    }
  };

  const navigateWalkthrough = async () => {
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

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (walkthroughExists) {
                      router.push(`/walkthrough/${taskId}`);
                    } else {
                      openPlaySetter();
                    }
                  }}
                >
                  {walkthroughExists ? <StepForward /> : <Play />}
                </Button>
                <Button size="icon" variant="ghost" onClick={openDeleteSetter}>
                  <RotateCcw />
                </Button>
              </div>
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

            <AlertDialog open={openDelete}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset task walkthrough?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                  This will reset all progress in your current walkthrough.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <div className="flex justify-between gap-4 w-full">
                    <AlertDialogCancel onClick={() => setOpenDelete(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteWalkthroughState(taskId);
                        setOpenDelete(false);
                        setWalkthroughExists(false);
                      }}
                    >
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

            {isLoading && (
              <div className="p-4 border rounded-lg bg-muted">Loading...</div>
            )}

            {!isLoading && task && (
              <div className="grid gap-4 md:grid-cols-2">
                {taskSections.map((section, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4 bg-card">
                      <p className="font-semibold text-lg">
                        {section.split("\n")[0]}
                      </p>
                      <p className="whitespace-pre-line">
                        {section.split("\n").slice(1).join("\n")}
                      </p>
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
