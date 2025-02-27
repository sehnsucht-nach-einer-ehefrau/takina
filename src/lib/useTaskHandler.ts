"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { callGroqAPI } from "@/lib/groq";
import { saveTaskResponse, getTaskHistory } from "@/lib/db";

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

interface TaskSubmissionState {
  tasks: Task[];
  dateDifference?: number;
  date?: Date;
  apiOutput: string;
  error?: string;
  history: TaskHistory[];
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function useTaskHandler() {
  const [state, setState] = React.useState<TaskSubmissionState>({
    tasks: [],
    apiOutput: "",
    history: [],
  });
  const router = useRouter();

  // Function to refresh history
  const refreshHistory = React.useCallback(async () => {
    try {
      const history = await getTaskHistory();
      setState((prev) => ({ ...prev, history }));
    } catch (error) {
      console.error("Error fetching task history:", error);
    }
  }, []);

  // Fetch history on mount
  React.useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const handleSubmission = async (
    tasks: Task[],
    dateDifference?: number,
    date?: Date,
  ) => {
    try {
      router.push("/loading");
      const apiKey = localStorage.getItem("groqApiKey");

      if (!apiKey) throw new Error("API key not found.");
      if (!tasks.length) throw new Error("Please enter at least one task.");
      if (!dateDifference || dateDifference <= 0)
        throw new Error("Invalid date difference.");
      if (!date) throw new Error("Invalid date.");

      const prompt: Message[] = [
        {
          role: "system",
          content: `Return a daily breakdown of the following task evenly over ${dateDifference} days. ALWAYS UTILIZE ALL THE AVAILABLE DAYS, BUT DON'T GO OVER THAT NUMBER. ALWAYS USE ALL GIVEN TASKS. Each day's tasks should be specific and actionable, breaking the task into meaningful progress steps. Do not introduce yourself, do not include anything except the scheduled tasks. Format: Day 1\n- task\n- task\n[More tasks if needed]\n\nDay 2\n- task\n- task\n\n...\nEach group separated by double new lines represents one day. Ensure that the steps logically progress toward completing the full task by the final day.`,
        },
        {
          role: "user",
          content: tasks
            .map((t) => `${t.title} Steps: ${t.steps.join(", ")}`)
            .join("\n"),
        },
      ];

      const response = await callGroqAPI(apiKey, prompt);
      const output = response || "No response from API";

      const taskData: TaskHistory = {
        id: Date.now(), // Using timestamp as a unique ID
        tasks,
        date: date.toISOString(),
        dateDifference,
        apiOutput: output,
      };

      await saveTaskResponse(taskData);
      console.log("Task saved successfully");

      // Refresh history after saving
      await refreshHistory();

      setState((prev) => ({
        ...prev,
        tasks,
        date,
        dateDifference,
        apiOutput: output,
      }));

      router.push("/output");
      return output;
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, error }));
      throw error;
    }
  };

  return {
    ...state,
    handleSubmission,
    refreshHistory, // Export the refresh function
    clearState: () =>
      setState({ tasks: [], apiOutput: "", error: undefined, history: [] }),
  };
}
