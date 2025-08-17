// Unit tests for AI Writing Assistant Popup

import { PopupManager } from '../src/popup';

// Mock the PopupManager class for testing
jest.mock('../src/popup', () => {
  return {
    PopupManager: jest.fn().mockImplementation(() => ({
      init: jest.fn(),
      handleSave: jest.fn(),
      testApiKey: jest.fn()
    }))
  };
});

describe('PopupManager', () => {
  let mockPopupManager: any;
  let mockForm: any;
  let mockApiKeyInput: any;
  let mockEnableToggle: any;
  let mockShowToggle: any;
  let mockSaveBtn: any;
  let mockStatusDiv: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock DOM elements
    mockForm = {
      addEventListener: jest.fn(),
      appendChild: jest.fn()
    };

    mockApiKeyInput = {
      value: ''
    };

    mockEnableToggle = {
      checked: true
    };

    mockShowToggle = {
      checked: true
    };

    mockSaveBtn = {
      textContent: 'Save Settings',
      disabled: false
    };

    mockStatusDiv = {
      textContent: '',
      className: '',
      style: { display: 'none' }
    };

    // Mock document.getElementById
    (document.getElementById as jest.Mock) = jest.fn((id: string) => {
      switch (id) {
        case 'settingsForm': return mockForm;
        case 'apiKey': return mockApiKeyInput;
        case 'enableAutocomplete': return mockEnableToggle;
        case 'showSuggestions': return mockShowToggle;
        case 'saveBtn': return mockSaveBtn;
        case 'status': return mockStatusDiv;
        default: return null;
      }
    });

    // Mock chrome storage
    (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
      openai_api_key: 'test-key-123',
      enable_autocomplete: true,
      show_suggestions: true
    });

    // Mock chrome tabs
    (chrome.tabs.query as jest.Mock).mockResolvedValue([{
      id: 123,
      url: 'https://docs.google.com/document/test'
    }]);

    (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({});
  });

  describe('Initialization', () => {
    it('should load settings from chrome storage on init', async () => {
      const popupManager = new PopupManager();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([
        'openai_api_key',
        'enable_autocomplete',
        'show_suggestions'
      ]);
    });

    it('should set form event listeners on init', () => {
      const popupManager = new PopupManager();
      
      expect(mockForm.addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
    });

    it('should add test API key button on init', () => {
      const popupManager = new PopupManager();
      
      expect(mockForm.appendChild).toHaveBeenCalled();
    });
  });

  describe('Settings Loading', () => {
    it('should populate form fields with saved settings', async () => {
      const mockSettings = {
        openai_api_key: 'saved-key-456',
        enable_autocomplete: false,
        show_suggestions: false
      };

      (chrome.storage.sync.get as jest.Mock).mockResolvedValue(mockSettings);

      const popupManager = new PopupManager();
      
      // Wait for async settings loading
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockApiKeyInput.value).toBe('saved-key-456');
      expect(mockEnableToggle.checked).toBe(false);
      expect(mockShowToggle.checked).toBe(false);
    });

    it('should handle missing settings gracefully', async () => {
      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({});

      const popupManager = new PopupManager();
      
      // Wait for async settings loading
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockApiKeyInput.value).toBe('');
      expect(mockEnableToggle.checked).toBe(true); // Default value
      expect(mockShowToggle.checked).toBe(true); // Default value
    });

    it('should handle storage errors gracefully', async () => {
      (chrome.storage.sync.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const popupManager = new PopupManager();
      
      // Wait for async settings loading
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith('Error loading settings:', expect.any(Error));
    });
  });

  describe('Form Submission', () => {
    it('should validate API key format', async () => {
      const popupManager = new PopupManager();
      
      // Test invalid API key
      mockApiKeyInput.value = 'invalid-key';
      
      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      expect(mockStatusDiv.textContent).toBe('Invalid API key format. Should start with "sk-"');
      expect(mockStatusDiv.className).toContain('error');
    });

    it('should require API key', async () => {
      const popupManager = new PopupManager();
      
      // Test empty API key
      mockApiKeyInput.value = '';
      
      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      expect(mockStatusDiv.textContent).toBe('Please enter your OpenAI API key');
      expect(mockStatusDiv.className).toContain('error');
    });

    it('should save valid settings to chrome storage', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-valid-key-789';
      mockEnableToggle.checked = false;
      mockShowToggle.checked = false;

      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        openai_api_key: 'sk-valid-key-789',
        enable_autocomplete: false,
        show_suggestions: false
      });
    });

    it('should notify content script of settings changes', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-valid-key-789';
      
      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'SETTINGS_UPDATED',
        data: {
          openai_api_key: 'sk-valid-key-789',
          enable_autocomplete: true,
          show_suggestions: true
        }
      });
    });

    it('should show success message after saving', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-valid-key-789';
      
      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockStatusDiv.textContent).toBe('Settings saved successfully!');
      expect(mockStatusDiv.className).toContain('success');
    });

    it('should update save button text temporarily', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-valid-key-789';
      
      const submitEvent = new Event('submit');
      mockForm.dispatchEvent(submitEvent);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSaveBtn.textContent).toBe('Saved!');

      // Wait for timeout to reset button text
      await new Promise(resolve => setTimeout(resolve, 2100));

      expect(mockSaveBtn.textContent).toBe('Save Settings');
    });
  });

  describe('API Key Testing', () => {
    it('should test API key with OpenAI endpoint', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-test-key-123';
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Simulate test button click
      const testBtn = document.createElement('button');
      testBtn.click();

      // Wait for async test operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer sk-test-key-123'
          }
        })
      );
    });

    it('should show success message for valid API key', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-test-key-123';
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      // Simulate test button click
      const testBtn = document.createElement('button');
      testBtn.click();

      // Wait for async test operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockStatusDiv.textContent).toBe('API key is valid!');
      expect(mockStatusDiv.className).toContain('success');
    });

    it('should show error message for invalid API key', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-test-key-123';
      
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      // Simulate test button click
      const testBtn = document.createElement('button');
      testBtn.click();

      // Wait for async test operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockStatusDiv.textContent).toBe('Invalid API key or API error');
      expect(mockStatusDiv.className).toContain('error');
    });

    it('should handle API test errors gracefully', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-test-key-123';
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Simulate test button click
      const testBtn = document.createElement('button');
      testBtn.click();

      // Wait for async test operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockStatusDiv.textContent).toBe('Error testing API key');
      expect(mockStatusDiv.className).toContain('error');
    });

    it('should disable save button during API test', async () => {
      const popupManager = new PopupManager();
      
      mockApiKeyInput.value = 'sk-test-key-123';
      
      // Mock slow API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      // Simulate test button click
      const testBtn = document.createElement('button');
      testBtn.click();

      expect(mockSaveBtn.disabled).toBe(true);
      expect(mockSaveBtn.textContent).toBe('Testing...');

      // Wait for API test to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockSaveBtn.disabled).toBe(false);
      expect(mockSaveBtn.textContent).toBe('Save Settings');
    });
  });

  describe('Status Messages', () => {
    it('should show status messages with correct styling', () => {
      const popupManager = new PopupManager();
      
      // Test success message
      (popupManager as any).showStatus('Test success message', 'success');
      
      expect(mockStatusDiv.textContent).toBe('Test success message');
      expect(mockStatusDiv.className).toContain('success');
      expect(mockStatusDiv.style.display).toBe('block');

      // Test error message
      (popupManager as any).showStatus('Test error message', 'error');
      
      expect(mockStatusDiv.textContent).toBe('Test error message');
      expect(mockStatusDiv.className).toContain('error');
    });

    it('should auto-hide status messages after 3 seconds', async () => {
      const popupManager = new PopupManager();
      
      (popupManager as any).showStatus('Test message', 'success');
      
      expect(mockStatusDiv.style.display).toBe('block');

      // Wait for auto-hide timeout
      await new Promise(resolve => setTimeout(resolve, 3100));

      expect(mockStatusDiv.style.display).toBe('none');
    });
  });

  describe('Content Script Communication', () => {
    it('should notify content script of settings updates', async () => {
      const popupManager = new PopupManager();
      
      const message = {
        type: 'SETTINGS_UPDATED',
        data: {
          openai_api_key: 'sk-new-key',
          enable_autocomplete: false
        }
      };

      await (popupManager as any).notifyContentScript(message);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, message);
    });

    it('should handle content script communication errors', async () => {
      const popupManager = new PopupManager();
      
      // Mock communication error
      (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('Communication error'));

      const message = {
        type: 'SETTINGS_UPDATED',
        data: { openai_api_key: 'sk-new-key' }
      };

      await (popupManager as any).notifyContentScript(message);

      expect(console.error).toHaveBeenCalledWith('Error notifying content script:', expect.any(Error));
    });

    it('should only notify content script on Google Docs pages', async () => {
      const popupManager = new PopupManager();
      
      // Mock non-Google Docs tab
      (chrome.tabs.query as jest.Mock).mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);

      const message = {
        type: 'SETTINGS_UPDATED',
        data: { openai_api_key: 'sk-new-key' }
      };

      await (popupManager as any).notifyContentScript(message);

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });
});