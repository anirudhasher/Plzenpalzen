interface ConversationMemory {
  id: string;
  timestamp: Date;
  language: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context: {
    location?: string;
    scenario?: string;
    relationship?: string;
    tone?: string;
  };
}

interface UserPreferences {
  preferredLanguages: string[];
  communicationStyle: 'formal' | 'casual' | 'friendly';
  culturalContext: string;
  frequentPhrases: string[];
}

class MemoryManager {
  private conversations: ConversationMemory[] = [];
  private userPreferences: UserPreferences = {
    preferredLanguages: [],
    communicationStyle: 'friendly',
    culturalContext: '',
    frequentPhrases: []
  };

  constructor() {
    this.loadFromStorage();
  }

  // Save conversation to memory
  saveConversation(conversation: Omit<ConversationMemory, 'id' | 'timestamp'>) {
    const memory: ConversationMemory = {
      id: this.generateId(),
      timestamp: new Date(),
      ...conversation
    };
    
    this.conversations.push(memory);
    this.saveToStorage();
    return memory.id;
  }

  // Get recent conversations for context
  getRecentConversations(limit: number = 5): ConversationMemory[] {
    return this.conversations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get conversation context based on language and scenario
  getRelevantContext(language: string, scenario?: string): string {
    const relevantConversations = this.conversations
      .filter(conv => conv.language === language)
      .filter(conv => !scenario || conv.context.scenario === scenario)
      .slice(-3); // Last 3 relevant conversations

    if (relevantConversations.length === 0) return '';

    const context = relevantConversations
      .map(conv => {
        const lastExchange = conv.messages.slice(-2);
        return lastExchange.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      })
      .join('\n\n');

    return `Previous conversation context:\n${context}`;
  }

  // Update user preferences based on interaction patterns
  updatePreferences(language: string, style: 'formal' | 'casual' | 'friendly') {
    if (!this.userPreferences.preferredLanguages.includes(language)) {
      this.userPreferences.preferredLanguages.push(language);
    }
    
    this.userPreferences.communicationStyle = style;
    this.saveToStorage();
  }

  // Add frequently used phrases
  addFrequentPhrase(phrase: string) {
    if (!this.userPreferences.frequentPhrases.includes(phrase)) {
      this.userPreferences.frequentPhrases.push(phrase);
      // Keep only top 10 frequent phrases
      if (this.userPreferences.frequentPhrases.length > 10) {
        this.userPreferences.frequentPhrases.shift();
      }
      this.saveToStorage();
    }
  }

  // Get contextual quick replies based on conversation history
  getContextualReplies(currentConversation: string[], language: string): string[] {
    const baseReplies = [
      "Yes, please",
      "No, thank you",
      "I don't understand",
      "How much?",
      "Help me"
    ];

    // Add frequent phrases for this language
    const languageConversations = this.conversations
      .filter(conv => conv.language === language);
    
    if (languageConversations.length > 0) {
      const frequentInLanguage = this.userPreferences.frequentPhrases
        .filter(phrase => phrase.length < 50); // Keep short phrases only
      
      return [...baseReplies, ...frequentInLanguage.slice(0, 3)];
    }

    return baseReplies;
  }

  // Clear old conversations (keep last 50)
  cleanup() {
    if (this.conversations.length > 50) {
      this.conversations = this.conversations
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50);
      this.saveToStorage();
    }
  }

  // Storage methods
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clonelingua-memory', JSON.stringify({
        conversations: this.conversations,
        preferences: this.userPreferences
      }));
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clonelingua-memory');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.conversations = data.conversations || [];
          this.userPreferences = { ...this.userPreferences, ...data.preferences };
          
          // Convert timestamp strings back to Date objects
          this.conversations.forEach(conv => {
            conv.timestamp = new Date(conv.timestamp);
          });
        } catch {
          this.conversations = [];
          this.userPreferences = {
            preferredLanguages: [],
            communicationStyle: 'friendly',
            culturalContext: '',
            frequentPhrases: []
          };
        }
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  // Get user preferences
  getPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  // Clear all memory
  clearMemory() {
    this.conversations = [];
    this.userPreferences = {
      preferredLanguages: [],
      communicationStyle: 'friendly',
      culturalContext: '',
      frequentPhrases: []
    };
    this.saveToStorage();
  }
}

export { MemoryManager, type ConversationMemory, type UserPreferences };

const memoryManagerInstance = new MemoryManager();
export default memoryManagerInstance;