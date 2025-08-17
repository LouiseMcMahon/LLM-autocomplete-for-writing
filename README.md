# AI Writing Assistant Chrome Extension

A smart Chrome extension that provides AI-powered autocomplete suggestions in Google Docs, designed to work seamlessly alongside Grammarly and other writing tools.

## Goal

This extension eliminates the need to manually prompt ChatGPT for writing suggestions by automatically providing contextual autocomplete recommendations as you type in Google Docs. It's specifically designed to work well with Google Docs' complex DOM structure and play nice with Grammarly.

## Key Features

- **Automatic Suggestions**: Get intelligent writing suggestions without interrupting your flow
- **Google Docs Integration**: Seamlessly works within Google Docs' interface
- **Grammarly Compatible**: Designed to coexist with Grammarly without conflicts
- **Context-Aware**: Suggestions based on your current writing context and style
- **Powered by ChatGPT**: Leverages OpenAI's advanced language model
- **Real-time Analysis**: Monitors text changes and provides suggestions as you write

## How It Works

1. **Text Monitoring**: Uses MutationObserver to monitor text changes in Google Docs
2. **Context Analysis**: Analyzes your current text and cursor position
3. **AI Suggestions**: Sends context to OpenAI's API for intelligent completions
4. **Smart Display**: Shows suggestions in a non-intrusive dropdown near your cursor
5. **Easy Integration**: Accept suggestions with Tab key or mouse clicks

## Technical Implementation

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Injected into Google Docs pages
- **Background Service Worker**: Handles extension lifecycle and communication
- **Chrome Storage API**: Securely stores user preferences and API keys

### Google Docs Compatibility
- Targets `[contenteditable="true"][role="textbox"]` elements
- Uses MutationObserver for real-time text change detection
- Calculates cursor position relative to editor content
- Positions suggestion box dynamically based on cursor location

### Grammarly Integration
- High z-index (2147483647) to stay above Grammarly's UI
- Non-intrusive positioning to avoid overlapping
- Minimal DOM manipulation to prevent conflicts
- Respects existing text selection and cursor state

## Installation & Setup

### Prerequisites
- Chrome browser (version 88+)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Development Setup
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the project folder
5. Click the extension icon and enter your OpenAI API key

### Production Installation
1. Package the extension (zip all files)
2. Submit to Chrome Web Store (recommended)
3. Or distribute the .crx file directly

## File Structure

```
├── manifest.json          # Extension configuration
├── content.js            # Main content script for Google Docs
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Service worker
├── styles.css            # Styling for suggestion box
├── icons/                # Extension icons
└── README.md             # This file
```

## Configuration

### API Key Setup
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click the extension icon in Chrome
3. Enter your API key in the popup
4. Click "Test API Key" to verify
5. Save settings

### Toggle Options
- **Enable Autocomplete**: Turn the entire feature on/off
- **Show Suggestions**: Control suggestion visibility

## Usage

### In Google Docs
1. Open any Google Doc
2. Start typing (extension activates after 10+ characters)
3. Wait for suggestions to appear below your cursor
4. Use Tab to accept the first suggestion
5. Use arrow keys to navigate suggestions
6. Click any suggestion to accept it

### Keyboard Shortcuts
- **Tab**: Accept first suggestion
- **Arrow Down/Up**: Navigate through suggestions
- **Escape**: Hide suggestions

## API Integration

### OpenAI Configuration
- **Model**: GPT-3.5-turbo (configurable)
- **Max Tokens**: 150 per suggestion
- **Temperature**: 0.7 (balanced creativity)
- **System Prompt**: Optimized for writing continuation

### Request Format
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful writing assistant..."
    },
    {
      "role": "user", 
      "content": "Continue this text naturally: [user's text]"
    }
  ]
}
```

## Compatibility

### Browser Support
- ✅ Chrome 88+
- ✅ Edge 88+ (Chromium-based)
- ❌ Firefox (different extension API)
- ❌ Safari (different extension API)

### Google Docs Features
- ✅ Document editing
- ✅ Real-time collaboration
- ✅ Formatting and styling
- ✅ Comments and suggestions
- ✅ Version history

### Writing Tools
- ✅ Grammarly
- ✅ LanguageTool
- ✅ ProWritingAid
- ✅ Hemingway Editor

## Development

### Local Development
1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click "Reload" on your extension
4. Test in Google Docs

### Debugging
- Use Chrome DevTools on the extension popup
- Check background script logs in extension management
- Monitor content script in Google Docs DevTools

### Building for Production
1. Update version in `manifest.json`
2. Create production icons
3. Test thoroughly in different scenarios
4. Package for Chrome Web Store

## Troubleshooting

### Common Issues
- **Suggestions not appearing**: Check API key and internet connection
- **Conflicts with Grammarly**: Ensure extension is loaded after Grammarly
- **Performance issues**: Check for excessive API calls or DOM manipulation

### Debug Steps
1. Check Chrome DevTools console for errors
2. Verify API key is valid
3. Test in incognito mode
4. Check extension permissions

## Security & Privacy

- **API Key Storage**: Stored locally in Chrome sync storage
- **Data Processing**: Text sent to OpenAI for suggestions only
- **No Data Collection**: Extension doesn't collect or store user content
- **Secure Communication**: All API calls use HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

- **Issues**: Report bugs on GitHub
- **Feature Requests**: Use GitHub discussions
- **Documentation**: Check this README and inline code comments

## Roadmap

- [ ] Support for other writing platforms (Notion, Word Online)
- [ ] Custom suggestion styles and themes
- [ ] Advanced prompt customization
- [ ] Offline suggestion caching
- [ ] Multi-language support
- [ ] Team collaboration features

---

**Note**: This extension is designed as a proof of concept and may require additional testing and refinement for production use.
