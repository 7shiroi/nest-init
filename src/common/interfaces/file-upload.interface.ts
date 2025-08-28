export interface FileUpload {
  /**
   * Base64 encoded data of the file, including the data URI prefix
   * e.g., "data:image/png;base64,..."
   */
  base64Data: string;
  mimeType: string;
}

/**
 * Interface for the response after a file is uploaded
 */
export interface FileUploadResponse {
  assetId: string;
  url: string;
  mimeType: string;
  size: number;
}
