export const downloadBlob = async (blob: Blob, filename: string): Promise<void> => {
  try {
    const fileSaver = await import('file-saver');
    const saveAs = (fileSaver as any).saveAs || (fileSaver as any).default || fileSaver;
    if (typeof saveAs === 'function') {
      saveAs(blob, filename);
      return;
    }
  } catch (e) {
    console.warn('file-saver dynamic import failed, using DOM fallback', e);
  }

  // DOM fallback
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
};
