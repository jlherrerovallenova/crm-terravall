import React from "react"
import { ImagePlus } from "lucide-react"

export const MediaUploader: React.FC<{ maxFiles: number, onFilesUpdate: (files: File[]) => void }> = ({ maxFiles }) => {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
        <ImagePlus size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Arrastra tus fotos o vídeos aquí</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Soporta JPG, PNG, MP4. Límite Idealista: máximo {maxFiles} archivos. 
        Puedes reordenarlos arrastrando después de subirlos.
      </p>
      <input type="file" multiple className="hidden" />
    </div>
  )
}
