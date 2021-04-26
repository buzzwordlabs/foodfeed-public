export const getMimeCategory = (mimeType: string) => {
  return mimeType.split('/')[0];
};
