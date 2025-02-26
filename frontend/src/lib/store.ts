import { writeTextFile, readTextFile, exists } from "@tauri-apps/api/fs";

const FILE_NAME = "llm_responses.json";
const MAX_HISTORY = 10;

export interface LLMResponse {
  date: string;
  tasks: string[];
  response: string;
}

export async function saveResponse(newResponse: LLMResponse) {
  let history: LLMResponse[] = [];

  if (await exists(FILE_NAME)) {
    const data = await readTextFile(FILE_NAME);
    history = JSON.parse(data);
  }

  history.unshift(newResponse); // Add new response at the top
  if (history.length > MAX_HISTORY) history.pop(); // Keep at most 10

  await writeTextFile(FILE_NAME, JSON.stringify(history, null, 2));
}

export async function loadHistory(): Promise<LLMResponse[]> {
  if (!(await exists(FILE_NAME))) return [];
  const data = await readTextFile(FILE_NAME);
  return JSON.parse(data);
}
