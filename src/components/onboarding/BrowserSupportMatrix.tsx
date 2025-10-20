"use client";

/**
 * Browser Support Matrix Component
 * 
 * Displays a clear table showing which features are supported
 * in different browsers and the recommended ingestion method.
 */

import * as React from "react";
import { CheckCircleIcon, XCircleIcon, InfoIcon } from "lucide-react";
import { getBrowserCapabilities, getBrowserName } from "@/lib/git/capabilities";

interface BrowserFeature {
  browser: string;
  directFolder: boolean;
  folderUpload: boolean;
  zipUpload: boolean;
  recommended: string;
}

const BROWSER_MATRIX: BrowserFeature[] = [
  {
    browser: "Chrome 86+",
    directFolder: true,
    folderUpload: true,
    zipUpload: true,
    recommended: "Direct Folder Access",
  },
  {
    browser: "Edge 86+",
    directFolder: true,
    folderUpload: true,
    zipUpload: true,
    recommended: "Direct Folder Access",
  },
  {
    browser: "Firefox 90+",
    directFolder: false,
    folderUpload: true,
    zipUpload: true,
    recommended: "Folder Upload",
  },
  {
    browser: "Safari 15.2+",
    directFolder: false,
    folderUpload: true,
    zipUpload: true,
    recommended: "Folder Upload",
  },
];

export function BrowserSupportMatrix() {
  const capabilities = getBrowserCapabilities();
  const currentBrowser = getBrowserName();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md" role="status">
        <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p className="font-semibold mb-1">Your Browser: {currentBrowser}</p>
          <p className="text-xs">
            {capabilities.fileSystemAccess
              ? "✓ File System Access API supported - best experience available"
              : "File System Access API not supported - fallback methods available"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" role="table">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold" scope="col">
                Browser
              </th>
              <th className="text-center p-2 font-semibold" scope="col">
                Direct Folder
              </th>
              <th className="text-center p-2 font-semibold" scope="col">
                Folder Upload
              </th>
              <th className="text-center p-2 font-semibold" scope="col">
                ZIP Upload
              </th>
              <th className="text-left p-2 font-semibold" scope="col">
                Recommended
              </th>
            </tr>
          </thead>
          <tbody>
            {BROWSER_MATRIX.map((browser) => (
              <tr key={browser.browser} className="border-b hover:bg-muted/50">
                <td className="p-2">{browser.browser}</td>
                <td className="text-center p-2">
                  {browser.directFolder ? (
                    <CheckCircleIcon
                      className="h-5 w-5 text-green-600 dark:text-green-400 inline"
                      aria-label="Supported"
                    />
                  ) : (
                    <XCircleIcon
                      className="h-5 w-5 text-red-600 dark:text-red-400 inline"
                      aria-label="Not supported"
                    />
                  )}
                </td>
                <td className="text-center p-2">
                  {browser.folderUpload ? (
                    <CheckCircleIcon
                      className="h-5 w-5 text-green-600 dark:text-green-400 inline"
                      aria-label="Supported"
                    />
                  ) : (
                    <XCircleIcon
                      className="h-5 w-5 text-red-600 dark:text-red-400 inline"
                      aria-label="Not supported"
                    />
                  )}
                </td>
                <td className="text-center p-2">
                  {browser.zipUpload ? (
                    <CheckCircleIcon
                      className="h-5 w-5 text-green-600 dark:text-green-400 inline"
                      aria-label="Supported"
                    />
                  ) : (
                    <XCircleIcon
                      className="h-5 w-5 text-red-600 dark:text-red-400 inline"
                      aria-label="Not supported"
                    />
                  )}
                </td>
                <td className="p-2 text-xs text-muted-foreground">
                  {browser.recommended}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">Notes:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>Direct Folder:</strong> Best experience with File System Access API
          </li>
          <li>
            <strong>Folder Upload:</strong> Uses webkitdirectory for browsers without FSA
          </li>
          <li>
            <strong>ZIP Upload:</strong> Universal fallback, works in all modern browsers
          </li>
        </ul>
      </div>
    </div>
  );
}
