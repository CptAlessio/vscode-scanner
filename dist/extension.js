(()=>{"use strict";var e={265:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var r=Object.getOwnPropertyDescriptor(t,n);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,r)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),r=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&i(t,e,n);return r(t,e),t},s=this&&this.__awaiter||function(e,t,n,i){return new(n||(n=Promise))((function(r,o){function s(e){try{c(i.next(e))}catch(e){o(e)}}function a(e){try{c(i.throw(e))}catch(e){o(e)}}function c(e){var t;e.done?r(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(s,a)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.deactivate=t.activate=void 0;const a=o(n(398)),c=o(n(896)),d=o(n(928)),u=n(785),l=a.window.createTextEditorDecorationType({backgroundColor:"rgba(255, 0, 0, 0.2)",isWholeLine:!0});function p(){return a.workspace.getConfiguration("securityScanner").get("patterns")||[]}function f(e){return s(this,void 0,void 0,(function*(){const t=a.workspace.getConfiguration("securityScanner");yield t.update("patterns",e,a.ConfigurationTarget.Global)}))}function h(e){return s(this,void 0,void 0,(function*(){const t=yield a.window.showInputBox({prompt:"Enter pattern name",value:(null==e?void 0:e.name)||"",validateInput:e=>e?null:"Pattern name is required"});if(!t)return;const n=yield a.window.showInputBox({prompt:"Enter regex pattern",value:(null==e?void 0:e.pattern)||"",validateInput:e=>{try{return new RegExp(e),null}catch(e){return"Invalid regex pattern"}}});if(!n)return;const i=yield a.window.showInputBox({prompt:"Enter pattern description",value:(null==e?void 0:e.description)||"",validateInput:e=>e?null:"Description is required"});return i?{name:t,pattern:n,description:i}:void 0}))}function g(e){let t=0;const n=Math.min(e.length,1e3);for(let i=0;i<n;i++){const n=e.charCodeAt(i);(n<32&&![9,10,13].includes(n)||65533===n)&&t++}return t/n>.1}t.activate=function(e){const t=new u.SecurityTreeProvider;a.window.registerTreeDataProvider("securityScanner",t),e.subscriptions.push(a.commands.registerCommand("security-scanner.addPattern",(()=>s(this,void 0,void 0,(function*(){const e=yield h();if(e){const t=p();t.push(e),yield f(t),a.window.showInformationMessage(`Added security pattern: ${e.name}`)}})))),a.commands.registerCommand("security-scanner.editPattern",(()=>s(this,void 0,void 0,(function*(){const e=p(),t=yield a.window.showQuickPick(e.map((e=>({label:e.name,pattern:e}))),{placeHolder:"Select pattern to edit"});if(t){const n=yield h(t.pattern);if(n){const i=e.findIndex((e=>e.name===t.pattern.name));e[i]=n,yield f(e),a.window.showInformationMessage(`Updated security pattern: ${n.name}`)}}})))),a.commands.registerCommand("security-scanner.removePattern",(()=>s(this,void 0,void 0,(function*(){const e=p(),t=yield a.window.showQuickPick(e.map((e=>({label:e.name,pattern:e}))),{placeHolder:"Select pattern to remove"});if(t){const n=e.filter((e=>e.name!==t.pattern.name));yield f(n),a.window.showInformationMessage(`Removed security pattern: ${t.pattern.name}`)}})))),a.commands.registerCommand("security-scanner.copyFindingLocation",(e=>s(this,void 0,void 0,(function*(){if(e&&e.finding){const t=`${e.finding.file}:${e.finding.line}`;yield a.env.clipboard.writeText(t),a.window.showInformationMessage(`Copied location: ${t}`)}}))))),a.commands.registerCommand("security-scanner.openFile",(e=>{a.workspace.openTextDocument(e.file).then((t=>{a.window.showTextDocument(t).then((n=>{const i=new a.Range(e.line-1,0,e.line-1,e.match.length);n.selection=new a.Selection(i.start,i.end),n.revealRange(i);const r=new a.Range(e.line-1,0,e.line-1,Number.MAX_VALUE);n.setDecorations(l,[r]);const o=a.workspace.onDidCloseTextDocument((e=>{e.uri.toString()===t.uri.toString()&&(n.setDecorations(l,[]),o.dispose())}))}))}))}));const n=a.languages.registerHoverProvider({scheme:"file"},{provideHover(e,n,i){const r=t.getFindings(),o=n.line+1,s=r.find((t=>t.file===e.uri.fsPath&&t.line===o));if(s){const e=s.description||"Security issue detected";return new a.Hover(e)}return null}});e.subscriptions.push(n);let i=a.commands.registerCommand("security-scanner.scanCode",(()=>s(this,void 0,void 0,(function*(){try{const e=p();if(0===e.length)return void a.window.showWarningMessage("No security patterns configured. Add patterns in settings first.");const n=yield a.workspace.findFiles("**/*","**/node_modules/**");let i=[],r=0;const o=new Set([".dll",".exe",".obj",".bin",".cache",".pdb",".jpg",".jpeg",".png",".gif",".ico",".webp",".pdf",".zip",".tar",".gz",".7z",".rar",".mp3",".mp4",".avi",".mov",".wmv",".ttf",".otf",".woff",".woff2",".svg",".pyc",".pyo",".pyd",".md",".so",".resx",".dylib",".class"]);for(const t of n)try{const n=t.path.toLowerCase().split(".").pop();if(n&&o.has("."+n)){r++;continue}const s=(yield a.workspace.openTextDocument(t)).getText(),c=s.slice(0,1e3);if(c.includes("\0")||g(c)){r++;continue}const d=s.split("\n");e.forEach((({name:e,pattern:n,description:r})=>{const o=new RegExp(n);d.forEach(((n,s)=>{o.test(n)&&i.push(new u.SecurityFinding(e,t.fsPath,s+1,n.trim(),r))}))}))}catch(e){console.log(`Error scanning file ${t.fsPath}: ${e}`),r++}t.refresh(i),0===i.length?a.window.showInformationMessage(`No security patterns found. ${r} files were skipped.`):a.window.showInformationMessage(`Found ${i.length} security pattern matches. ${r} files were skipped.`)}catch(e){a.window.showErrorMessage("Error scanning code: "+e)}}))));e.subscriptions.push(i),e.subscriptions.push(a.commands.registerCommand("security-scanner.generateReport",(()=>{!function(e){var t;s(this,void 0,void 0,(function*(){try{const n=null===(t=a.workspace.workspaceFolders)||void 0===t?void 0:t[0];if(!n)throw new Error("No workspace folder found");const i=d.join(n.uri.fsPath,"security-reports");c.existsSync(i)||c.mkdirSync(i,{recursive:!0});const r=(new Date).toISOString().split("T")[0],o=d.join(i,`scan-report-${r}.md`),u=yield function(e){return s(this,void 0,void 0,(function*(){let t="# Security Scan Report\n\n";if(t+=`Generated on: ${(new Date).toLocaleString()}\n\n`,0===e.length)return t+="## No security issues found\n",t;t+=`## Summary\n\nTotal findings: ${e.length}\n\n`;const n=new Map;e.forEach((e=>{const t=n.get(e.name)||[];t.push(e),n.set(e.name,t)}));for(const[e,i]of n.entries()){t+=`## ${e}\n\n`,t+=`Found ${i.length} instance(s)\n\n`;for(const e of i){t+=`### ${e.name}\n\n`,t+=`**Location:** ${e.file}:${e.line}\n\n`,t+=`**Impact:** ${e.description||"No description available"}\n\n`;try{const n=(yield a.workspace.fs.readFile(a.Uri.file(e.file))).toString().split("\n"),i=Math.max(0,e.line-4),r=Math.min(n.length-1,e.line+2);t+="**Code Context:**\n\n```\n";for(let o=i;o<=r;o++)t+=`${o===e.line-1?"> ":"  "}${o+1}: ${n[o]}\n`;t+="```\n\n"}catch(e){t+="**Error:** Could not read file content\n\n"}}}return t}))}(e);c.writeFileSync(o,u);const l=yield a.workspace.openTextDocument(o);yield a.window.showTextDocument(l),a.window.showInformationMessage("Security report generated successfully")}catch(e){a.window.showErrorMessage("Error generating security report: "+e)}}))}(t.getFindings())})))},t.deactivate=function(){l.dispose()}},785:function(e,t,n){var i=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var r=Object.getOwnPropertyDescriptor(t,n);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,r)}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),r=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&i(t,e,n);return r(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.SecurityTreeProvider=t.SecurityFile=t.SecurityPattern=t.SecurityFinding=void 0;const s=o(n(398)),a=o(n(928));t.SecurityFinding=class{constructor(e,t,n,i,r){this.name=e,this.file=t,this.line=n,this.match=i,this.description=r}};class c extends s.TreeItem{constructor(e,t){super(`${e} (${t.length})`,t.length>0?s.TreeItemCollapsibleState.Collapsed:s.TreeItemCollapsibleState.None),this.label=e,this.findings=t,this.contextValue="pattern",this.tooltip=`${t.length} finding(s) for pattern: ${e}`,this.iconPath={light:s.Uri.file(a.join(__dirname,"..","resources","light","shield.svg")),dark:s.Uri.file(a.join(__dirname,"..","resources","dark","shield.svg"))}}}t.SecurityPattern=c;class d extends s.TreeItem{constructor(e){super(a.basename(e.file)),this.finding=e,this.description=`Line ${e.line}`,this.tooltip=`${e.match}\n\n${e.description||""}`,this.iconPath={light:s.Uri.file(a.join(__dirname,"..","resources","light","warning.svg")),dark:s.Uri.file(a.join(__dirname,"..","resources","dark","warning.svg"))},this.contextValue="finding",this.command={command:"security-scanner.openFile",title:"Open File",arguments:[e]},this.resourceUri=s.Uri.file(e.file)}}t.SecurityFile=d,t.SecurityTreeProvider=class{constructor(){this.findings=[],this._onDidChangeTreeData=new s.EventEmitter,this.onDidChangeTreeData=this._onDidChangeTreeData.event}getFindings(){return this.findings}refresh(e){this.findings=e,this._onDidChangeTreeData.fire(void 0)}getTreeItem(e){return e}getChildren(e){if(!e){const e=new Map;this.findings.forEach((t=>{const n=e.get(t.name)||[];n.push(t),e.set(t.name,n)}));const t=Array.from(e.entries()).map((([e,t])=>new c(e,t)));return Promise.resolve(t)}return e instanceof c?Promise.resolve(e.findings.map((e=>new d(e)))):Promise.resolve([])}}},398:e=>{e.exports=require("vscode")},896:e=>{e.exports=require("fs")},928:e=>{e.exports=require("path")}},t={},n=function n(i){var r=t[i];if(void 0!==r)return r.exports;var o=t[i]={exports:{}};return e[i].call(o.exports,o,o.exports,n),o.exports}(265);module.exports=n})();