import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage, AIMessage } from 'langchain/schema';
import { PromptTemplate } from 'langchain/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// Initialize OpenAI
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0.7,
});

// Define the schema for extracted preferences
const PreferenceSchema = z.object({
  categories: z.array(z.string()).optional().describe('Event categories user is interested in (Music, Arts, Sports, etc.)'),
  priceRange: z.string().optional().describe('Price range preference (free, 0-50, 50-100, 100+)'),
  preferredDays: z.array(z.string()).optional().describe('Preferred days of the week'),
  interests: z.string().optional().describe('General interests and hobbies'),
  budget: z.string().optional().describe('Budget level (low, medium, high)'),
});

export type UserPreferences = z.infer<typeof PreferenceSchema>;

const parser = StructuredOutputParser.fromZodSchema(PreferenceSchema);

/**
 * Extract user preferences from conversation using LLM
 */
export async function extractPreferences(
  conversationHistory: string
): Promise<UserPreferences> {
  const formatInstructions = parser.getFormatInstructions();

  const prompt = new PromptTemplate({
    template: `You are an AI assistant analyzing a conversation to extract user event preferences.
    
Conversation:
{conversation}

Based on this conversation, extract the user's event preferences.
Look for:
- Event categories they like (Music, Arts & Culture, Sports, Food & Drink, etc.)
- Price range or budget mentions
- Preferred days of the week for events
- General interests and hobbies
- Budget level (low/medium/high)

{format_instructions}

If information is not mentioned, omit that field.`,
    inputVariables: ['conversation'],
    partialVariables: { format_instructions: formatInstructions },
  });

  const input = await prompt.format({ conversation: conversationHistory });
  const response = await model.call([new HumanMessage(input)]);

  try {
    return await parser.parse(response.content as string);
  } catch (error) {
    console.error('Error parsing preferences:', error);
    return {};
  }
}

/**
 * Generate conversational response to user
 */
export async function generateResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const systemPrompt = `You are a friendly AI assistant helping users discover events in Sydney, Australia.

Your role:
1. Have natural conversations to understand user preferences
2. Ask about their interests (music, arts, sports, food, etc.)
3. Learn their budget and preferred event days
4. Be enthusiastic but not pushy
5. Keep responses concise (2-3 sentences max)

Current context: You're helping users find events they'll love and will notify them when matching events happen.

Be conversational, friendly, and helpful!`;

  const messages: any[] = [new SystemMessage(systemPrompt)];

  // Add conversation history
  conversationHistory.forEach((msg) => {
    if (msg.role === 'user') {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  });

  // Add current user message
  messages.push(new HumanMessage(userMessage));

  const response = await model.call(messages);
  return response.content as string;
}

/**
 * Generate event recommendations based on user preferences
 */
export async function generateEventRecommendation(
  events: any[],
  userPreferences: UserPreferences
): Promise<string> {
  if (events.length === 0) {
    return "I couldn't find any events matching your preferences right now. I'll notify you when new events are added!";
  }

  const eventsText = events
    .slice(0, 5)
    .map(
      (e, i) =>
        `${i + 1}. **${e.title}**
   📅 ${new Date(e.startDate).toLocaleDateString()}
   📍 ${e.venue || 'TBA'}
   💰 ${e.price || 'Free'}
   🏷️ ${e.category || 'General'}`
    )
    .join('\n\n');

  const prompt = `You are recommending events to a user based on their preferences.

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Matching Events:
${eventsText}

Write a friendly, enthusiastic message recommending these events. Be specific about why each event matches their interests. Keep it conversational and concise.`;

  const response = await model.call([new HumanMessage(prompt)]);
  return response.content as string;
}

/**
 * Determine if user is providing preferences or just chatting
 */
export async function analyzeIntent(userMessage: string): Promise<'preferences' | 'question' | 'greeting'> {
  const prompt = `Analyze this user message and determine the intent:

User message: "${userMessage}"

Is this:
- "preferences": User sharing event preferences (likes music, free events, weekends, etc.)
- "question": User asking about events, how the bot works, etc.
- "greeting": User saying hi, starting conversation

Respond with only one word: preferences, question, or greeting`;

  const response = await model.call([new HumanMessage(prompt)]);
  const intent = (response.content as string).toLowerCase().trim();

  if (intent.includes('preference')) return 'preferences';
  if (intent.includes('question')) return 'question';
  return 'greeting';
}
