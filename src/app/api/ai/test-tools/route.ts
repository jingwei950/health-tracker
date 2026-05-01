import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const model = getGeminiModel();
    const tools = [{
      functionDeclarations: [{
        name:        'get_nutrition_data',
        description: 'Retrieve nutritional information for a food item',
        parameters: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Name of the food item' },
          },
          required: ['food_name'],
        },
      }],
    }];

    const result   = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Get nutrition data for Chicken Rice' }] }],
      tools:    tools as any,
    });
    const content  = result.response.candidates?.[0]?.content;
    const toolCall = content?.parts?.find((p: any) => p.functionCall);

    return NextResponse.json({
      ok:           !!toolCall,
      functionName: toolCall?.functionCall?.name ?? null,
      functionArgs: toolCall?.functionCall?.args ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
