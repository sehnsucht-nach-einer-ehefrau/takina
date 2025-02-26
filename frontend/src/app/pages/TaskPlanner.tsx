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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { callGroqAPI } from "@/lib/groq";
import { useTaskHandler } from "@/lib/useTaskHandler";
import HistoryBar from "../components/HistoryBar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function TaskPlanner() {
  const { handleSubmission, history } = useTaskHandler();
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<"left" | "right">("left");

  const [tasks, setTasks] = React.useState<Task[]>([
    { id: 1, title: "", steps: [""] },
  ]);
  const [showApiKeyDialog, setShowApiKeyDialog] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [hasApiKey, setHasApiKey] = React.useState(false);

  const [date, setDate] = React.useState<Date>();
  const [daysDifference, setDaysDifference] = React.useState<number | null>(
    null,
  );
  const [calOpen, setCalOpen] = React.useState(false);

  const today = new Date();
  const router = useRouter();

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
    setTasks(tasks.filter((task) => task.id !== taskId));
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
    const days = differenceInDays(date, new Date(today.setHours(0, 0, 0, 0)));
    setDaysDifference(days);
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
                    required
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
                    !date && "text-muted-foreground",
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
        <Button onClick={handleSubmit} className="w-full" size="lg">
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
                      Don't have a Groq API key? Get one for free{" "}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        className="font-medium text-primary underline"
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
              <Card key={entry.id} className="mt-4">
                <CardContent
                  className="p-4 hover:cursor-pointer hover:shadow-md duration-300 ease-in-out"
                  onClick={() => {
                    router.push(`/output/history/${entry.id}`);
                  }}
                >
                  <p className="text-sm text-muted-foreground">
                    <strong>Date:</strong>{" "}
                    {entry.date
                      ? format(new Date(entry.date), "PPP")
                      : "No date"}
                  </p>
                  <p className="mt-2">
                    <strong>Tasks:</strong>{" "}
                    {entry.tasks.map((t) => t.title).join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Position toggle at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
          <ToggleGroup
            type="single"
            value={position}
            onValueChange={handlePositionChange as any}
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
