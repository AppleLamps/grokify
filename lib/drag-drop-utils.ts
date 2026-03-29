export function hasFilesInTransfer(dataTransfer: DataTransfer | null | undefined): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types ?? []).includes('Files');
}

export function getDroppedFiles(dataTransfer: DataTransfer | null | undefined): File[] {
  if (!dataTransfer?.files) return [];
  return Array.from(dataTransfer.files);
}
