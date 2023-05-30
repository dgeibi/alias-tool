// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SCSSImportDefinitionProvider } from './SCSSImportDefinitionProvider';
import { CustomDocumentLinkProvider } from './CustomDocumentLinkProvider';

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'scss',
  };
  const provider = new SCSSImportDefinitionProvider();
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, provider)
  );

  const linkProvider = new CustomDocumentLinkProvider();
  const registration = vscode.languages.registerDocumentLinkProvider(
    selector,
    linkProvider
  );
  context.subscriptions.push(registration);
}

// This method is called when your extension is deactivated
export function deactivate() {}
