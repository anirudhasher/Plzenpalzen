import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, handleOpenAIError, validateTTSText, validateTTSVoice } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    // Validate text using centralized validation
    const textValidation = validateTTSText(text);
    if (!textValidation.valid) {
      return NextResponse.json(
        { error: textValidation.error },
        { status: 400 }
      );
    }

    // Validate voice using centralized validation
    const voiceValidation = validateTTSVoice(voice);
    if (!voiceValidation.valid) {
      return NextResponse.json(
        { error: voiceValidation.error },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: text,
      response_format: 'mp3',
      speed: 1.0, // Normal speed
    });

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=7200', // Cache for 2 hours (longer for static content)
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