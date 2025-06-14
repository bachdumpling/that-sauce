import React from "react";

function ImageCarousel({ imageUrls }: { imageUrls: string[] }) {
  return (
    <div className="h-[300vh] w-full">
      {imageUrls.map((url, index) => (
        <div
          key={index}
          className="h-[100vh] sticky top-0 rounded-2xl p-4 flex items-start justify-center"
        >
          <div className="grid grid-cols-1 grid-rows-1 gap-4">
            <img
              src={url}
              alt={`Image ${index}`}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImageCarousel;
