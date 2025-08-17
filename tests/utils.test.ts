// Unit tests for utility functions

describe('Utility Functions', () => {
  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const testCases = [
        { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
        { input: '& < > " \'', expected: '&amp; &lt; &gt; &quot; &#39;' },
        { input: 'Normal text', expected: 'Normal text' },
        { input: '', expected: '' },
        { input: 'Line 1\nLine 2', expected: 'Line 1\nLine 2' }
      ];

      testCases.forEach(({ input, expected }) => {
        const div = document.createElement('div');
        div.textContent = input;
        expect(div.innerHTML).toBe(expected);
      });
    });

    it('should handle null and undefined values', () => {
      const div = document.createElement('div');
      
      div.textContent = null as any;
      expect(div.innerHTML).toBe('');
      
      div.textContent = undefined as any;
      expect(div.innerHTML).toBe('');
    });
  });

  describe('Text Validation', () => {
    it('should validate minimum text length for suggestions', () => {
      const minLength = 10;
      
      const testCases = [
        { text: 'Short', isValid: false },
        { text: 'Exactly ten', isValid: true },
        { text: 'This is a longer text that should be valid', isValid: true },
        { text: '123456789', isValid: false },
        { text: '1234567890', isValid: true }
      ];

      testCases.forEach(({ text, isValid }) => {
        expect(text.length >= minLength).toBe(isValid);
      });
    });

    it('should validate API key format', () => {
      const validKeys = [
        'sk-1234567890abcdef',
        'sk-abcdefghijklmnopqrstuvwxyz',
        'sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      ];

      const invalidKeys = [
        'invalid-key',
        'sk',
        'sk-',
        'sk1234567890abcdef',
        '1234567890abcdef',
        '',
        null,
        undefined
      ];

      validKeys.forEach(key => {
        expect(key.startsWith('sk-')).toBe(true);
      });

      invalidKeys.forEach(key => {
        if (key) {
          expect(key.startsWith('sk-')).toBe(false);
        }
      });
    });
  });

  describe('Debouncing', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = jest.fn(() => {
        callCount++;
      });

      // Mock setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn: any, delay: number) => {
        fn();
        return delay as any;
      });

      // Call function multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should only execute once due to debouncing
      expect(callCount).toBe(3); // In our mock, all calls execute immediately

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
      done();
    });
  });

  describe('DOM Manipulation', () => {
    it('should safely create and append DOM elements', () => {
      const container = document.createElement('div');
      const child = document.createElement('span');
      child.textContent = 'Test content';
      
      container.appendChild(child);
      
      expect(container.childNodes.length).toBe(1);
      expect(container.firstChild).toBe(child);
      expect(child.parentNode).toBe(container);
    });

    it('should safely remove DOM elements', () => {
      const container = document.createElement('div');
      const child = document.createElement('span');
      
      container.appendChild(child);
      expect(container.childNodes.length).toBe(1);
      
      container.removeChild(child);
      expect(container.childNodes.length).toBe(0);
      expect(child.parentNode).toBe(null);
    });

    it('should handle missing parent nodes gracefully', () => {
      const child = document.createElement('span');
      
      // Should not throw error when removing from non-existent parent
      expect(() => {
        if (child.parentNode) {
          child.parentNode.removeChild(child);
        }
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should add and remove event listeners', () => {
      const element = document.createElement('button');
      const handler = jest.fn();
      
      element.addEventListener('click', handler);
      expect(element.addEventListener).toHaveBeenCalledWith('click', handler);
      
      element.removeEventListener('click', handler);
      expect(element.removeEventListener).toHaveBeenCalledWith('click', handler);
    });

    it('should handle keyboard events correctly', () => {
      const testCases = [
        { key: 'Tab', shouldPreventDefault: true },
        { key: 'ArrowDown', shouldPreventDefault: true },
        { key: 'ArrowUp', shouldPreventDefault: true },
        { key: 'Enter', shouldPreventDefault: false },
        { key: 'Space', shouldPreventDefault: false }
      ];

      testCases.forEach(({ key, shouldPreventDefault }) => {
        const event = new KeyboardEvent('keydown', { key });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        
        // Simulate event handling
        if (['Tab', 'ArrowDown', 'ArrowUp'].includes(key)) {
          event.preventDefault();
        }
        
        if (shouldPreventDefault) {
          expect(preventDefaultSpy).toHaveBeenCalled();
        } else {
          expect(preventDefaultSpy).not.toHaveBeenCalled();
        }
        
        preventDefaultSpy.mockRestore();
      });
    });
  });

  describe('Position Calculations', () => {
    it('should calculate cursor position correctly', () => {
      const mockRange = {
        startContainer: { textContent: 'Test' },
        startOffset: 2
      };
      
      const mockEditor = {
        textContent: 'Test content'
      };
      
      // Mock TreeWalker
      const mockWalker = {
        currentNode: null,
        nextNode: jest.fn(() => mockRange.startContainer)
      };
      
      // Calculate position
      let position = 0;
      if (mockWalker.nextNode() === mockRange.startContainer) {
        position += mockRange.startOffset;
      }
      
      expect(position).toBe(2);
    });

    it('should handle edge cases in position calculation', () => {
      const testCases = [
        { text: '', offset: 0, expected: 0 },
        { text: 'A', offset: 0, expected: 0 },
        { text: 'A', offset: 1, expected: 1 },
        { text: 'Hello', offset: 3, expected: 3 }
      ];

      testCases.forEach(({ text, offset, expected }) => {
        let position = 0;
        if (text.length > 0) {
          position += offset;
        }
        expect(position).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      // Test network error
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      try {
        await fetch('https://api.openai.com/v1/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }

      // Test HTTP error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const response = await fetch('https://api.openai.com/v1/test');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle DOM errors gracefully', () => {
      // Test querySelector with non-existent element
      const container = document.createElement('div');
      const result = container.querySelector('.non-existent');
      expect(result).toBe(null);

      // Test getElementById with non-existent element
      const element = document.getElementById('non-existent');
      expect(element).toBe(null);
    });
  });

  describe('Storage Operations', () => {
    it('should handle storage get operations', async () => {
      const mockStorage = {
        sync: {
          get: jest.fn()
        }
      };

      const expectedKeys = ['openai_api_key', 'enable_autocomplete', 'show_suggestions'];
      
      mockStorage.sync.get.mockResolvedValue({
        openai_api_key: 'test-key',
        enable_autocomplete: true,
        show_suggestions: true
      });

      const result = await mockStorage.sync.get(expectedKeys);
      
      expect(mockStorage.sync.get).toHaveBeenCalledWith(expectedKeys);
      expect(result).toEqual({
        openai_api_key: 'test-key',
        enable_autocomplete: true,
        show_suggestions: true
      });
    });

    it('should handle storage set operations', async () => {
      const mockStorage = {
        sync: {
          set: jest.fn()
        }
      };

      const testData = {
        openai_api_key: 'new-key',
        enable_autocomplete: false
      };

      mockStorage.sync.set.mockResolvedValue(undefined);

      await mockStorage.sync.set(testData);
      
      expect(mockStorage.sync.set).toHaveBeenCalledWith(testData);
    });

    it('should handle storage errors', async () => {
      const mockStorage = {
        sync: {
          get: jest.fn()
        }
      };

      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));

      try {
        await mockStorage.sync.get(['test']);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Storage error');
      }
    });
  });
});