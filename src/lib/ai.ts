import ZAI from 'z-ai-web-dev-sdk';

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function callAI(
  messages: { role: string; content: string }[],
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const zai = await getZAI();
  const allMessages: { role: string; content: string }[] = [];
  if (options?.systemPrompt) {
    allMessages.push({ role: 'system', content: options.systemPrompt });
  }
  allMessages.push(...messages);
  const completion = await zai.chat.completions.create({
    messages: allMessages,
    model: 'glm-4.7',
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.7,
  });
  return completion.choices[0]?.message?.content || '';
}
