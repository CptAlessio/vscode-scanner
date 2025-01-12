# VS Code Security Scanner Extension

A Visual Studio Code extension that scans your codebase for potential security issues using customizable patterns. The extension helps developers identify security concerns during development by highlighting potentially sensitive information in the code.

## Features

### 🔍 Pattern-Based Security Scanning
- Scans your workspace for potential security issues using configurable patterns
- Comes with pre-configured patterns to detect common security concerns
- Easily extensible with custom patterns

### 🎯 Interactive Results View
- Results displayed in a dedicated Security Scanner view in the VS Code explorer
- Click on findings to jump directly to the relevant code
- Line highlighting helps identify the exact location of potential issues

### 💡 Contextual Information
- Hover over highlighted code to see detailed descriptions of the security concerns
- Get recommendations on how to address the identified issues
- Learn about security best practices through contextual hints

### 🚨 Visual Indicators
- Clear visual highlighting of problematic code segments
- Light red background highlighting for easy identification
- Persistent highlighting until the file is closed

## Setup

1. Install the extension in VS Code
2. The extension will be activated in your workspace
3. Use the command palette (Ctrl+Shift+P / Cmd+Shift+P) and search for "Scan Code for Security Issues"

## Configuration

### Security Scanner Settings
The security ruleset is now accessible via **Preferences > Settings > Security Scanner** in Visual Studio Code. Users can customize their patterns for code detection, allowing for tailored security scanning based on specific project needs. 

Additionally, a comprehensive ruleset is provided in the repository under `/pattern_library/settings.json`, which users can utilize out of the box to enhance their security scanning capabilities. 