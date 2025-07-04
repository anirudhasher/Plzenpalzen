import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, handleOpenAIError, validateAudioFile } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio') as File;
    
    if (!audio) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate audio file
    const validation = validateAudioFile(audio);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      response_format: 'verbose_json', // More detailed response with timing
      language: 'en', // Specify language for better accuracy
      timestamp_granularities: ['word'], // Add word-level timestamps
    });

    return NextResponse.json({ 
      transcription,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour (private cache)
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    const { message, status } = handleOpenAIError(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}