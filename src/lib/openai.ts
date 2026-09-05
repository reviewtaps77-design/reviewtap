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

  const systemPrompt = `You generate natural Google reviews from customer feedback.
Rules:

* Sound like a real customer.
* Never invent facts or details.
* Use only information provided by the customer.
* Match the customer's sentiment and ratings.
* Don't use excessive marketing language.
* Don't mention AI.
* Don't use quotation marks.
* Return only the review.
* Vary the review length naturally. Do not make every review the same length.
* If the customer provides very little feedback, generate a short, natural review (for example, 1–2 sentences).
* If the customer provides moderate feedback, generate a medium-length review (for example, 2–3 sentences).
* If the customer provides detailed feedback, generate a longer review (for example, 3–4 sentences or around 30–80 words).
* Randomize the length and sentence structure slightly so that consecutive reviews do not feel repetitive or templated.
* Never add unnecessary sentences just to make the review longer.
* The amount of customer feedback should be the main factor determining the review length, with natural variation added on top.
* Keep the review realistic and conversational, as if it was genuinely written by the customer.

Return only the review.`;

  const userPrompt = `Business: "${context.businessName}".
${employeeContext}

Customer responses:
- What they liked: ${context.answers.liked || 'Not specified'}
- What they ordered/used: ${context.answers.ordered || 'Not specified'}
- Service experience: ${context.answers.service || 'Not specified'}
- Employee interaction: ${context.answers.employeeInteraction || 'Not specified'}
- Would recommend: ${context.answers.recommend || 'Not specified'}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return {
    review: completion.choices[0]?.message?.content || '',
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}
