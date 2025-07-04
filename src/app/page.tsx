"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import memoryManager from "@/lib/memory";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant';
    text: string;
    translation?: string;
  }>>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('thai');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscription, setLiveTranscription] = useState<string>('');
  const audioChunksRef = useRef<Blob[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Yes, please",
    "No, thank you", 
    "I don't understand",
    "How much?",
    "Help me"
  ]);

  // Update quick replies based on context and memory
  useEffect(() => {
    const contextualReplies = memoryManager.getContextualReplies(
      conversation.map(msg => msg.text),
      selectedLanguage
    );
    setQuickReplies(contextualReplies);
  }, [conversation, selectedLanguage]);

  const languages = [
    { code: 'thai', name: 'Thai', flag: '🇹🇭' },
    { code: 'hindi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'czech', name: 'Czech', flag: '🇨🇿' },
    { code: 'spanish', name: 'Spanish', flag: '🇪🇸' },
    { code: 'japanese', name: 'Japanese', flag: '🇯🇵' }
  ];

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });
      mediaRecorderRef.current = mediaRecorder;
      
      audioChunksRef.current = [];
      setLiveTranscription('');
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          // Process audio chunks in real-time
          processAudioChunk(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          await processAudio(blob);
        } finally {
          stream.getTracks().forEach(track => track.stop());
          // Audio stream stopped
        }
      };
      
      // Start recording with small chunks for real-time processing
      mediaRecorder.start(250); // 250ms chunks
      setIsListening(true);
      // Audio recording started
    } catch {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudioChunk = async (audioChunk: Blob) => {
    // Only process if we have enough audio data
    if (audioChunk.size < 1000) return;
    
    try {
      const formData = new FormData();
      formData.append('file', audioChunk, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text && data.text.trim()) {
          setLiveTranscription(prev => {
            const newTranscription = prev + ' ' + data.text;
            return newTranscription.trim();
          });
        }
      }
    } catch {
      // Silently handle errors for real-time processing
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Direct OpenAI API call for transcription
      const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: (() => {
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-1');
          return formData;
        })()
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const transcribeData = await transcribeResponse.json();
      if (transcribeData.error) {
        throw new Error(transcribeData.error);
      }
      
      const transcription = transcribeData.text;
      
      // Use live transcription if available, otherwise use final transcription
      const finalText = liveTranscription.trim() || transcription;
      
      // Add user message to conversation
      setConversation(prev => [...prev, { type: 'user', text: finalText }]);
      
      // Clear live transcription
      setLiveTranscription('');
      
      // 2. Get AI response from OpenAI directly
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a helpful language assistant. Respond in ${selectedLanguage} and keep responses conversational and natural.`
            },
            ...conversation.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: finalText }
          ],
          stream: true
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error('Failed to get AI response');
      }
      
      // Handle streaming response
      if (!chatResponse.body) {
        throw new Error('No response body received');
      }
      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let currentMessageIndex = -1;
      
      // Add placeholder for assistant message
      setConversation(prev => {
        const newConv = [...prev, { type: 'assistant' as const, text: '' }];
        currentMessageIndex = newConv.length - 1;
        return newConv;
      });
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices && data.choices[0].delta.content) {
                    fullReply += data.choices[0].delta.content;
                    // Update the streaming message
                    setConversation(prev => {
                      const newConv = [...prev];
                      if (currentMessageIndex >= 0 && currentMessageIndex < newConv.length) {
                        newConv[currentMessageIndex].text = fullReply;
                      }
                      return newConv;
                    });
                  }
                  if (data.choices && data.choices[0].finish_reason) {
                    break;
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      // 3. Synthesize speech with OpenAI TTS
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: fullReply
        }),
      });
      
      if (!ttsResponse.ok) {
        throw new Error('Failed to synthesize speech');
      }
      
      const audioBuffer = await ttsResponse.arrayBuffer();
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/mpeg' }));
      audio.src = audioUrl;
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      audio.play();

      // Save conversation to memory
      memoryManager.saveConversation({
        language: selectedLanguage,
        messages: conversation.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        context: {
          tone: 'friendly'
        }
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendQuickReply = async (reply: string) => {
    setConversation(prev => [...prev, { type: 'user', text: reply }]);
    
    // Process quick reply through chat API with streaming
    setIsProcessing(true);
    setError(null);
    try {
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a helpful language assistant. Respond in ${selectedLanguage} and keep responses conversational and natural.`
            },
            ...conversation.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: reply }
          ],
          stream: true
        }),
      });
      
      if (!chatResponse.ok) {
        throw new Error('Failed to get AI response');
      }
      
      // Handle streaming response
      if (!chatResponse.body) {
        throw new Error('No response body received');
      }
      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let currentMessageIndex = -1;
      
      // Add placeholder for assistant message
      setConversation(prev => {
        const newConv = [...prev, { type: 'assistant' as const, text: '' }];
        currentMessageIndex = newConv.length - 1;
        return newConv;
      });
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices && data.choices[0].delta.content) {
                    fullReply += data.choices[0].delta.content;
                    // Update the streaming message
                    setConversation(prev => {
                      const newConv = [...prev];
                      if (currentMessageIndex >= 0 && currentMessageIndex < newConv.length) {
                        newConv[currentMessageIndex].text = fullReply;
                      }
                      return newConv;
                    });
                  }
                  if (data.choices && data.choices[0].finish_reason) {
                    break;
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      // Synthesize speech with OpenAI TTS
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: fullReply
        }),
      });
      
      if (!ttsResponse.ok) {
        throw new Error('Failed to synthesize speech');
      }
      
      const audioBuffer = await ttsResponse.arrayBuffer();
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/mpeg' }));
      audio.src = audioUrl;
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      audio.play();

      // Add to frequent phrases and save to memory
      memoryManager.addFrequentPhrase(reply);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 p-4">
      <div className="max-w-md mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-center">CloneLingua</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-primary-600 dark:text-primary-400">
              Frontend-only OpenAI integration
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-center">Voice Translation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-800 dark:text-primary-200">Target Language:</span>
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border border-primary-300 rounded px-3 py-2 text-sm bg-primary-50 dark:bg-primary-900 dark:border-primary-600 text-primary-900 dark:text-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                size="lg"
                className={`w-20 h-20 rounded-full ${
                  isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </Button>
            </div>
            
            <div className="text-center text-sm text-primary-800 dark:text-primary-200">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
            </div>
            
            {liveTranscription && (
              <div className="text-center text-sm text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="font-medium mb-1">Live Transcription</div>
                <div className="italic">{liveTranscription}</div>
              </div>
            )}
            
            {error && (
              <div className="text-center text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="font-medium mb-1">Error</div>
                <div>{error}</div>
                {error.includes('API key') && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                    Please configure your OpenAI API key in the environment variables (.env.local)
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-primary-800 dark:text-primary-200">Quick Replies:</div>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => sendQuickReply(reply)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {conversation.length === 0 ? (
                <div className="text-center text-primary-700 dark:text-primary-300 text-sm">
                  Start speaking to begin conversation
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg text-sm ${
                    msg.type === 'user' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-8 border-l-4 border-blue-500 text-primary-900 dark:text-primary-100' 
                      : 'bg-neutral-50 dark:bg-neutral-800 mr-8 border-l-4 border-neutral-400 text-primary-900 dark:text-primary-100'
                  }`}>
                    <div className="font-medium">
                      {msg.type === 'user' ? 'You' : 'Them'}:
                    </div>
                    <div>{msg.text}</div>
                    {msg.translation && (
                      <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                        Translation: {msg.translation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}