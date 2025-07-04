import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, handleOpenAIError, optimizeMaxTokens } from '@/lib/openai';

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

    const openai = getOpenAIClient();
    const maxTokens = optimizeMaxTokens(messages, 16384); // gpt-4o-mini has 16K context
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // More efficient than gpt-3.5-turbo
      messages: messages,
      max_tokens: maxTokens, // Dynamically calculated based on context
      temperature: 0.7,
      stream: true,
      presence_penalty: 0.1, // Encourage diverse responses
      frequency_penalty: 0.1, // Reduce repetition
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullReply = '';
          let hasStarted = false;
          
          for await (const chunk of response) {
            if (!hasStarted) {
              hasStarted = true;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ started: true })}\n\n`));
            }
            
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullReply += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, fullReply })}\n\n`));
            }
            
            // Check for finish reason
            const finishReason = chunk.choices[0]?.finish_reason;
            if (finishReason === 'length') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                warning: 'Response was truncated due to length limit' 
              })}\n\n`));
            } else if (finishReason === 'content_filter') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                error: 'Content filtered by safety system' 
              })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullReply })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const { message } = handleOpenAIError(error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.close();
        }
      },
      cancel() {
        console.log('Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    const { message, status } = handleOpenAIError(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}