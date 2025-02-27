"use client";

import * as React from "react";
import { format, differenceInDays } from "date-fns";
import {
  CalendarIcon,
  PlusCircle,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  AlignRight,
  Trash2,
  StepForward,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useTaskHandler } from "@/lib/useTaskHandler";
import { deleteTaskResponse } from "@/lib/db";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  walkthroughIndexExists,
  deleteWalkthroughState,
} from "@/lib/indexedDB";

interface Task {
  id: number;
  title: string;
  steps: string[];
}

export default function TaskPlanner() {
  const { handleSubmission, history, refreshHistory } = useTaskHandler();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isOpenDelete, setIsOpenDelete] = React.useState(false);
  const [position, setPosition] = React.useState<"left" | "right">("left");

  const [tasks, setTasks] = React.useState<Task[]>([
    { id: 1, title: "", steps: [""] },
  ]);
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState("");

  const [date, setDate] = React.useState<Date>();
  const [calOpen, setCalOpen] = React.useState(false);

  const today = new Date();
  const router = useRouter();

  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  const [walkthroughExists, setWalkthroughExists] = React.useState<{
    [id: number]: boolean;
  }>({});

  React.useEffect(() => {
    const fetchWalkthroughData = async () => {
      const result: { [id: number]: boolean } = {};

      for (const entry of history) {
        const exists = await walkthroughIndexExists(entry.id);
        result[entry.id] = exists;
      }

      setWalkthroughExists(result);
    };

    fetchWalkthroughData();
  }, [history]); // Re-run this effect whenever 'history' changes

  const disablePastDates = (date: Date) => {
    return date < new Date(today.setHours(0, 0, 0, 0));
  };

  const toggleMenubar = () => {
    setIsOpen(!isOpen);
  };

  const handlePositionChange = (newPosition: "left" | "right") => {
    if (newPosition) setPosition(newPosition);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: tasks.length + 1,
        title: "",
        steps: [""],
      },
    ]);
  };

  const updateTaskTitle = (taskId: number, title: string) => {
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, title } : task)),
    );
  };

  const updateTaskStep = (taskId: number, stepIndex: number, step: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const newSteps = [...task.steps];
          newSteps[stepIndex] = step;
          return { ...task, steps: newSteps };
        }
        return task;
      }),
    );
  };

  const addStepToTask = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, steps: [...task.steps, ""] } : task,
      ),
    );
  };

  const removeTask = (taskId: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== taskId));
    }
  };

  const removeStep = (taskId: number, stepIndex: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const newSteps = task.steps.filter((_, index) => index !== stepIndex);
          return { ...task, steps: newSteps.length ? newSteps : [""] };
        }
        return task;
      }),
    );
  };

  const handleSubmit = async () => {
    setFormSubmitted(true);

    // Validate date is selected
    if (!date) {
      setValidationError("Please select a due date");
      return;
    }

    // Validate at least one task has a title
    const hasValidTask = tasks.some((task) => task.title.trim() !== "");
    if (!hasValidTask) {
      setValidationError("Please fill out at least one task title");
      return;
    }

    const days = differenceInDays(date, new Date(today.setHours(0, 0, 0, 0)));
    try {
      await handleSubmission(tasks, days, date);
    } catch {
      setShowApiKeyDialog(true);
    }
  };

  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput) return;
    localStorage.setItem("groqApiKey", apiKeyInput);
    setShowApiKeyDialog(false);
    setApiKeyInput("");
  };

  return (
    <div className="pt-4 flex items-start justify-center">
      <Button
        variant="outline"
        size="icon"
        className={`fixed ${position === "right" ? "right-0 rounded-l-md rounded-r-none border-r-0" : "left-0 rounded-r-md rounded-l-none border-l-0"} top-1/2 z-40 -translate-y-1/2 bg-background shadow-md transition-all duration-300`}
        onClick={toggleMenubar}
        aria-label={isOpen ? "Close history" : "Open history"}
      >
        {isOpen ? (
          position === "right" ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )
        ) : position === "right" ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      <div className="space-y-6 border border-border rounded-lg p-6 duration-300 ease-in-out">
        <div className="space-y-4">
          {tasks.map((task, taskIndex) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor={`task-${task.id}`}>
                      Task {taskIndex + 1}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeTask(task.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    id={`task-${task.id}`}
                    value={task.title}
                    onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                    placeholder="Enter task title"
                    className={
                      formSubmitted && task.title.trim() === ""
                        ? "border-red-500"
                        : ""
                    }
                  />

                  <div className="space-y-3 pl-6">
                    {task.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={step}
                            onChange={(e) =>
                              updateTaskStep(task.id, stepIndex, e.target.value)
                            }
                            placeholder={`Step ${stepIndex + 1}`}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removeStep(task.id, stepIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => addStepToTask(task.id)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addTask} className="w-full" variant={"outline"}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>

          <div className="pt-4 flex items-center gap-4">
            <Label className="text-right min-w-[71px]">Due Date</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date ? "text-muted-foreground" : "",
                    formSubmitted && !date ? "border-red-500" : "",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    setCalOpen(false);
                  }}
                  disabled={disablePastDates}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button
          onClick={() => {
            const apiKeyExists = localStorage.getItem("groqApiKey");
            if (apiKeyExists != null) {
              handleSubmit();
            } else {
              setShowApiKeyDialog(true);
            }
          }}
          className="w-full"
          size="lg"
        >
          Submit
        </Button>
        <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set your Groq API key</AlertDialogTitle>
              <form onSubmit={handleApiKeySave} className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have a Groq API key? Get one for free{" "}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        className="font-medium text-primary underline"
                        rel="noreferrer"
                      >
                        here
                      </a>
                    </p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <AlertDialogCancel
                      onClick={() => setShowApiKeyDialog(false)}
                      asChild
                    >
                      <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <Button type="submit">Save</Button>
                  </div>
                </div>
              </form>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!validationError}
          onOpenChange={() => setValidationError(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Form Validation Error</AlertDialogTitle>
              <AlertDialogDescription>{validationError}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setValidationError(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMenubar}
        />
      )}

      {/* The sliding menubar */}
      <div
        className={`fixed bottom-0 top-0 z-50 flex flex-col w-[40%] max-w-md overflow-hidden bg-background shadow-lg transition-transform duration-300 ease-in-out ${
          position === "right"
            ? "right-0 " + (isOpen ? "translate-x-0" : "translate-x-full")
            : "left-0 " + (isOpen ? "translate-x-0" : "-translate-x-full")
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <History className="h-5 w-5" />
            Task History
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenubar}
            aria-label="Close history"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-20">
          {history.length === 0 && (
            <p className="text-muted-foreground">No history yet.</p>
          )}

          {history
            .slice()
            .reverse()
            .map((entry) => (
              <Card
                key={entry.id}
                className="mt-4"
                onClick={() => {
                  router.push(`/output/history/${entry.id}`);
                }}
              >
                <CardContent className="p-4 hover:cursor-pointer hover:shadow-md duration-300 ease-in-out">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      <strong>Date:</strong>{" "}
                      {entry.date
                        ? format(new Date(entry.date), "PPP")
                        : "No date"}
                    </p>
                    <div className="flex gap-2">
                      {/* Conditionally render the Continue Walkthrough button */}
                      {walkthroughExists[entry.id] && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation(); // Prevent the card click event from firing
                            router.push(`/walkthrough/${entry.id}`);
                          }}
                        >
                          <StepForward className="h-4 w-4" />
                          <span className="sr-only">Continue Walkthrough</span>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent the card click event from firing
                          setIsOpenDelete(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete entry</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p>
                      <strong>Tasks:</strong>{" "}
                      {entry.tasks.map((t) => t.title).join(", ")}
                    </p>
                  </div>
                </CardContent>
                <AlertDialog open={isOpenDelete}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete task forever?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <div className="flex justify-between gap-4 w-full">
                        <AlertDialogCancel
                          onClick={async (e) => {
                            e.stopPropagation(); // Prevent the card click event from firing
                            setIsOpenDelete(false);
                          }}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await deleteTaskResponse(entry.id);
                              await deleteWalkthroughState(entry.id);
                              await refreshHistory(); // Use the new function from useTaskHandler
                            } catch (error) {
                              console.error(
                                `Failed to delete task with ID: ${entry.id}`,
                                error,
                              );
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
        </div>

        {/* Position toggle at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <ToggleGroup
            type="single"
            value={position}
            onValueChange={handlePositionChange}
            className="flex w-full justify-between"
          >
            <ToggleGroupItem
              value="left"
              aria-label="Position left"
              className="flex-1"
            >
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="right"
              aria-label="Position right"
              className="flex-1"
            >
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
