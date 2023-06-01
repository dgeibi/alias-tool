export function normalizeImportPath(importPath: string) {
  return importPath.replace(/\?.*/, '');
}
