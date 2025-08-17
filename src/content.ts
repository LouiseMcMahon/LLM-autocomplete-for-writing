// AI Writing Assistant Content Script
// Designed to work with Google Docs and be compatible with Grammarly

import { 
  ExtensionSettings, 
  AISuggestion, 
  OpenAIRequest, 
  OpenAIResponse,
  TextContext,
  SuggestionBoxPosition,
  MessageFromPopup,
  Element,
  HTMLElement,
  Selection,
  Range,
  KeyboardEvent,
  MouseEvent,
  MutationObserver,
  MutationRecord,
  MutationObserverInit,
  Document,
  Node,
  TreeWalker,
  NodeFilter,
  DOMRect
} from './types';

class AIWritingAssistant {
  private isActive: boolean = false;
  private suggestions: AISuggestion[] = [];
  private currentText: string = '';
  private cursorPosition: number = 0;
  private suggestionBox: HTMLElement | null = null;
  private debounceTimer: number | null = null;
  private openaiApiKey: string | null = null;
  private settings: ExtensionSettings;
  private mutationObserver: MutationObserver | null = null;
  private document: Document;
  private window: Window;

  constructor() {
    this.document = document;
    this.window = window;
    this.settings = {
      openai_api_key: null,
      enable_autocomplete: true,
      show_suggestions: true
    };
    
    this.init();
  }

  private async init(): Promise<void> {
    try {
      // Wait for Google Docs to fully load
      await this.waitForGoogleDocs();
      
      // Get API key and settings from storage
      await this.loadSettings();
      
      // Create suggestion box
      this.createSuggestionBox();
      
      // Start monitoring text changes
      this.startTextMonitoring();
      
      // Listen for settings updates from popup
      this.listenForMessages();
      
      console.log('AI Writing Assistant initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Writing Assistant:', error);
    }
  }

  private async waitForGoogleDocs(): Promise<void> {
    return new Promise((resolve) => {
      const checkForDocs = (): void => {
        // Look for Google Docs specific elements
        const docsEditor = this.document.querySelector('[contenteditable="true"][role="textbox"]') ||
                          this.document.querySelector('.kix-appview-editor');
        
        if (docsEditor) {
          resolve();
        } else {
          setTimeout(checkForDocs, 100);
        }
      };
      checkForDocs();
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get([
        'openai_api_key',
        'enable_autocomplete',
        'show_suggestions'
      ]);
      
      this.settings = {
        openai_api_key: result.openai_api_key || null,
        enable_autocomplete: result.enable_autocomplete !== false,
        show_suggestions: result.show_suggestions !== false
      };
      
      this.openaiApiKey = this.settings.openai_api_key;
      
      // Listen for storage changes
      chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private handleStorageChange(changes: { [key: string]: chrome.storage.StorageChange }): void {
    if (changes.openai_api_key) {
      this.settings.openai_api_key = changes.openai_api_key.newValue;
      this.openaiApiKey = this.settings.openai_api_key;
    }
    
    if (changes.enable_autocomplete !== undefined) {
      this.settings.enable_autocomplete = changes.enable_autocomplete.newValue;
    }
    
    if (changes.show_suggestions !== undefined) {
      this.settings.show_suggestions = changes.show_suggestions.newValue;
      if (!this.settings.show_suggestions) {
        this.hideSuggestions();
      }
    }
  }

  private listenForMessages(): void {
    chrome.runtime.onMessage.addListener((message: MessageFromPopup, sender, sendResponse) => {
      if (message.type === 'SETTINGS_UPDATED') {
        this.handleSettingsUpdate(message.data);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  private handleSettingsUpdate(data: Partial<ExtensionSettings>): void {
    if (data.openai_api_key !== undefined) {
      this.settings.openai_api_key = data.openai_api_key;
      this.openaiApiKey = data.openai_api_key;
    }
    
    if (data.enable_autocomplete !== undefined) {
      this.settings.enable_autocomplete = data.enable_autocomplete;
    }
    
    if (data.show_suggestions !== undefined) {
      this.settings.show_suggestions = data.show_suggestions;
      if (!this.settings.show_suggestions) {
        this.hideSuggestions();
      }
    }
  }

  private createSuggestionBox(): void {
    this.suggestionBox = this.document.createElement('div');
    this.suggestionBox.id = 'ai-writing-suggestions';
    this.suggestionBox.className = 'ai-suggestion-box';
    this.suggestionBox.style.display = 'none';
    
    this.document.body.appendChild(this.suggestionBox);
  }

  private startTextMonitoring(): void {
    if (!this.settings.enable_autocomplete) return;

    // Monitor for text changes in Google Docs
    this.mutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.handleTextChange();
        }
      });
    });

    // Observe the entire document for changes
    const observerConfig: MutationObserverInit = {
      childList: true,
      subtree: true,
      characterData: true
    };
    
    this.mutationObserver.observe(this.document.body, observerConfig);

    // Also listen for keyboard events
    this.document.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleTextChange(): void {
    if (!this.settings.enable_autocomplete || !this.settings.show_suggestions) return;

    // Debounce text change handling to avoid excessive API calls
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = window.setTimeout(() => {
      this.analyzeCurrentText();
    }, 500);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    // Handle specific key combinations
    if (event.key === 'Tab' && this.suggestions.length > 0) {
      event.preventDefault();
      this.acceptSuggestion(this.suggestions[0]);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Handle arrow keys for suggestion navigation
    if (this.suggestions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateSuggestions(event.key === 'ArrowDown' ? 1 : -1);
      }
    }
  }

  private async analyzeCurrentText(): Promise<void> {
    if (!this.openaiApiKey || !this.settings.enable_autocomplete) {
      this.hideSuggestions();
      return;
    }

    const currentText = this.getCurrentText();
    if (currentText.length < 10) {
      this.hideSuggestions();
      return;
    }

    try {
      const suggestions = await this.getAISuggestions(currentText);
      this.showSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      this.hideSuggestions();
    }
  }

  private getCurrentText(): string {
    // Get text from Google Docs editor
    const editor = this.document.querySelector('[contenteditable="true"][role="textbox"]') ||
                  this.document.querySelector('.kix-appview-editor');
    
    if (!editor) return '';
    
    // Get text content while preserving some formatting context
    const textContent = editor.textContent || '';
    const selection = this.window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      this.cursorPosition = this.getCursorPosition(range, editor);
    }
    
    return textContent;
  }

  private getCursorPosition(range: Range, editor: Element): number {
    // Calculate cursor position relative to editor
    let position = 0;
    const walker = this.document.createTreeWalker(
      editor,
      (this.document as any).SHOW_TEXT || 4, // NodeFilter.SHOW_TEXT
      null,
      false
    );

    let node: Node | null;
    while (node = walker.nextNode()) {
      if (node === range.startContainer) {
        position += range.startOffset;
        break;
      }
      position += (node.textContent || '').length;
    }
    
    return position;
  }

  private async getAISuggestions(text: string): Promise<AISuggestion[]> {
    if (!this.openaiApiKey) {
      throw new Error('No OpenAI API key configured');
    }

    const request: OpenAIRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Provide 3-5 short, contextual suggestions to continue the given text. Keep suggestions concise (1-2 sentences max) and natural. Focus on continuing the thought or idea. Return each suggestion on a new line.'
        },
        {
          role: 'user',
          content: `Continue this text naturally: "${text}"`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse suggestions (assuming they're separated by newlines)
    const suggestionTexts = content.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
    
    return suggestionTexts.map(text => ({
      text: text.trim(),
      type: 'continuation' as const
    }));
  }

  private showSuggestions(suggestions: AISuggestion[]): void {
    this.suggestions = suggestions;
    
    if (suggestions.length === 0 || !this.suggestionBox) {
      this.hideSuggestions();
      return;
    }

    // Position suggestion box near cursor
    this.positionSuggestionBox();
    
    // Populate suggestions
    this.suggestionBox.innerHTML = suggestions.map((suggestion, index) => `
      <div class="suggestion-item" data-index="${index}">
        <span class="suggestion-text">${this.escapeHtml(suggestion.text)}</span>
        <span class="suggestion-hint">Tab to accept</span>
      </div>
    `).join('');

    // Add click handlers
    this.suggestionBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
      item.addEventListener('click', () => this.acceptSuggestion(suggestions[index]));
    });

    this.suggestionBox.style.display = 'block';
  }

  private escapeHtml(text: string): string {
    const div = this.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private positionSuggestionBox(): void {
    if (!this.suggestionBox) return;

    const selection = this.window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position below the cursor
    this.suggestionBox.style.position = 'fixed';
    this.suggestionBox.style.left = `${rect.left}px`;
    this.suggestionBox.style.top = `${rect.bottom + 5}px`;
    this.suggestionBox.style.zIndex = '2147483647'; // Very high z-index to stay above Grammarly
  }

  private acceptSuggestion(suggestion: AISuggestion): void {
    // Insert suggestion at cursor position
    const selection = this.window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(this.document.createTextNode(suggestion.text));
    
    // Move cursor to end of inserted text
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    this.hideSuggestions();
  }

  private navigateSuggestions(direction: number): void {
    if (!this.suggestionBox) return;

    const items = this.suggestionBox.querySelectorAll('.suggestion-item');
    const currentActive = this.suggestionBox.querySelector('.suggestion-item.active');
    
    let nextIndex = 0;
    if (currentActive) {
      const currentIndex = parseInt(currentActive.getAttribute('data-index') || '0');
      nextIndex = (currentIndex + direction + items.length) % items.length;
      currentActive.classList.remove('active');
    }
    
    const nextItem = items[nextIndex] as HTMLElement;
    if (nextItem) {
      nextItem.classList.add('active');
    }
  }

  private hideSuggestions(): void {
    if (this.suggestionBox) {
      this.suggestionBox.style.display = 'none';
    }
    this.suggestions = [];
  }

  public destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    if (this.suggestionBox && this.suggestionBox.parentNode) {
      this.suggestionBox.parentNode.removeChild(this.suggestionBox);
    }
    
    this.document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// Initialize the assistant when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIWritingAssistant();
  });
} else {
  new AIWritingAssistant();
}