import React, { useRef, useState, useEffect } from "react"
import { ImagePlus, X } from "lucide-react"

export interface MediaItem {
  id: string;
  url: string;
}

interface MediaUploaderProps {
  maxFiles: number;
  onFilesUpdate: (files: File[]) => void;
  initialMedia?: MediaItem[];
  onMediaDelete?: (mediaId: string) => void;
}

interface LocalPreviewItemProps {
  file: File;
  onRemove: () => void;
}

const LocalPreviewItem: React.FC<LocalPreviewItemProps> = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/30 group">
      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-primary/10" />
      <div className="absolute bottom-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
        Nueva
      </div>
      <button 
        type="button"
        onClick={onRemove}
        aria-label="Eliminar nueva foto"
        className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  maxFiles, 
  onFilesUpdate, 
  initialMedia = [], 
  onMediaDelete 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalCount = initialMedia.length + selectedFiles.length + newFiles.length;
      
      if (totalCount > maxFiles) {
        alert(`Has superado el límite máximo de ${maxFiles} archivos.`);
        return;
      }

      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFilesUpdate(updatedFiles);
    }
  };

  const removeLocalFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesUpdate(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div 
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
          <ImagePlus size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Haz clic o arrastra tus fotos aquí</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Soporta JPG, PNG. Límite: {maxFiles} archivos.
        </p>
        <input 
          type="file" 
          multiple 
          accept="image/*"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {(initialMedia.length > 0 || selectedFiles.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Imágenes ya subidas (Supabase) */}
          {initialMedia.map((media) => (
            <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img src={media.url} alt="Inmueble" className="w-full h-full object-cover" />
              {onMediaDelete && (
                <button 
                  type="button"
                  onClick={() => onMediaDelete(media.id)}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Eliminar foto guardada"
                  title="Eliminar foto guardada"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          {/* Imágenes locales pendientes de subir */}
          {selectedFiles.map((file, index) => (
            <LocalPreviewItem
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              onRemove={() => removeLocalFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
