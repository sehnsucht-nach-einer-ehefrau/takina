import Groq from "groq-sdk";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqResponse = string | null;

export async function callGroqAPI(
  apiKey: string,
  messages: Message[],
): Promise<GroqResponse> {
  console.log("HI");

  if (!apiKey) {
    console.error("Groq API key is missing!");
    throw new Error("API key is required");
  }

  try {
    console.log("Before creating Groq client");
    const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    console.log("Groq client created successfully");

    const chatCompletion = await client.chat.completions.create({
      model: "llama3-8b-8192",
      messages: messages,
      temperature: 0.5,
    });

    console.log("Groq API call successful");
    return chatCompletion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Groq API call failed:", error);
    throw error;
  }
}
