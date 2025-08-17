# AI Writing Assistant Chrome Extension

A smart Chrome extension that provides AI-powered autocomplete suggestions in Google Docs, designed to work seamlessly alongside Grammarly and other writing tools. Built with TypeScript and modern build tools.

## Goal

This extension eliminates the need to manually prompt ChatGPT for writing suggestions by automatically providing contextual autocomplete recommendations as you type in Google Docs. It's specifically designed to work well with Google Docs' complex DOM structure and play nice with Grammarly.

## Key Features

- **Automatic Suggestions**: Get intelligent writing suggestions without interrupting your flow
- **Google Docs Integration**: Seamlessly works within Google Docs' interface
- **Grammarly Compatible**: Designed to coexist with Grammarly without conflicts
- **Context-Aware**: Suggestions based on your current writing context and style
- **Powered by ChatGPT**: Leverages OpenAI's advanced language model
- **Real-time Analysis**: Monitors text changes and provides suggestions as you write
- **TypeScript**: Full type safety and modern development experience
- **Comprehensive Testing**: Unit tests with Jest and comprehensive test coverage

## How It Works

1. **Text Monitoring**: Uses MutationObserver to monitor text changes in Google Docs
2. **Context Analysis**: Analyzes your current text and cursor position
3. **AI Suggestions**: Sends context to OpenAI's API for intelligent completions
4. **Smart Display**: Shows suggestions in a non-intrusive dropdown near your cursor
5. **Easy Integration**: Accept suggestions with Tab key or mouse clicks

## Technical Implementation

### Architecture
- **TypeScript**: Full type safety and modern JavaScript features
- **Manifest V3**: Modern Chrome extension architecture
- **Webpack**: Module bundling and build optimization
- **Content Scripts**: Injected into Google Docs pages
- **Background Service Worker**: Handles extension lifecycle and communication
- **Chrome Storage API**: Securely stores user preferences and API keys

### Build System
- **TypeScript Compiler**: Strict type checking and modern ES2020 features
- **Webpack 5**: Modern bundling with optimization
- **ESLint**: Code quality and consistency
- **Jest**: Comprehensive unit testing framework
- **Source Maps**: Debugging support for production builds

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

## Development Setup

### Prerequisites
- **Node.js**: Version 16+ (LTS recommended)
- **npm**: Version 8+ (comes with Node.js)
- **Chrome browser**: Version 88+
- **OpenAI API key**: [Get one here](https://platform.openai.com/api-keys)

### Quick Start
```bash
# Clone the repository
git clone <your-repo-url>
cd ai-writing-assistant

# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test

# Development mode with watch
npm run watch
```

### Build Commands
```bash
# Production build
npm run build

# Development build
npm run build:dev

# Watch mode for development
npm run watch

# Clean build directory
npm run clean
```

### Testing Commands
```bash
# Run all tests
npm test

# Watch mode for tests
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking only
npm run type-check

# Lint code
npm run lint
```

### Scripts
```bash
# Build scripts
./scripts/build.sh          # Production build
./scripts/build.sh --dev    # Development build

# Test scripts
./scripts/test.sh           # Run tests
./scripts/test.sh --watch   # Watch mode
./scripts/test.sh --coverage # With coverage
./scripts/test.sh --verbose # Verbose output
```

## Installation & Setup

### Development Installation
1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `dist` folder
5. Click the extension icon and enter your OpenAI API key

### Production Installation
1. Build for production: `npm run build`
2. Package the `dist` folder contents
3. Submit to Chrome Web Store (recommended)
4. Or distribute the .crx file directly

## File Structure

```
├── src/                    # TypeScript source files
│   ├── content.ts         # Main content script
│   ├── popup.ts           # Popup functionality
│   ├── background.ts      # Service worker
│   ├── types.ts           # Type definitions
│   ├── popup.html         # Extension popup interface
│   └── styles.css         # Styling for suggestion box
├── tests/                  # Test files
│   ├── setup.ts           # Jest test setup
│   ├── content.test.ts    # Content script tests
│   ├── popup.test.ts      # Popup tests
│   ├── background.test.ts # Background script tests
│   └── utils.test.ts      # Utility function tests
├── dist/                   # Built extension (generated)
├── scripts/                # Build and test scripts
├── manifest.json           # Extension configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── webpack.config.js      # Webpack build configuration
├── jest.config.js         # Jest test configuration
├── .eslintrc.js           # ESLint configuration
└── README.md               # This file
```

## Configuration

### TypeScript Configuration
- **Target**: ES2020 for modern browser support
- **Strict Mode**: Enabled for type safety
- **Source Maps**: Generated for debugging
- **Declaration Files**: Generated for type definitions

### Webpack Configuration
- **Entry Points**: Separate bundles for content, popup, and background
- **TypeScript Loader**: Handles .ts file compilation
- **Copy Plugin**: Copies static assets to dist folder
- **Source Maps**: Generated for debugging

### Jest Configuration
- **Test Environment**: jsdom for DOM testing
- **TypeScript Support**: ts-jest for .ts file testing
- **Coverage**: HTML, LCOV, and text reports
- **Setup Files**: Custom test environment configuration

## Testing

### Test Coverage
- **Content Script**: Text monitoring, AI suggestions, DOM manipulation
- **Popup**: Settings management, API key validation, form handling
- **Background**: Service worker lifecycle, message handling
- **Utilities**: HTML escaping, validation, error handling

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- content.test.ts

# Run tests with verbose output
npm test -- --verbose
```

### Test Structure
- **Unit Tests**: Individual function and class testing
- **Integration Tests**: Component interaction testing
- **Mock Objects**: Chrome API and DOM mocking
- **Test Utilities**: Common test setup and helpers

## API Integration

### OpenAI Configuration
- **Model**: GPT-3.5-turbo (configurable)
- **Max Tokens**: 150 per suggestion
- **Temperature**: 0.7 (balanced creativity)
- **System Prompt**: Optimized for writing continuation

### Request Format
```typescript
interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
}
```

## Development Workflow

### Local Development
1. Make changes to TypeScript source files
2. Run tests: `npm test`
3. Build extension: `npm run build:dev`
4. Reload extension in Chrome
5. Test in Google Docs

### Debugging
- **Source Maps**: Generated for debugging in Chrome DevTools
- **Console Logs**: Available in extension background and content scripts
- **Test Coverage**: Identify untested code paths
- **Type Checking**: Catch errors at compile time

### Code Quality
- **ESLint**: Enforce coding standards
- **TypeScript**: Compile-time error checking
- **Prettier**: Code formatting (optional)
- **Husky**: Pre-commit hooks (optional)

## Troubleshooting

### Build Issues
- **Type Errors**: Run `npm run type-check` to identify issues
- **Dependencies**: Ensure `npm install` completed successfully
- **Node Version**: Use Node.js 16+ for compatibility

### Test Issues
- **Mock Setup**: Check `tests/setup.ts` for proper mocking
- **Environment**: Ensure Jest environment is properly configured
- **Async Tests**: Use proper async/await patterns

### Runtime Issues
- **Console Errors**: Check Chrome DevTools for error messages
- **Permissions**: Verify extension permissions in Chrome
- **API Key**: Ensure OpenAI API key is valid and configured

## Contributing

### Development Setup
1. Fork the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Make your changes
5. Add tests for new functionality
6. Ensure all tests pass
7. Submit a pull request

### Code Standards
- **TypeScript**: Use strict typing
- **Testing**: Maintain high test coverage
- **Documentation**: Update README and inline comments
- **Linting**: Ensure ESLint passes

## License

[Add your license here]

## Support

- **Issues**: Report bugs on GitHub
- **Feature Requests**: Use GitHub discussions
- **Documentation**: Check this README and inline code comments
- **Testing**: Run `npm test` to verify functionality

## Roadmap

- [ ] Support for other writing platforms (Notion, Word Online)
- [ ] Custom suggestion styles and themes
- [ ] Advanced prompt customization
- [ ] Offline suggestion caching
- [ ] Multi-language support
- [ ] Team collaboration features
- [ ] Performance optimization
- [ ] Accessibility improvements

---

**Note**: This extension is built with TypeScript and modern development tools for maintainability and reliability. The comprehensive test suite ensures functionality works correctly across different scenarios.
