export type ChannelImageType = 'avatar' | 'banner';

export interface UploadChannelImageFile {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  sizeBytes: number;
}

export interface UploadChannelImageCommand {
  userId: string;
  imageType: ChannelImageType;
  file?: UploadChannelImageFile;
}
