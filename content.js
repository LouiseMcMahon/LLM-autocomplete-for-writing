// AI Writing Assistant Content Script
// Designed to work with Google Docs and be compatible with Grammarly

class AIWritingAssistant {
  constructor() {
    this.isActive = false;
    this.suggestions = [];
    this.currentText = '';
    this.cursorPosition = 0;
    this.suggestionBox = null;
    this.debounceTimer = null;
    this.openaiApiKey = null;
    
    this.init();
  }

  async init() {
    // Wait for Google Docs to fully load
    await this.waitForGoogleDocs();
    
    // Get API key from storage
    this.openaiApiKey = await this.getApiKey();
    
    // Create suggestion box
    this.createSuggestionBox();
    
    // Start monitoring text changes
    this.startTextMonitoring();
    
    // Listen for API key updates
    chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
  }

  async waitForGoogleDocs() {
    return new Promise((resolve) => {
      const checkForDocs = () => {
        // Look for Google Docs specific elements
        const docsEditor = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                          document.querySelector('.kix-appview-editor');
        
        if (docsEditor) {
          resolve();
        } else {
          setTimeout(checkForDocs, 100);
        }
      };
      checkForDocs();
    });
  }

  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['openai_api_key'], (result) => {
        resolve(result.openai_api_key || null);
      });
    });
  }

  handleStorageChange(changes) {
    if (changes.openai_api_key) {
      this.openaiApiKey = changes.openai_api_key.newValue;
    }
  }

  createSuggestionBox() {
    this.suggestionBox = document.createElement('div');
    this.suggestionBox.id = 'ai-writing-suggestions';
    this.suggestionBox.className = 'ai-suggestion-box';
    this.suggestionBox.style.display = 'none';
    
    document.body.appendChild(this.suggestionBox);
  }

  startTextMonitoring() {
    // Monitor for text changes in Google Docs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.handleTextChange();
        }
      });
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Also listen for keyboard events
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleTextChange() {
    // Debounce text change handling to avoid excessive API calls
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.analyzeCurrentText();
    }, 500);
  }

  handleKeyUp(event) {
    // Handle specific key combinations
    if (event.key === 'Tab' && this.suggestions.length > 0) {
      event.preventDefault();
      this.acceptSuggestion(this.suggestions[0]);
    }
  }

  handleKeyDown(event) {
    // Handle arrow keys for suggestion navigation
    if (this.suggestions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateSuggestions(event.key === 'ArrowDown' ? 1 : -1);
      }
    }
  }

  async analyzeCurrentText() {
    if (!this.openaiApiKey) {
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

  getCurrentText() {
    // Get text from Google Docs editor
    const editor = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                  document.querySelector('.kix-appview-editor');
    
    if (!editor) return '';
    
    // Get text content while preserving some formatting context
    const textContent = editor.textContent || '';
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      this.cursorPosition = this.getCursorPosition(range, editor);
    }
    
    return textContent;
  }

  getCursorPosition(range, editor) {
    // Calculate cursor position relative to editor
    let position = 0;
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      if (node === range.startContainer) {
        position += range.startOffset;
        break;
      }
      position += node.textContent.length;
    }
    
    return position;
  }

  async getAISuggestions(text) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant. Provide 3-5 short, contextual suggestions to continue the given text. Keep suggestions concise (1-2 sentences max) and natural. Focus on continuing the thought or idea.'
          },
          {
            role: 'user',
            content: `Continue this text naturally: "${text}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse suggestions (assuming they're separated by newlines or other delimiters)
    return content.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
  }

  showSuggestions(suggestions) {
    this.suggestions = suggestions;
    
    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    // Position suggestion box near cursor
    this.positionSuggestionBox();
    
    // Populate suggestions
    this.suggestionBox.innerHTML = suggestions.map((suggestion, index) => `
      <div class="suggestion-item" data-index="${index}">
        <span class="suggestion-text">${suggestion}</span>
        <span class="suggestion-hint">Tab to accept</span>
      </div>
    `).join('');

    // Add click handlers
    this.suggestionBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
      item.addEventListener('click', () => this.acceptSuggestion(suggestions[index]));
    });

    this.suggestionBox.style.display = 'block';
  }

  positionSuggestionBox() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position below the cursor
    this.suggestionBox.style.position = 'fixed';
    this.suggestionBox.style.left = `${rect.left}px`;
    this.suggestionBox.style.top = `${rect.bottom + 5}px`;
    this.suggestionBox.style.zIndex = '9999';
  }

  acceptSuggestion(suggestion) {
    // Insert suggestion at cursor position
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(suggestion));
    
    // Move cursor to end of inserted text
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    this.hideSuggestions();
  }

  navigateSuggestions(direction) {
    const items = this.suggestionBox.querySelectorAll('.suggestion-item');
    const currentActive = this.suggestionBox.querySelector('.suggestion-item.active');
    
    let nextIndex = 0;
    if (currentActive) {
      const currentIndex = parseInt(currentActive.dataset.index);
      nextIndex = (currentIndex + direction + items.length) % items.length;
      currentActive.classList.remove('active');
    }
    
    items[nextIndex].classList.add('active');
  }

  hideSuggestions() {
    this.suggestionBox.style.display = 'none';
    this.suggestions = [];
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