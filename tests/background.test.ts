// Unit tests for AI Writing Assistant Background Service Worker

describe('Background Service Worker', () => {
  let mockChrome: any;
  let mockTabs: any;
  let mockStorage: any;
  let mockRuntime: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Chrome API objects
    mockTabs = {
      query: jest.fn(),
      sendMessage: jest.fn(),
      create: jest.fn()
    };

    mockStorage = {
      sync: {
        set: jest.fn(),
        onChanged: {
          addListener: jest.fn()
        }
      }
    };

    mockRuntime = {
      onInstalled: {
        addListener: jest.fn()
      },
      onMessage: {
        addListener: jest.fn()
      },
      onUpdateAvailable: {
        addListener: jest.fn()
      },
      setUninstallURL: jest.fn()
    };

    mockChrome = {
      tabs: mockTabs,
      storage: mockStorage,
      runtime: mockRuntime,
      action: {
        onClicked: {
          addListener: jest.fn()
        }
      },
      tabs: {
        onUpdated: {
          addListener: jest.fn()
        },
        query: mockTabs.query,
        sendMessage: mockTabs.sendMessage,
        create: mockTabs.create
      },
      scripting: {
        executeScript: jest.fn()
      },
      notifications: {
        create: jest.fn()
      }
    };

    // Mock global chrome object
    (global as any).chrome = mockChrome;
  });

  describe('Extension Installation', () => {
    it('should handle first-time installation', () => {
      // Simulate extension installation
      const installDetails = { reason: 'install' };
      
      // Get the installed listener
      const installedListener = mockRuntime.onInstalled.addListener.mock.calls[0][0];
      installedListener(installDetails);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        enable_autocomplete: true,
        show_suggestions: true
      });

      expect(mockTabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/your-repo/ai-writing-assistant#readme'
      });
    });

    it('should not handle non-install events', () => {
      // Simulate extension update
      const updateDetails = { reason: 'update' };
      
      const installedListener = mockRuntime.onInstalled.addListener.mock.calls[0][0];
      installedListener(updateDetails);

      expect(mockStorage.sync.set).not.toHaveBeenCalled();
      expect(mockTabs.create).not.toHaveBeenCalled();
    });
  });

  describe('Extension Icon Click', () => {
    it('should handle clicks on Google Docs pages', () => {
      const mockTab = {
        id: 123,
        url: 'https://docs.google.com/document/test'
      };

      // Get the clicked listener
      const clickedListener = mockChrome.action.onClicked.addListener.mock.calls[0][0];
      clickedListener(mockTab);

      // Should log the click (popup will show automatically)
      expect(console.log).toHaveBeenCalledWith('Extension icon clicked on Google Docs');
    });

    it('should show notification for non-Google Docs pages', () => {
      const mockTab = {
        id: 123,
        url: 'https://example.com'
      };

      // Mock successful message sending
      mockTabs.sendMessage.mockResolvedValue({});

      const clickedListener = mockChrome.action.onClicked.addListener.mock.calls[0][0];
      clickedListener(mockTab);

      expect(mockTabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'SHOW_INFO',
        message: 'AI Writing Assistant works best in Google Docs!'
      });
    });

    it('should show notification when content script is not loaded', async () => {
      const mockTab = {
        id: 123,
        url: 'https://example.com'
      };

      // Mock failed message sending (content script not loaded)
      mockTabs.sendMessage.mockRejectedValue(new Error('Content script not found'));

      const clickedListener = mockChrome.action.onClicked.addListener.mock.calls[0][0];
      await clickedListener(mockTab);

      expect(mockChrome.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Writing Assistant',
        message: 'This extension works best in Google Docs!'
      });
    });
  });

  describe('Message Handling', () => {
    it('should handle API_REQUEST messages', () => {
      const mockMessage = { type: 'API_REQUEST' };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      // Get the message listener
      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
      const result = messageListener(mockMessage, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle ERROR_REPORT messages', () => {
      const mockMessage = { 
        type: 'ERROR_REPORT', 
        error: 'Test error message' 
      };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
      const result = messageListener(mockMessage, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      expect(console.error).toHaveBeenCalledWith('Content script error:', 'Test error message');
    });

    it('should handle STATS_UPDATE messages', () => {
      const mockMessage = { 
        type: 'STATS_UPDATE', 
        stats: { suggestions: 5, errors: 0 } 
      };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
      const result = messageListener(mockMessage, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      expect(console.log).toHaveBeenCalledWith('Usage stats:', { suggestions: 5, errors: 0 });
    });

    it('should handle unknown message types', () => {
      const mockMessage = { type: 'UNKNOWN_TYPE' };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
      const result = messageListener(mockMessage, mockSender, mockSendResponse);

      expect(result).toBe(true);
      expect(mockSendResponse).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Unknown message type' 
      });
    });
  });

  describe('Tab Updates', () => {
    it('should inject content script on Google Docs pages', () => {
      const mockTabId = 123;
      const mockChangeInfo = { status: 'complete' };
      const mockTab = { 
        url: 'https://docs.google.com/document/test' 
      };

      // Get the updated listener
      const updatedListener = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      updatedListener(mockTabId, mockChangeInfo, mockTab);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: mockTabId },
        files: ['content.js']
      });
    });

    it('should not inject content script on non-Google Docs pages', () => {
      const mockTabId = 123;
      const mockChangeInfo = { status: 'complete' };
      const mockTab = { 
        url: 'https://example.com' 
      };

      const updatedListener = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      updatedListener(mockTabId, mockChangeInfo, mockTab);

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should not inject content script when page is not complete', () => {
      const mockTabId = 123;
      const mockChangeInfo = { status: 'loading' };
      const mockTab = { 
        url: 'https://docs.google.com/document/test' 
      };

      const updatedListener = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      updatedListener(mockTabId, mockChangeInfo, mockTab);

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should handle content script injection errors gracefully', () => {
      const mockTabId = 123;
      const mockChangeInfo = { status: 'complete' };
      const mockTab = { 
        url: 'https://docs.google.com/document/test' 
      };

      // Mock injection error
      mockChrome.scripting.executeScript.mockRejectedValue(new Error('Injection failed'));

      const updatedListener = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      updatedListener(mockTabId, mockChangeInfo, mockTab);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      // Should not throw error
    });
  });

  describe('Extension Updates', () => {
    it('should handle update available events', () => {
      // Get the update listener
      const updateListener = mockRuntime.onUpdateAvailable.addListener.mock.calls[0][0];
      updateListener();

      expect(console.log).toHaveBeenCalledWith('Extension update available');
    });
  });

  describe('Storage Changes', () => {
    it('should notify Google Docs tabs of settings changes', () => {
      const mockChanges = {
        openai_api_key: { newValue: 'new-key' },
        enable_autocomplete: { newValue: false }
      };

      // Mock tabs query result
      mockTabs.query.mockResolvedValue([
        { id: 123, url: 'https://docs.google.com/document/test1' },
        { id: 456, url: 'https://docs.google.com/document/test2' }
      ]);

      // Get the storage change listener
      const storageListener = mockStorage.onChanged.addListener.mock.calls[0][0];
      storageListener(mockChanges, 'sync');

      expect(mockTabs.query).toHaveBeenCalledWith({ 
        url: 'https://docs.google.com/document/*' 
      });

      expect(mockTabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'SETTINGS_UPDATED',
        data: mockChanges
      });

      expect(mockTabs.sendMessage).toHaveBeenCalledWith(456, {
        type: 'SETTINGS_UPDATED',
        data: mockChanges
      });
    });

    it('should not notify tabs for non-settings changes', () => {
      const mockChanges = {
        other_setting: { newValue: 'value' }
      };

      const storageListener = mockStorage.onChanged.addListener.mock.calls[0][0];
      storageListener(mockChanges, 'sync');

      expect(mockTabs.query).not.toHaveBeenCalled();
    });

    it('should handle storage change errors gracefully', () => {
      const mockChanges = {
        openai_api_key: { newValue: 'new-key' }
      };

      // Mock tabs query error
      mockTabs.query.mockRejectedValue(new Error('Query failed'));

      const storageListener = mockStorage.onChanged.addListener.mock.calls[0][0];
      
      // Should not throw error
      expect(() => storageListener(mockChanges, 'sync')).not.toThrow();
    });
  });

  describe('Service Worker Lifecycle', () => {
    it('should handle startup events', () => {
      // Get the startup listener
      const startupListener = mockRuntime.onStartup.addListener.mock.calls[0][0];
      startupListener();

      expect(console.log).toHaveBeenCalledWith('AI Writing Assistant service worker started');
    });

    it('should set uninstall URL', () => {
      // The uninstall URL should be set during module loading
      expect(mockRuntime.setUninstallURL).toHaveBeenCalledWith(
        'https://forms.gle/your-feedback-form'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle tab query errors gracefully', async () => {
      // Mock tab query error
      mockTabs.query.mockRejectedValue(new Error('Tab query failed'));

      const mockChanges = {
        openai_api_key: { newValue: 'new-key' }
      };

      const storageListener = mockStorage.onChanged.addListener.mock.calls[0][0];
      
      // Should not throw error
      await expect(storageListener(mockChanges, 'sync')).resolves.not.toThrow();
    });

    it('should handle message sending errors gracefully', async () => {
      const mockChanges = {
        openai_api_key: { newValue: 'new-key' }
      };

      // Mock successful tabs query but failed message sending
      mockTabs.query.mockResolvedValue([
        { id: 123, url: 'https://docs.google.com/document/test' }
      ]);
      mockTabs.sendMessage.mockRejectedValue(new Error('Message failed'));

      const storageListener = mockStorage.onChanged.addListener.mock.calls[0][0];
      
      // Should not throw error
      await expect(storageListener(mockChanges, 'sync')).resolves.not.toThrow();
    });
  });

  describe('Message Response Handling', () => {
    it('should return true for async message handling', () => {
      const mockMessage = { type: 'API_REQUEST' };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];
      const result = messageListener(mockMessage, mockSender, mockSendResponse);

      expect(result).toBe(true);
    });

    it('should handle multiple message types in sequence', () => {
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      const messageListener = mockRuntime.onMessage.addListener.mock.calls[0][0];

      // Test multiple message types
      const messageTypes = ['API_REQUEST', 'ERROR_REPORT', 'STATS_UPDATE'];
      
      messageTypes.forEach(type => {
        const message = { type };
        messageListener(message, mockSender, mockSendResponse);
      });

      expect(mockSendResponse).toHaveBeenCalledTimes(3);
    });
  });
});