import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { getMappings } from "./getMappings";
import { escapeStringRegexp } from "./escapeStringRegexp";
import { fileExists } from "./fileExists";

export class JSDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | undefined> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return undefined;
    }
    const line = document.lineAt(position);
    const importRegex =
      /(\bimport\s*.+\s*\bfrom\b\s*|\bimport\s*)['"](.+?)['"]/;
    const match = importRegex.exec(line.text);
    const originImportPath = match && match[2];
    if (!originImportPath) {
      return undefined;
    }
    if (isIgnore(originImportPath)) {
      return undefined;
    }
    const config = getMappings(document);
    const prefixRegExp = getPrefixRegExp(config);
    const targetUri = await resolve(
      originImportPath,
      prefixRegExp,
      config.map,
      document,
      workspaceFolder
    );
    if (targetUri) {
      const range = new vscode.Range(0, 0, 0, 0);
      return new vscode.Location(targetUri, range);
    }
  }
}

function getPrefixRegExp(config: {
  map: Record<string, string>;
  array: {
    prefix: string;
    target: string;
  }[];
}) {
  return config.array.length !== 0
    ? new RegExp(
        `^(${config.array
          .map((item) => escapeStringRegexp(item.prefix))
          .join("|")})\/`
      )
    : null;
}

async function resolve(
  importPath: string,
  prefixRegExp: RegExp | null,
  map: Record<string, string>,
  document: vscode.TextDocument,
  workspaceFolder: vscode.WorkspaceFolder
) {
  let targetUri: URI | null = null;
  const result = prefixRegExp && prefixRegExp.exec(importPath);
  if (result) {
    const pre = result[1];
    const target = map[pre];
    targetUri = Utils.joinPath(
      workspaceFolder.uri,
      target,
      importPath.replace(pre, "").replace(/\?.*/, "")
    );
  } else if (isWithSearch(importPath)) {
    // fix links with search
    targetUri = Utils.joinPath(
      document.uri,
      "..",
      importPath.replace(/\?.*/, "")
    );
  }
  if (targetUri && (await fileExists(targetUri.toString(true)))) {
    return targetUri;
  }
  return null;
}

function isWithSearch(importPath: string) {
  return importPath.includes("?") && importPath[0] === ".";
}

const jsExtensionReg = /\.(?:js|mjs|cjs|jsx|ts|tsx)$/;
// ignore file without .ext and js files
function isIgnore(importPath: string) {
  return !importPath.includes(".") || jsExtensionReg.test(importPath);
}
