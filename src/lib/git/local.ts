// File System Access API: prompt user to open a local repo folder
export async function pickLocalRepoDir(): Promise<FileSystemDirectoryHandle | null> {
  if (!("showDirectoryPicker" in window)) return null;
  return await (window as any).showDirectoryPicker({ mode: "read" }); // you’ll ask again for write when needed
}
