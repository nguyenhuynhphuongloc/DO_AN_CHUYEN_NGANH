export async function sendAssistantMessage(input: string) {
  return Promise.resolve({
    reply: `AI Vanilla placeholder response for: ${input}`
  });
}
