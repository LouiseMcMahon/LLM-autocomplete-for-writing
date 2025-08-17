// Type definitions for AI Writing Assistant Chrome Extension

export interface ExtensionSettings {
  openai_api_key: string | null;
  enable_autocomplete: boolean;
  show_suggestions: boolean;
}

export interface AISuggestion {
  text: string;
  confidence?: number;
  type?: 'completion' | 'alternative' | 'continuation';
}

export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface TextContext {
  text: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
}

export interface SuggestionBoxPosition {
  left: number;
  top: number;
  width?: number;
  height?: number;
}

export interface MessageFromPopup {
  type: 'SETTINGS_UPDATED';
  data: Partial<ExtensionSettings>;
}

export interface MessageFromContent {
  type: 'API_REQUEST' | 'ERROR_REPORT' | 'STATS_UPDATE';
  data?: any;
  error?: string;
  stats?: any;
}

export interface MutationRecord {
  type: 'childList' | 'attributes' | 'characterData';
  target: Node;
  addedNodes?: NodeList;
  removedNodes?: NodeList;
  attributeName?: string;
  attributeNamespace?: string;
  oldValue?: string;
}

export interface MutationObserverInit {
  childList?: boolean;
  attributes?: boolean;
  characterData?: boolean;
  subtree?: boolean;
  attributeOldValue?: boolean;
  characterDataOldValue?: boolean;
  attributeFilter?: string[];
}

export interface Range {
  startContainer: Node;
  startOffset: number;
  endContainer: Node;
  endOffset: number;
  commonAncestorContainer: Node;
  collapsed: boolean;
  deleteContents(): void;
  insertNode(node: Node): void;
  collapse(toStart: boolean): void;
  getBoundingClientRect(): DOMRect;
}

export interface Selection {
  rangeCount: number;
  getRangeAt(index: number): Range;
  removeAllRanges(): void;
  addRange(range: Range): void;
}

export interface DOMRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TreeWalker {
  currentNode: Node;
  nextNode(): Node | null;
  previousNode(): Node | null;
  parentNode(): Node | null;
  firstChild(): Node | null;
  lastChild(): Node | null;
  nextSibling(): Node | null;
  previousSibling(): Node | null;
}

export interface Document {
  createTreeWalker(
    root: Node,
    whatToShow: number,
    filter: NodeFilter | null,
    entityReferenceExpansion: boolean
  ): TreeWalker;
}

export interface NodeFilter {
  FILTER_ACCEPT: number;
  FILTER_REJECT: number;
  FILTER_SKIP: number;
  SHOW_TEXT: number;
}

export interface Node {
  textContent: string | null;
  nodeType: number;
  nodeName: string;
  childNodes: NodeList;
  parentNode: Node | null;
  nextSibling: Node | null;
  previousSibling: Node | null;
}

export interface NodeList {
  length: number;
  item(index: number): Node | null;
  [index: number]: Node;
}

export interface Element extends Node {
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeListOf<Element>;
  getAttribute(qualifiedName: string): string | null;
  setAttribute(qualifiedName: string, value: string): void;
  removeAttribute(qualifiedName: string): void;
  classList: DOMTokenList;
  style: CSSStyleDeclaration;
  id: string;
  className: string;
  tagName: string;
}

export interface DOMTokenList {
  add(...tokens: string[]): void;
  remove(...tokens: string[]): void;
  contains(token: string): boolean;
  toggle(token: string, force?: boolean): boolean;
  length: number;
  [index: number]: string;
}

export interface CSSStyleDeclaration {
  [property: string]: string;
  getPropertyValue(property: string): string;
  setProperty(property: string, value: string, priority?: string): void;
  removeProperty(property: string): string;
}

export interface HTMLElement extends Element {
  innerHTML: string;
  outerHTML: string;
  textContent: string | null;
  title: string;
  lang: string;
  dir: string;
  hidden: boolean;
  tabIndex: number;
  accessKey: string;
  draggable: boolean;
  contentEditable: string;
  isContentEditable: boolean;
  spellcheck: boolean;
  click(): void;
  focus(): void;
  blur(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface EventListener {
  (evt: Event): void;
}

export interface Event {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

export interface EventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: Event): boolean;
}

export interface KeyboardEvent extends Event {
  key: string;
  code: string;
  keyCode: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  isComposing: boolean;
  locale: string;
  location: number;
  getModifierState(keyArg: string): boolean;
}

export interface MouseEvent extends Event {
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  relatedTarget: EventTarget | null;
}

export interface Window {
  getSelection(): Selection;
  document: Document;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface GlobalWindow extends Window {
  chrome: typeof chrome;
}

export interface ChromeAPI {
  storage: {
    sync: {
      get(keys: string[]): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      onChanged: {
        addListener(callback: (changes: any, namespace: string) => void): void;
        removeListener(callback: (changes: any, namespace: string) => void): void;
      };
    };
  };
  runtime: {
    onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
    sendMessage(message: any): Promise<any>;
  };
  tabs: {
    query(queryInfo: any): Promise<any[]>;
    sendMessage(tabId: number, message: any): Promise<any>;
  };
}