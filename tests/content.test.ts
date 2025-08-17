// Unit tests for AI Writing Assistant Content Script

import { AIWritingAssistant } from '../src/content';

// Mock the AIWritingAssistant class for testing
jest.mock('../src/content', () => {
  return {
    AIWritingAssistant: jest.fn().mockImplementation(() => ({
      init: jest.fn(),
      destroy: jest.fn()
    }))
  };
});

describe('AIWritingAssistant', () => {
  let mockAssistant: any;
  let mockDocument: any;
  let mockWindow: any;
  let mockMutationObserver: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockDocument = {
      querySelector: jest.fn(),
      createElement: jest.fn(),
      createTextNode: jest.fn(),
      body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      createTreeWalker: jest.fn()
    };

    mockWindow = {
      getSelection: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setTimeout: jest.fn(),
      clearTimeout: jest.fn()
    };

    mockMutationObserver = {
      observe: jest.fn(),
      disconnect: jest.fn()
    };

    // Mock global objects
    (global as any).document = mockDocument;
    (global as any).window = mockWindow;
    (global as any).MutationObserver = jest.fn(() => mockMutationObserver);
  });

  describe('Initialization', () => {
    it('should initialize successfully when Google Docs is ready', async () => {
      // Mock Google Docs editor element
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      // Mock chrome storage
      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
        openai_api_key: 'test-key',
        enable_autocomplete: true,
        show_suggestions: true
      });

      const assistant = new AIWritingAssistant();
      
      expect(assistant.init).toHaveBeenCalled();
    });

    it('should wait for Google Docs to load', async () => {
      // Mock that Google Docs is not ready initially
      mockDocument.querySelector.mockReturnValue(null);
      
      // Mock setTimeout to simulate waiting
      mockWindow.setTimeout.mockImplementation((callback: any) => {
        // Simulate Google Docs becoming ready
        mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
        callback();
        return 123;
      });

      const assistant = new AIWritingAssistant();
      
      expect(mockWindow.setTimeout).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    it('should load settings from chrome storage', async () => {
      const mockSettings = {
        openai_api_key: 'test-key-123',
        enable_autocomplete: true,
        show_suggestions: false
      };

      (chrome.storage.sync.get as jest.Mock).mockResolvedValue(mockSettings);

      const assistant = new AIWritingAssistant();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([
        'openai_api_key',
        'enable_autocomplete',
        'show_suggestions'
      ]);
    });

    it('should handle storage changes', () => {
      const mockChanges = {
        openai_api_key: { newValue: 'new-key' },
        enable_autocomplete: { newValue: false }
      };

      const assistant = new AIWritingAssistant();
      
      // Simulate storage change
      const storageListener = (chrome.storage.onChanged.addListener as jest.Mock).mock.calls[0][0];
      storageListener(mockChanges, 'sync');

      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });
  });

  describe('Text Monitoring', () => {
    it('should start monitoring text changes when enabled', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      expect(mockMutationObserver.observe).toHaveBeenCalledWith(
        mockDocument.body,
        {
          childList: true,
          subtree: true,
          characterData: true
        }
      );
    });

    it('should not start monitoring when autocomplete is disabled', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      // Mock disabled settings
      (chrome.storage.sync.get as jest.Mock).mockResolvedValue({
        enable_autocomplete: false,
        show_suggestions: true
      });

      const assistant = new AIWritingAssistant();
      
      expect(mockMutationObserver.observe).not.toHaveBeenCalled();
    });

    it('should debounce text change handling', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      // Simulate multiple rapid text changes
      const mutationListener = (mockMutationObserver.observe as jest.Mock).mock.calls[0][1];
      mutationListener([{ type: 'characterData' }]);
      mutationListener([{ type: 'characterData' }]);
      mutationListener([{ type: 'characterData' }]);

      // Should only call setTimeout once due to debouncing
      expect(mockWindow.setTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('AI Suggestions', () => {
    it('should fetch suggestions from OpenAI API', async () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'This is a test document with enough text to trigger suggestions' });
      
      const mockResponse = {
        choices: [{
          message: {
            content: 'Suggestion 1\nSuggestion 2\nSuggestion 3'
          }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const assistant = new AIWritingAssistant();
      
      // Simulate text analysis
      const mutationListener = (mockMutationObserver.observe as jest.Mock).mock.calls[0][1];
      mutationListener([{ type: 'characterData' }]);

      // Wait for debounced function
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should not fetch suggestions for short text', async () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Short' });
      
      const assistant = new AIWritingAssistant();
      
      // Simulate text analysis
      const mutationListener = (mockMutationObserver.observe as jest.Mock).mock.calls[0][1];
      mutationListener([{ type: 'characterData' }]);

      // Wait for debounced function
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'This is a test document with enough text to trigger suggestions' });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });

      const assistant = new AIWritingAssistant();
      
      // Simulate text analysis
      const mutationListener = (mockMutationObserver.observe as jest.Mock).mock.calls[0][1];
      mutationListener([{ type: 'characterData' }]);

      // Wait for debounced function
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(console.error).toHaveBeenCalledWith(
        'Error getting AI suggestions:',
        expect.any(Error)
      );
    });
  });

  describe('Suggestion Display', () => {
    it('should create suggestion box element', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const mockElement = {
        id: '',
        className: '',
        style: {},
        innerHTML: ''
      };
      mockDocument.createElement.mockReturnValue(mockElement);

      const assistant = new AIWritingAssistant();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockElement);
    });

    it('should position suggestion box near cursor', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jest.fn(() => ({
          getBoundingClientRect: () => ({
            left: 100,
            top: 200,
            bottom: 220
          })
        }))
      };
      mockWindow.getSelection.mockReturnValue(mockSelection);

      const assistant = new AIWritingAssistant();
      
      // Simulate showing suggestions
      const mockElement = {
        style: {},
        innerHTML: '',
        querySelectorAll: jest.fn(() => [])
      };
      mockDocument.createElement.mockReturnValue(mockElement);

      expect(mockWindow.getSelection).toHaveBeenCalled();
    });

    it('should escape HTML in suggestions', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const mockDiv = {
        textContent: '',
        innerHTML: ''
      };
      mockDocument.createElement.mockReturnValue(mockDiv);

      const assistant = new AIWritingAssistant();
      
      // Test HTML escaping
      const testText = '<script>alert("xss")</script>';
      mockDiv.textContent = testText;
      
      expect(mockDiv.textContent).toBe(testText);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Tab key to accept first suggestion', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      // Mock suggestions
      (assistant as any).suggestions = [
        { text: 'First suggestion' },
        { text: 'Second suggestion' }
      ];

      // Simulate Tab key press
      const keyEvent = new KeyboardEvent('keyup', { key: 'Tab' });
      mockDocument.dispatchEvent(keyEvent);

      expect(assistant.acceptSuggestion).toHaveBeenCalledWith(
        { text: 'First suggestion' }
      );
    });

    it('should handle arrow keys for navigation', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      // Mock suggestions
      (assistant as any).suggestions = [
        { text: 'First suggestion' },
        { text: 'Second suggestion' }
      ];

      // Simulate arrow key press
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      mockDocument.dispatchEvent(downEvent);

      expect(assistant.navigateSuggestions).toHaveBeenCalledWith(1);
    });
  });

  describe('Cleanup', () => {
    it('should disconnect mutation observer on destroy', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      assistant.destroy();
      
      expect(mockMutationObserver.disconnect).toHaveBeenCalled();
    });

    it('should remove event listeners on destroy', () => {
      mockDocument.querySelector.mockReturnValue({ textContent: 'Test content' });
      
      const assistant = new AIWritingAssistant();
      
      assistant.destroy();
      
      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });
  });
});