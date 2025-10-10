import * as git from "isomorphic-git";
import http from "isomorphic-git/http/web";        // ✅ required in browser
import LightningFS from "@isomorphic-git/lightning-fs";

export async function shallowClone(url: string, depth = 50) {
  const fs = new (LightningFS as any)("gitfs");
  const pfs = fs.promises;
  const dir = "/repo";
  await pfs.mkdir(dir).catch(() => {});
  await git.clone({
    fs,                 // ✅ pass the fs client
    http,               // ✅ transport for browsers
    dir,
    url,
    depth,
    singleBranch: true,
    // optionally: corsProxy: "https://your-cors-proxy.example"
  });
  return { fs: pfs, dir };
}
