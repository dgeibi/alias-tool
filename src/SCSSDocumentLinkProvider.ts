import * as vscode from 'vscode';
import { getConfig } from './getConfig';
import { collectAssetLinks } from './collectAssetLinks';
import { resolveSCSS } from './resolveAsset';

export class SCSSDocumentLinkProvider implements vscode.DocumentLinkProvider {
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
        /(@(?:import|use|forward)\s+)['"](.+?)['"]/g,
        text,
        document,
        links,
        config,
        () => false,
        resolveSCSS
      ),
    ]);
    return links;
  }
}
