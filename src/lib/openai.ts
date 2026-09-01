import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReviewContext {
  businessName: string;
  employeeName?: string;
  behaviour?: number;
  fastness?: number;
  overall?: number;
  answers: {
    liked?: string;
    ordered?: string;
    service?: string;
    employeeInteraction?: string;
    recommend?: string;
  };
}

export async function generateReview(context: ReviewContext): Promise<{ review: string; tokensUsed: number }> {
  const employeeContext = context.employeeName
    ? `The customer interacted with employee "${context.employeeName}" and rated them: Behaviour ${context.behaviour}/5, Fastness ${context.fastness}/5, Overall ${context.overall}/5.`
    : '';

  const prompt = `You are helping a customer write a genuine Google review for "${context.businessName}". 
Based on the following customer responses, generate a natural, authentic-sounding review (2-4 sentences). 
Do NOT invent details. Only use information the customer provided. Do NOT auto-publish.
${employeeContext}

Customer responses:
- What they liked: ${context.answers.liked || 'Not specified'}
- What they ordered/used: ${context.answers.ordered || 'Not specified'}
- Service experience: ${context.answers.service || 'Not specified'}
- Employee interaction: ${context.answers.employeeInteraction || 'Not specified'}
- Would recommend: ${context.answers.recommend || 'Not specified'}

Write a review that sounds natural and personal:`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  });

  return {
    review: completion.choices[0]?.message?.content || '',
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}
