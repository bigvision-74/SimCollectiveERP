import React, { useEffect, useState } from "react";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide"; // This import seems unused, consider removing if not needed
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { getLibraryAction } from "@/actions/organisationAction";
import FileIcon from "@/components/Base/FileIcon";

// Interface for the image object - updated to match new data structure
interface Image {
  url: string;
  name: string;
  size: number;
}

interface MediaLibraryProps {
  investId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: { name: string; url: string }) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  investId,
  isOpen,
  onClose,
  onSelect,
}) => {
  const username = localStorage.getItem("user");
  const [images, setImages] = useState<Image[]>([]),
    [isLoading, setIsLoading] = useState(false),
    [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      if (username) {
        const detailedImages = await getLibraryAction(username, investId);
        setImages(detailedImages);
      }
    } catch (error) {
      console.error("Error fetching media library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Fetch images only if the dialog is open and images haven't been loaded yet,
      // or if you want to refresh the library every time it opens.
      // Removed the `images.length === 0` condition to always refresh when opened,
      // as there's no unique `id` to track previously selected items across sessions.
      fetchImages();
      setSelectedImage(null); // Clear selected image when opening the library
    }
  }, [isOpen]);

  const handleSave = () => {
    if (selectedImage) {
      onSelect({ name: selectedImage.name, url: selectedImage.url });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="xl">
      <Dialog.Panel>
        <div className="p-5">
          <h2 className="mr-auto text-base font-medium mb-5">
            {t("media_library")}
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              {t("loading")}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.url}
                  onClick={() => setSelectedImage(image)}
                  className={`intro-y cursor-pointer p-2 rounded-md transition-all ${
                    selectedImage?.url === image.url // Compare by url since id is removed
                      ? "ring-2 ring-primary ring-offset-2"
                      : "ring-0"
                  }`}
                >
                  <div className="pt-5 pb-3 rounded-md file box sm:px-3 zoom-in">
                    <FileIcon
                      className="w-4/5 mx-auto"
                      variant="image"
                      src={image.url}
                    />
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="block mt-4 font-medium text-center truncate"
                    >
                      {image.name}
                    </a>
                    <div className="text-slate-500 text-xs text-center mt-0.5">
                      {formatBytes(image.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 text-right border-t border-slate-200/60 dark:border-darkmode-400">
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onClose}
            className="w-24 mr-2 mt-3"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="w-24 mt-3"
            disabled={!selectedImage}
          >
            {t("save")}
          </Button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default MediaLibrary;