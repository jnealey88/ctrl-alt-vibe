import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { X, Upload, ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProjectGalleryImage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface GalleryFile {
  id: string;
  file: File;
  preview: string;
  caption?: string;
  isNew: boolean;
}

interface ExistingGalleryImage extends ProjectGalleryImage {
  preview: string;
  toDelete?: boolean;
}

interface GalleryUploaderProps {
  onGalleryChange: (files: File[], captions: string[]) => void;
  existingImages?: ProjectGalleryImage[];
  projectId?: number;
  onExistingImagesChange?: (images: ProjectGalleryImage[]) => void;
  maxImages?: number;
  className?: string;
}

const GalleryUploader = ({ 
  onGalleryChange, 
  existingImages = [], 
  projectId,
  onExistingImagesChange,
  maxImages = 5, 
  className = '' 
}: GalleryUploaderProps) => {
  const { toast } = useToast();
  const [galleryFiles, setGalleryFiles] = useState<GalleryFile[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<ExistingGalleryImage[]>([]);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load existing images when they change
  useEffect(() => {
    // Convert ProjectGalleryImage[] to ExistingGalleryImage[]
    const images: ExistingGalleryImage[] = existingImages.map(img => ({
      ...img,
      // Add preview URL for display
      preview: img.imageUrl
    }));
    
    setExistingGalleryImages(images);
    console.log(`Loaded ${images.length} existing gallery images`);
  }, [existingImages]);
  
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
      caption: '',
      isNew: true
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
  
  // Handle marking existing image for deletion
  const markExistingImageForDeletion = (imageId: number) => {
    if (!onExistingImagesChange) return;
    
    const updatedExistingImages = existingGalleryImages.map(img => 
      img.id === imageId ? { ...img, toDelete: true } : img
    );
    
    setExistingGalleryImages(updatedExistingImages);
    
    // Notify parent component of the images that are not marked for deletion
    const imagesToKeep = updatedExistingImages.filter(img => !img.toDelete);
    if (onExistingImagesChange) {
      onExistingImagesChange(imagesToKeep);
    }
  };
  
  // Update caption for existing gallery image
  const updateExistingCaption = (imageId: number, caption: string) => {
    if (!onExistingImagesChange) return;
    
    const updatedExistingImages = existingGalleryImages.map(img => 
      img.id === imageId ? { ...img, caption } : img
    );
    
    setExistingGalleryImages(updatedExistingImages);
    
    if (onExistingImagesChange) {
      onExistingImagesChange(updatedExistingImages.filter(img => !img.toDelete));
    }
  };
  
  // Calculate total current images (new + existing that aren't marked for deletion)
  const totalImages = galleryFiles.length + existingGalleryImages.filter(img => !img.toDelete).length;
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Label htmlFor="gallery-upload" className="text-sm font-medium">Project Gallery Images</Label>
        <span className="text-xs text-gray-500">{totalImages}/{maxImages} images</span>
      </div>
      
      {/* Gallery preview - show both existing and new images */}
      {(galleryFiles.length > 0 || existingGalleryImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-4">
          {/* Existing images */}
          {existingGalleryImages.filter(img => !img.toDelete).map(image => (
            <div key={`existing-${image.id}`} className="relative group rounded-md overflow-hidden border border-border hover:border-primary transition-all">
              <div className="aspect-square w-full relative">
                <img 
                  src={image.imageUrl} 
                  alt={image.caption || "Gallery image"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Set a fallback image if the image fails to load
                    e.currentTarget.src = '/ctrlaltvibelogo.png';
                    e.currentTarget.classList.add('object-contain', 'p-4');
                    e.currentTarget.classList.remove('object-cover');
                  }}
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white hover:bg-gray-100"
                      onClick={() => setEditingCaptionId(`existing-${image.id}`)}
                    >
                      <Pencil className="h-4 w-4 text-gray-700" />
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => markExistingImageForDeletion(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editingCaptionId === `existing-${image.id}` && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="w-full space-y-2">
                      <Input
                        type="text"
                        placeholder="Add a caption"
                        className="bg-white/90"
                        value={image.caption || ''}
                        onChange={(e) => updateExistingCaption(image.id, e.target.value)}
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
              
              {image.caption && editingCaptionId !== `existing-${image.id}` && (
                <div className="p-2 text-xs truncate text-gray-700">
                  {image.caption}
                </div>
              )}
            </div>
          ))}
          
          {/* New images */}
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
          {totalImages < maxImages && (
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
      {totalImages === 0 && (
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