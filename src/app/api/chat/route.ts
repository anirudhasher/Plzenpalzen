import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, language, conversationHistory, context } = await request.json();

    const systemPrompt = `You are a helpful multilingual assistant that helps users communicate in ${language}. 
    Respond naturally and appropriately to the conversation context. 
    If the user speaks in English, translate your response to ${language} and provide both versions.
    Keep responses conversational and culturally appropriate.
    
    ${context ? `Previous conversation context:\n${context}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullReply = '';
          
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullReply += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, fullReply })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullReply })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}