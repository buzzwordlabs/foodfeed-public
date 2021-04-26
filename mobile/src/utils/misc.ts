export const scrollToEnd = (ref: React.RefObject<any>, timeout?: number) =>
  setTimeout(
    () => ref && ref.current?.scrollToEnd({ animated: true }),
    timeout || 500
  );

export const getFileExtension = (fileName: string) =>
  fileName.substr(fileName.lastIndexOf(".") + 1);
