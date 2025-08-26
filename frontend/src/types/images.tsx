export interface UploadImageData {
  file: string;
  filename: string;
  content_type: string;
  folder: string;
}

export interface UploadImageResponse {
  success: true;
  message: string;
  file_url: string;
  file_key: string;
  uploaded_at: string;
}
