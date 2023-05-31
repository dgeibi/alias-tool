// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SCSSImportDefinitionProvider } from './SCSSImportDefinitionProvider';
import { SCSSDocumentLinkProvider } from './SCSSDocumentLinkProvider';
import { JSDefinitionProvider } from './JSDefinitionProvider';

export function activate(context: vscode.ExtensionContext) {
  const scssSelector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'scss',
  };
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      scssSelector,
      new SCSSImportDefinitionProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      scssSelector,
      new SCSSDocumentLinkProvider()
    )
  );

  const jsSelector: vscode.DocumentSelector = [
    {
      scheme: 'file',
      language: 'javascript',
    },
    {
      scheme: 'file',
      language: 'typescript',
    },
    {
      scheme: 'file',
      language: 'javascriptreact',
    },
    {
      scheme: 'file',
      language: 'typescriptreact',
    },
  ];
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      jsSelector,
      new JSDefinitionProvider()
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
