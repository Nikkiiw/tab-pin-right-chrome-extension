# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension called "标签页固定器" (Tab Pinner) that allows users to pin tabs to the rightmost position in the browser tab bar. Unlike Chrome's built-in pinning feature, this extension maintains pinned tabs at the far right even when new tabs are created.

## Architecture

The extension follows Chrome Manifest V3 architecture with these key components:

- **manifest.json**: Extension configuration with required permissions (tabs, activeTab, storage)
- **background.js**: Service worker handling core tab management logic
- **popup.html**: User interface with toggle switch
- **popup.js**: Frontend logic for user interactions

### Core Functionality

1. **Tab Pinning**: Moves current active tab to the rightmost position
2. **State Persistence**: Uses chrome.storage.local to persist pinned tab IDs across browser sessions
3. **Auto-Rearrangement**: Listens for tab creation/update/removal events to maintain pinned tab positions
4. **Error Handling**: Gracefully handles tab movement failures and cleans up invalid tab references

### Key Technical Details

- **Tab Management**: Uses `chrome.tabs.query()` and `chrome.tabs.move()` APIs
- **State Storage**: Maintains pinned tab IDs in a Set object, synchronized with chrome.storage.local
- **Event Listeners**: 
  - `chrome.tabs.onCreated`: Rearranges pinned tabs when new tabs are created
  - `chrome.tabs.onUpdated`: Ensures pinned tabs maintain position after loading
  - `chrome.tabs.onRemoved`: Cleans up pinned tab references when tabs are closed
- **Message Passing**: Communication between popup and background via `chrome.runtime.sendMessage`

## Development Notes

### Testing the Extension
1. Load unpacked extension in Chrome via `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `tab-pin-right-chrome-extension` folder

### Common Issues
- **Extension失效问题**: The codebase includes solutions for extension失效 after 2 minutes (commit 70f169d) and general失效 issues (commit 09d44a5)
- **权限要求**: Requires tabs, activeTab, and storage permissions
- **浏览器重启**: Pinned tabs persist across browser restarts due to storage implementation

### File Structure
```
├── tab-pin-right-chrome-extension/
│   ├── manifest.json          # Extension configuration
│   ├── background.js          # Service worker with tab logic
│   ├── popup.html            # User interface
│   ├── popup.js              # Frontend logic
│   └── icon.png              # Extension icon
└── README.md                 # Project documentation
```

### Key Functions in background.js
- `pinTabToRight()`: Moves current tab to rightmost position
- `unpinTabs()`: Removes all pinned tabs
- `rearrangePinnedTabs()`: Maintains pinned tab positions
- `savePinnedTabIds()`: Persists state to chrome.storage
- `checkTabStatus()`: Checks if current tab is pinned