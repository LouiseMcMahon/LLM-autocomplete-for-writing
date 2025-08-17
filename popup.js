// Popup script for AI Writing Assistant Chrome Extension

class PopupManager {
  constructor() {
    this.form = document.getElementById('settingsForm');
    this.apiKeyInput = document.getElementById('apiKey');
    this.enableAutocompleteToggle = document.getElementById('enableAutocomplete');
    this.showSuggestionsToggle = document.getElementById('showSuggestions');
    this.saveBtn = document.getElementById('saveBtn');
    this.statusDiv = document.getElementById('status');
    
    this.init();
  }

  async init() {
    // Load saved settings
    await this.loadSettings();
    
    // Add event listeners
    this.form.addEventListener('submit', this.handleSave.bind(this));
    
    // Test API key button (optional)
    this.addTestApiKeyButton();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'openai_api_key',
        'enable_autocomplete',
        'show_suggestions'
      ]);
      
      if (result.openai_api_key) {
        this.apiKeyInput.value = result.openai_api_key;
      }
      
      this.enableAutocompleteToggle.checked = result.enable_autocomplete !== false;
      this.showSuggestionsToggle.checked = result.show_suggestions !== false;
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  async handleSave(event) {
    event.preventDefault();
    
    const apiKey = this.apiKeyInput.value.trim();
    const enableAutocomplete = this.enableAutocompleteToggle.checked;
    const showSuggestions = this.showSuggestionsToggle.checked;
    
    if (!apiKey) {
      this.showStatus('Please enter your OpenAI API key', 'error');
      return;
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      this.showStatus('Invalid API key format. Should start with "sk-"', 'error');
      return;
    }
    
    try {
      // Save settings
      await chrome.storage.sync.set({
        openai_api_key: apiKey,
        enable_autocomplete: enableAutocomplete,
        show_suggestions: showSuggestions
      });
      
      // Notify content script of settings change
      await this.notifyContentScript({
        type: 'SETTINGS_UPDATED',
        data: {
          openai_api_key: apiKey,
          enable_autocomplete: enableAutocomplete,
          show_suggestions: showSuggestions
        }
      });
      
      this.showStatus('Settings saved successfully!', 'success');
      
      // Update button text temporarily
      this.saveBtn.textContent = 'Saved!';
      setTimeout(() => {
        this.saveBtn.textContent = 'Save Settings';
      }, 2000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async notifyContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url && tab.url.includes('docs.google.com')) {
        await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.error('Error notifying content script:', error);
    }
  }

  addTestApiKeyButton() {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test API Key';
    testBtn.className = 'btn';
    testBtn.style.marginTop = '8px';
    testBtn.style.background = '#34a853';
    
    testBtn.addEventListener('click', this.testApiKey.bind(this));
    
    this.form.appendChild(testBtn);
  }

  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('Please enter an API key first', 'error');
      return;
    }
    
    this.saveBtn.disabled = true;
    this.saveBtn.textContent = 'Testing...';
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        this.showStatus('API key is valid!', 'success');
      } else {
        this.showStatus('Invalid API key or API error', 'error');
      }
      
    } catch (error) {
      console.error('Error testing API key:', error);
      this.showStatus('Error testing API key', 'error');
    } finally {
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = 'Save Settings';
    }
  }

  showStatus(message, type) {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});