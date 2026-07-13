export function getDriveImageUrl(idOrUrl?: string): string {
  if (!idOrUrl) return '';
  if (idOrUrl.includes('drive.google.com') && idOrUrl.includes('/d/')) {
    const match = idOrUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
  }
  if (idOrUrl.includes('drive.google.com/uc')) {
    return idOrUrl;
  }
  // If it's just an ID (no slashes)
  if (!idOrUrl.includes('/')) {
    return `https://drive.google.com/thumbnail?id=${idOrUrl}&sz=w1000`;
  }
  return idOrUrl;
}
