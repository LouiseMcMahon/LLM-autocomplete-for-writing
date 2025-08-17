# Quick Setup Guide

## Prerequisites
- Chrome browser (version 88+)
- OpenAI API key
- Basic knowledge of Chrome extensions

## Step-by-Step Setup

### 1. Get OpenAI API Key
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Sign up/login and create an API key
- Copy the key (starts with `sk-`)

### 2. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the folder containing your extension files
5. The extension should now appear in your extensions list

### 3. Configure API Key
1. Click the extension icon in your Chrome toolbar
2. Enter your OpenAI API key in the popup
3. Click "Test API Key" to verify it works
4. Click "Save Settings"

### 4. Test in Google Docs
1. Open [Google Docs](https://docs.google.com)
2. Create a new document or open an existing one
3. Start typing (extension activates after 10+ characters)
4. Look for suggestions appearing below your cursor
5. Use Tab to accept suggestions or click to select

## Development Workflow

### Making Changes
1. Edit the source files (`content.js`, `popup.js`, etc.)
2. Go back to `chrome://extensions/`
3. Click the "Reload" button on your extension
4. Refresh your Google Docs tab
5. Test your changes

### Debugging
- **Popup Issues**: Right-click extension icon → "Inspect popup"
- **Content Script Issues**: Open DevTools in Google Docs → Console tab
- **Background Script Issues**: Go to `chrome://extensions/` → Click "service worker" link

## Common Issues & Solutions

### Extension Not Working
- Check if extension is enabled in `chrome://extensions/`
- Verify API key is valid and saved
- Check browser console for errors
- Ensure you're on a Google Docs page

### Suggestions Not Appearing
- Verify API key is working (use "Test API Key" button)
- Check internet connection
- Look for errors in browser console
- Ensure you have 10+ characters typed

### Conflicts with Grammarly
- Try refreshing the page
- Check if Grammarly is fully loaded before extension
- Verify extension z-index settings

## File Structure
```
your-extension-folder/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality
├── popup.html            # Settings popup
├── popup.js              # Popup logic
├── background.js         # Service worker
├── styles.css            # Styling
├── SETUP.md              # This file
└── README.md             # Full documentation
```

## Next Steps
- Test thoroughly in different Google Docs scenarios
- Customize the suggestion prompts in `content.js`
- Adjust styling in `styles.css`
- Add error handling and user feedback
- Consider publishing to Chrome Web Store

## Support
- Check the main README.md for detailed documentation
- Review inline code comments for implementation details
- Test in different browsers and scenarios
- Monitor Chrome extension best practices