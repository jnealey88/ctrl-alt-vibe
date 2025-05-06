import { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, ImagePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface GalleryFile {
  id: string;
  file: File;
  preview: string;
  caption?: string;
}

interface GalleryUploaderProps {
  onGalleryChange: (files: File[], captions: string[]) => void;
  maxImages?: number;
  className?: string;
}

const GalleryUploader = ({ onGalleryChange, maxImages = 5, className = '' }: GalleryUploaderProps) => {
  const { toast } = useToast();
  const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // When files are selected
  const handleGalleryFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Check if adding these files would exceed the limit
    if (galleryFiles.length + selectedFiles.length > maxImages) {
      toast({
        title: `Maximum ${maxImages} images allowed`,
        description: `You can only upload up to ${maxImages} images in total.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const validType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const validSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!validType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`,
          variant: "destructive"
        });
      }
      
      if (!validSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB limit.`,
          variant: "destructive"
        });
      }
      
      return validType && validSize;
    });
    
    // Create new gallery file objects with previews
    const newGalleryFiles = validFiles.map(file => ({
      id: `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      caption: ''
    }));
    
    // Add to existing gallery files
    const updatedGalleryFiles = [...galleryFiles, ...newGalleryFiles];
    setGalleryFiles(updatedGalleryFiles);
    
    // Reset the file input to allow the same file to be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notify parent component
    notifyGalleryChange(updatedGalleryFiles);
  };
  
  // Remove a file from the gallery
  const removeGalleryFile = (id: string) => {
    // Revoke object URL to avoid memory leaks
    const fileToRemove = galleryFiles.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const updatedFiles = galleryFiles.filter(f => f.id !== id);
    setGalleryFiles(updatedFiles);
    
    // Notify parent component
    notifyGalleryChange(updatedFiles);
  };
  
  // Update caption for a gallery image
  const updateCaption = (id: string, caption: string) => {
    const updatedFiles = galleryFiles.map(f => 
      f.id === id ? { ...f, caption } : f
    );
    setGalleryFiles(updatedFiles);
    
    // Notify parent component
    notifyGalleryChange(updatedFiles);
  };
  
  // Helper to send updated data to parent component
  const notifyGalleryChange = (files: GalleryFile[]) => {
    onGalleryChange(
      files.map(f => f.file),
      files.map(f => f.caption || '')
    );
  };
  
  // Clean up object URLs when component unmounts
  const cleanupPreviews = () => {
    galleryFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Label htmlFor="gallery-upload" className="text-sm font-medium">Project Gallery Images</Label>
        <span className="text-xs text-gray-500">{galleryFiles.length}/{maxImages} images</span>
      </div>
      
      {/* Gallery preview */}
      {galleryFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-4">
          {galleryFiles.map(file => (
            <div key={file.id} className="relative group rounded-md overflow-hidden border border-border hover:border-primary transition-all">
              <div className="aspect-square w-full relative">
                <img 
                  src={file.preview} 
                  alt={file.caption || "Gallery image"}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white hover:bg-gray-100"
                      onClick={() => setEditingCaptionId(file.id)}
                    >
                      <Pencil className="h-4 w-4 text-gray-700" />
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => removeGalleryFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editingCaptionId === file.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full space-y-2">
                      <Input
                        type="text"
                        placeholder="Add a caption"
                        className="bg-white/90"
                        value={file.caption || ''}
                        onChange={(e) => updateCaption(file.id, e.target.value)}
                        autoFocus
                      />
                      <Button 
                        type="button"
                        variant="secondary" 
                        className="w-full text-xs"
                        onClick={() => setEditingCaptionId(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {file.caption && editingCaptionId !== file.id && (
                <div className="p-2 text-xs truncate text-gray-700">
                  {file.caption}
                </div>
              )}
            </div>
          ))}
          
          {/* Add more images button */}
          {galleryFiles.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center p-4 hover:border-primary transition-colors text-gray-500 hover:text-primary"
            >
              <ImagePlus className="h-8 w-8 mb-2" />
              <span className="text-xs font-medium">Add Image</span>
            </button>
          )}
        </div>
      )}
      
      {/* Upload button and input */}
      {galleryFiles.length === 0 && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">Add gallery images</p>
          <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, or WebP up to 5MB each</p>
        </div>
      )}
      
      <Input
        id="gallery-upload"
        ref={fileInputRef}
        type="file"
        onChange={handleGalleryFiles}
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
      />
    </div>
  );
};

export default GalleryUploader;