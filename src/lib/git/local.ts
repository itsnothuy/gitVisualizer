// File System Access API: prompt user to open a local repo folder
export async function pickLocalRepoDir(): Promise<FileSystemDirectoryHandle | null> {
  if (!("showDirectoryPicker" in window)) return null;
  return await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker(); // you’ll ask again for write when needed
}
