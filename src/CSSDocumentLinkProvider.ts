import * as vscode from 'vscode';
import { getConfig } from './getConfig';
import { collectAssetLinks } from './collectAssetLinks';

export class CSSDocumentLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const config = getConfig(document);
    await Promise.all([
      collectAssetLinks(
        /(url\(\s*)['"]?(.+?)['"]?(\s*\))/g,
        text,
        document,
        links,
        config
      ),
      collectAssetLinks(
        /(@import\s+)['"](.+?)['"]/g,
        text,
        document,
        links,
        config
      ),
    ]);

    return links;
  }
}
