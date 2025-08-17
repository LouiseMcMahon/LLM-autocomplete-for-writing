// Background service worker for AI Writing Assistant Chrome Extension

import { MessageFromContent } from './types';

// Handle extension installation
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails): void => {
  if (details.reason === 'install') {
    // First time installation
    console.log('AI Writing Assistant installed');
    
    // Set default settings
    chrome.storage.sync.set({
      enable_autocomplete: true,
      show_suggestions: true
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://github.com/your-repo/ai-writing-assistant#readme'
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab): void => {
  // Only show popup on Google Docs pages
  if (tab.url && tab.url.includes('docs.google.com')) {
    // The popup will automatically show due to manifest configuration
    console.log('Extension icon clicked on Google Docs');
  } else {
    // Show message for non-Google Docs pages
    chrome.tabs.sendMessage(tab.id!, {
      type: 'SHOW_INFO',
      message: 'AI Writing Assistant works best in Google Docs!'
    }).catch(() => {
      // If content script isn't loaded, show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Writing Assistant',
        message: 'This extension works best in Google Docs!'
      });
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((
  message: MessageFromContent, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
): boolean => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'API_REQUEST':
      // Handle API requests if needed
      sendResponse({ success: true });
      break;
      
    case 'ERROR_REPORT':
      // Log errors for debugging
      console.error('Content script error:', message.error);
      sendResponse({ success: true });
      break;
      
    case 'STATS_UPDATE':
      // Track usage statistics if desired
      console.log('Usage stats:', message.stats);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  // Return true to indicate async response
  return true;
});

// Handle tab updates to inject content script when needed
chrome.tabs.onUpdated.addListener((
  tabId: number, 
  changeInfo: chrome.tabs.TabChangeInfo, 
  tab: chrome.tabs.Tab
): void => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('docs.google.com/document')) {
    
    // Inject content script if not already injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Content script might already be injected
      console.log('Content script injection skipped (likely already present)');
    });
  }
});

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener((): void => {
  console.log('Extension update available');
  // Optionally notify user or auto-update
});

// Handle storage changes
chrome.storage.onChanged.addListener((
  changes: { [key: string]: chrome.storage.StorageChange }, 
  namespace: string
): void => {
  console.log('Storage changed:', changes, namespace);
  
  // Notify all Google Docs tabs of settings changes
  if (changes.openai_api_key || changes.enable_autocomplete || changes.show_suggestions) {
    chrome.tabs.query({ url: 'https://docs.google.com/document/*' }, (tabs: chrome.tabs.Tab[]) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            data: changes
          }).catch(() => {
            // Tab might not have content script loaded yet
          });
        }
      });
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener((): void => {
  console.log('AI Writing Assistant service worker started');
});

// Handle uninstall
chrome.runtime.setUninstallURL('https://forms.gle/your-feedback-form');