export async function callGroqAPI(apiKey: string, messages: any[]) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-r1-distill-llama-70b",
          messages: messages,
          temperature: 0.5,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Groq API call failed:", error);
    throw error;
  }
}
