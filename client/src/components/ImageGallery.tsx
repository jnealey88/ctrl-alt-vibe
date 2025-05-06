import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { ProjectGalleryImage } from '@shared/schema';

interface GalleryImage {
  id: number;
  projectId: number;
  imageUrl: string;
  displayOrder: number;
  caption: string | null;
  createdAt: string | Date;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  mainImageUrl?: string;
}

const ImageGallery = ({ images, mainImageUrl }: ImageGalleryProps) => {
  const mainImageObj: GalleryImage = { 
    id: 0, 
    projectId: 0, 
    imageUrl: mainImageUrl || '', 
    displayOrder: -1, 
    caption: 'Main image', 
    createdAt: '' 
  };
  
  const allImages = mainImageUrl ? [mainImageObj, ...images] : images;
    
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  if (!allImages || allImages.length === 0) {
    return null;
  }
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === allImages.length - 1 ? 0 : prevIndex + 1));
  };
  
  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? allImages.length - 1 : prevIndex - 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    setIsDialogOpen(true);
  };
  
  const currentImage = allImages[currentIndex];
  
  return (
    <div className="w-full space-y-4">
      {/* Main gallery display */}
      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
        {allImages.map((image, index) => (
          <div 
            key={image.id || `image-${index}`}
            className={`group cursor-pointer relative rounded-lg overflow-hidden border hover:border-primary transition-all ${index === 0 ? 'col-span-4 md:col-span-3 row-span-2' : 'col-span-2 md:col-span-1'}`}
            onClick={() => handleThumbnailClick(index)}
          >
            <img 
              src={image.imageUrl} 
              alt={image.caption || `Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image
                e.currentTarget.src = '/ctrlaltvibelogo.png';
                e.currentTarget.classList.add('object-contain', 'p-3');
                e.currentTarget.classList.remove('object-cover');
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button variant="secondary" size="sm" className="bg-white/80 hover:bg-white">
                <ExternalLink className="h-4 w-4 mr-1" /> View
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Lightbox dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] min-h-[50vh] md:min-h-[70vh] max-h-[90vh] p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full h-full bg-black/95 rounded-lg flex flex-col items-center justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 rounded-full text-white hover:bg-black/50 z-50" 
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="w-full h-full flex items-center justify-center p-4 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-2 z-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img 
                  src={currentImage.imageUrl} 
                  alt={currentImage.caption || `Gallery image ${currentIndex + 1}`} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 z-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            {currentImage.caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2 px-4">
                {currentImage.caption}
              </div>
            )}
            
            <div className="absolute bottom-14 left-0 right-0 flex justify-center space-x-1 px-4">
              {allImages.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white scale-125' : 'bg-gray-400'}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGallery;