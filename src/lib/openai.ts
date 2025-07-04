import { OpenAI } from 'openai';
import { get_encoding } from 'tiktoken';

// Centralized OpenAI client configuration
let openaiClient: OpenAI | null = null;

// Token counting utility
const encoding = get_encoding('cl100k_base'); // Used by gpt-4, gpt-3.5-turbo, and text-embedding-ada-002

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
      maxRetries: 2, // Retry failed requests up to 2 times
      dangerouslyAllowBrowser: false, // Ensure this only runs server-side
    });
  }
  
  return openaiClient;
}

// Helper to handle common OpenAI errors
export function handleOpenAIError(error: unknown): { message: string; status: number } {
  console.error('OpenAI error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return { message: 'OpenAI API key is not configured', status: 500 };
    }
    if (error.message.includes('rate limit')) {
      return { message: 'Rate limit exceeded. Please try again later.', status: 429 };
    }
    if (error.message.includes('timeout')) {
      return { message: 'Request timeout. Please try again.', status: 408 };
    }
    if (error.message.includes('context_length_exceeded')) {
      return { message: 'Conversation too long. Please start a new conversation.', status: 400 };
    }
    if (error.message.includes('insufficient_quota')) {
      return { message: 'OpenAI quota exceeded. Please check your billing.', status: 503 };
    }
  }
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  return { message: errorMessage, status: 500 };
}

// Validate audio file
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 25MB as per OpenAI limits)
  if (file.size > 25 * 1024 * 1024) {
    return { valid: false, error: 'Audio file too large. Maximum size is 25MB.' };
  }

  // Check file type
  const allowedTypes = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported audio format. Please use WAV, WebM, MP3, MP4, or M4A.' };
  }

  return { valid: true };
}

// Validate text for TTS
export function validateTTSText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'No text provided' };
  }
  
  if (text.length > 4096) {
    return { valid: false, error: 'Text too long. Maximum length is 4096 characters.' };
  }
  
  return { valid: true };
}

// Validate TTS voice
export function validateTTSVoice(voice: string): { valid: boolean; error?: string } {
  const allowedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  if (!allowedVoices.includes(voice)) {
    return { valid: false, error: 'Invalid voice. Allowed voices: ' + allowedVoices.join(', ') };
  }
  
  return { valid: true };
}

// Token counting functions
export function countTokens(text: string): number {
  return encoding.encode(text).length;
}

export function countMessageTokens(messages: Array<{ role: string; content: string }>): number {
  let totalTokens = 0;
  
  for (const message of messages) {
    // Each message has overhead tokens
    totalTokens += 4; // role and content tokens
    totalTokens += countTokens(message.content);
    totalTokens += countTokens(message.role);
  }
  
  totalTokens += 2; // Assistant's reply priming
  return totalTokens;
}

export function optimizeMaxTokens(messages: Array<{ role: string; content: string }>, maxContextTokens: number = 4096): number {
  const inputTokens = countMessageTokens(messages);
  const availableTokens = maxContextTokens - inputTokens;
  
  // Reserve some tokens for safety margin
  const safetyMargin = 50;
  const maxTokens = Math.max(150, Math.min(availableTokens - safetyMargin, 1000));
  
  return maxTokens;
}

// Simple request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // Minimum 100ms between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }
      
      const requestFn = this.queue.shift();
      if (requestFn) {
        this.lastRequestTime = Date.now();
        await requestFn();
      }
    }
    
    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();