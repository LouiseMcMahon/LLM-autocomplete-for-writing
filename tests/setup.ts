// Jest setup file for AI Writing Assistant tests

// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
} as any;

// Mock fetch
global.fetch = jest.fn();

// Mock DOM elements
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'createTreeWalker', {
  writable: true,
  value: jest.fn()
});

// Mock MutationObserver
global.MutationObserver = class {
  constructor(callback: any) {}
  observe() {}
  disconnect() {}
} as any;

// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((callback: any, delay: number) => {
  return delay as any;
});

global.clearTimeout = jest.fn();

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'createTextNode', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'body', {
  writable: true,
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
});

// Mock HTMLElement
class MockHTMLElement {
  id = '';
  className = '';
  style: any = {};
  innerHTML = '';
  textContent = '';
  parentNode: any = null;
  childNodes: any = [];
  
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  querySelector = jest.fn();
  querySelectorAll = jest.fn();
  getAttribute = jest.fn();
  setAttribute = jest.fn();
  removeAttribute = jest.fn();
  click = jest.fn();
  focus = jest.fn();
  blur = jest.fn();
  
  appendChild(child: any) {
    this.childNodes.push(child);
    child.parentNode = this;
  }
  
  removeChild(child: any) {
    const index = this.childNodes.indexOf(child);
    if (index > -1) {
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }
  }
}

// Mock document.createElement
(document.createElement as any) = jest.fn((tagName: string) => {
  return new MockHTMLElement();
});

// Mock document.createTextNode
(document.createTextNode as any) = jest.fn((text: string) => {
  return { textContent: text };
});

// Mock window.getSelection
(window.getSelection as any) = jest.fn(() => ({
  rangeCount: 0,
  getRangeAt: jest.fn(),
  removeAllRanges: jest.fn(),
  addRange: jest.fn()
}));

// Mock Range
class MockRange {
  startContainer: any = {};
  startOffset = 0;
  endContainer: any = {};
  endOffset = 0;
  commonAncestorContainer: any = {};
  collapsed = true;
  
  deleteContents = jest.fn();
  insertNode = jest.fn();
  collapse = jest.fn();
  getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    right: 100,
    bottom: 20,
    width: 100,
    height: 20
  }));
}

// Mock TreeWalker
class MockTreeWalker {
  currentNode: any = {};
  
  nextNode = jest.fn(() => null);
  previousNode = jest.fn(() => null);
  parentNode = jest.fn(() => null);
  firstChild = jest.fn(() => null);
  lastChild = jest.fn(() => null);
  nextSibling = jest.fn(() => null);
  previousSibling = jest.fn(() => null);
}

// Mock document.createTreeWalker
(document.createTreeWalker as any) = jest.fn(() => new MockTreeWalker());

// Mock NodeFilter constants
Object.defineProperty(document, 'SHOW_TEXT', {
  writable: true,
  value: 4
});

// Mock fetch response
(global.fetch as any).mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{
        message: {
          content: 'Test suggestion 1\nTest suggestion 2\nTest suggestion 3'
        }
      }]
    })
  })
);

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});