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

interface TaskSubmissionState {
  tasks: Task[];
  dateDifference?: number;
  date: Date;
  apiOutput: string;
  error?: string;
  history: any[];
}

export function useTaskHandler() {
  const [state, setState] = React.useState<TaskSubmissionState>({
    tasks: [],
    apiOutput: "",
    history: [],
  });
  const router = useRouter();

  React.useEffect(() => {
    async function fetchHistory() {
      const history = await getTaskHistory();
      setState((prev) => ({ ...prev, history }));
    }
    fetchHistory();
  }, []);

  const handleSubmission = async (
    tasks: Task[],
    dateDifference?: number,
    date: Date,
  ) => {
    try {
      router.push("/loading");
      const apiKey = localStorage.getItem("groqApiKey");
      console.log(dateDifference);
      if (!apiKey) throw new Error("API key not found.");
      if (!tasks.length) throw new Error("Please enter at least one task.");
      if (dateDifference === undefined || dateDifference <= 0)
        throw new Error("Invalid date difference.");

      const prompt = `Return a daily breakdown of the following task evenly over ${dateDifference} days. ALWAYS UTILIZE ALL THE AVAILABLE DAYS, BUT DON'T GO OVER THAT NUMBER. Each day's tasks should be specific and actionable, breaking the task into meaningful progress steps. Do not introduce yourself, do not include anything except the scheduled tasks. Format: [Day 1](with square brackets)\n- task\n- task\n[More tasks if needed]\n\n[Day 2]\n- task\n- task\n\n...\nEach group separated by double new lines represents one day. Ensure that the steps logically progress toward completing the full task by the final day.\nUser input: 
      ${tasks.map((t) => t.title + " Steps: " + t.steps.join(", ")).join("\n")}`;

      const response = await callGroqAPI(apiKey, [
        { role: "user", content: prompt },
      ]);

      console.log(prompt);

      const output =
        response.choices[0]?.message?.content.split("</think>")[1] ||
        "No response";

      console.log(output);

      const taskData = {
        tasks,
        date,
        dateDifference,
        apiOutput: output,
      };

      // Save the task response with a predictable ID
      await saveTaskResponse(taskData);
      console.log("Task saved successfully");

      // Update the state with the new history
      const history = await getTaskHistory();
      setState((prev) => ({
        ...prev,
        tasks,
        date,
        dateDifference,
        apiOutput: output,
        history,
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
    clearState: () =>
      setState({ tasks: [], apiOutput: "", error: undefined, history: [] }),
  };
}
