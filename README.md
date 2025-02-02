# VS Code Security Scanner Extension

This Visual Studio Code extension is designed for security professionals who review large code bases with limited amount of time available. The extension employs customizable, pattern-based scanning mechanisms to systematically identify and highlight regions of code that exhibit potential security vulnerabilities. 

The primary objective of this extension is to reduce the time it takes to review a code base by highlighting potential security issues.

## Features

### Pattern-Based Security Scanning
- Scans your workspace for potential security issues using configurable patterns
- Create your own ruleset or download the [pattern library](https://github.com/CptAlessio/vscode-scanner/blob/main/pattern_library/settings.json) from Github, this ruleset is pre-configured to detect common security issues across different languages.
- The ruleset is accessible via `Preferences` > `Settings` > `Extensions` > `Security Scanner` > `settings.json` in Visual Studio Code and can be easily extended by the user. 
- Rules are stored in JSON format and are easily editable by the user, the extension will automatically reload the rules when the file is saved. The data structure of a rule is the following:

```json
{
    "name": "Rule Name",
    "pattern": "Rule Pattern",
    "description": "Rule Description"
}
```

### Interactive Results View
- Results displayed in a dedicated view in the VS Code explorer
- Click on findings to jump directly to the relevant code
- Line highlighting helps identify the exact location of potential issues


### Contextual Information
- Hover over highlighted code to see detailed descriptions of the security risk, you can customize the description in the [pattern library](https://github.com/CptAlessio/vscode-scanner/blob/main/pattern_library/settings.json) if you want to add more context to the findings

### Visual Indicators
- Clear visual highlighting of problematic code segments
- Light red background highlighting for easy identification
- Persistent highlighting until the file is closed

### Markdown Report Generation
- After scanning your codebase, you can generate a detailed security report in markdown format.
- The report summarizes the findings and provides context for each identified security issue.
- Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "Generate Security Report" to create the report after a scan is completed.

## Setup

1. Install the extension in VS Code by navigating to the extensions tab and clickinng on the three dots on the top right corner and then clicking on `Install from VSIX`
2. Select  `security-scanner-X.X.X.vsix`
3. The extension will be activated in your workspace

4. Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "Scan Code for Security Issues", alternatively you can click on the glass icon 🔍 in the activity bar on extension view to start a scan


### Configure Ruleset

- By default there are no patterns configured, you must configure the ruleset by opening the settings page and navigating to the **Security Scanner** section under `Visual Studio settings` -> `Extensions` -> `Security Scanner` -> `settings.json`   .
- To use the built in ruleset, copy paste the content of the [settings.json](https://github.com/CptAlessio/vscode-scanner/blob/main/pattern_library/settings.json)  file in the settings.json file and save the file.

## Security
- The extensions runs locally on your machine, no data is sent to any server at any time. Making it suitable for use on security sensitive projects.
