"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, X } from "lucide-react";

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

interface Task {
  id: number;
  title: string;
  steps: string[];
}

export default function TaskPlanner() {
  const [date, setDate] = React.useState<Date>();
  const [tasks, setTasks] = React.useState<Task[]>([
    { id: 1, title: "", steps: [""] },
  ]);

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

  const handleSubmit = () => {
    // Handle form submission here
    console.log({ tasks, dueDate: date });
  };

  return (
    <div className="min-h-screen pt-4 -mb-20 flex items-start justify-center">
      <div className="w-4/5 md:w-1/2 lg:w-2/5 space-y-6 border border-border rounded-lg p-6 duration-300 ease-in-out">
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
            <Label className="text-right min-w-[70px]">Due Date</Label>
            <Popover>
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
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
