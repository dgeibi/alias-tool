import { URI } from 'vscode-uri';
import * as vscode from 'vscode';

export async function fileExists(uri: string): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(URI.parse(uri));
    if (stat.type === vscode.FileType.Unknown && stat.size === -1) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
