import * as vscode from 'vscode';
import { type Configuration } from './getConfig';
import { collectImportPaths } from './collectImportPaths';
import { URI } from 'vscode-uri';

export async function collectAssetLinks(
  regex: RegExp,
  text: string,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[],
  config: Configuration,
  ignoreImportPath?: (path: string) => boolean,
  resolve?: (
    importPath: string,
    config: Configuration,
    document: vscode.TextDocument,
    resolver?: (path: string) => Promise<URI | null>
  ) => Promise<URI | null>
) {
  const pathInfos = await collectImportPaths(
    regex,
    text,
    document,
    config,
    ignoreImportPath,
    resolve
  );
  pathInfos.forEach((item) => {
    links.push(
      new vscode.DocumentLink(
        new vscode.Range(
          document.positionAt(item.range[0]),
          document.positionAt(item.range[1])
        ),
        item.uri
      )
    );
  });
}
