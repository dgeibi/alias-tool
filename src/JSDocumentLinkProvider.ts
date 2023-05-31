import * as vscode from 'vscode';
import { URI, Utils } from 'vscode-uri';
import { getMappings } from './getMappings';
import { escapeStringRegexp } from './escapeStringRegexp';
import { fileExists } from './fileExists';

export class JSDocumentLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();
    const { array: mappings, map } = getMappings(document);
    if (mappings.length !== 0) {
      const prefixs = mappings
        .map((item) => escapeStringRegexp(item.prefix))
        .join('|');
      await pushAliasImport(
        new RegExp(
          `(\\bimport\\s*.+\\s*\\bfrom\\b\\s*|\\bimport\\s*)['"](.+?)['"]`,
          'g'
        ),
        mappings.length !== 0 ? new RegExp(`^(${prefixs})\/`) : null,
        text,
        map,
        document,
        links
      );
    }

    return links;
  }
}

const jsExtensionReg = /\.(?:js|mjs|cjs|jsx|ts|tsx)$/;

async function pushAliasImport(
  regex: RegExp,
  regex1: RegExp | null,
  text: string,
  map: Record<string, string>,
  document: vscode.TextDocument,
  links: vscode.DocumentLink[]
) {
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const importPath = match[2];
    // ignore file without .ext and js files
    if (!importPath.includes('.') || jsExtensionReg.test(importPath)) {
      continue;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      let targetPath: URI | null = null;
      const result = regex1 && regex1.exec(importPath);
      if (result) {
        const pre = result[1];
        const target = map[pre];
        targetPath = Utils.joinPath(
          workspaceFolder.uri,
          target,
          importPath.replace(pre, '').replace(/\?.*/, '')
        );
      } else if (importPath.includes('?') && importPath[0] === '.') {
        // fix links with search
        targetPath = Utils.joinPath(
          document.uri,
          '..',
          importPath.replace(/\?.*/, '')
        );
      }
      if (targetPath && (await fileExists(targetPath.toString(true)))) {
        const prefixLength = match[1].length;
        const range = new vscode.Range(
          document.positionAt(match.index + prefixLength),
          document.positionAt(match.index + match[0].length)
        );
        const link = new vscode.DocumentLink(range, targetPath);
        links.push(link);
      }
    }
  }
}
