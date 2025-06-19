"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface StepReferencesProps {
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
}

export function StepReferences({
  uploadedFiles,
  onFilesChange,
}: StepReferencesProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/pdf",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    onFilesChange([...uploadedFiles, ...validFiles]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    const validFiles = files.filter((file) => {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/pdf",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    onFilesChange([...uploadedFiles, ...validFiles]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="grid grid-cols-5 gap-16 h-full items-center">
      {/* Left side - Illustration and heading (2 columns) */}
      <div className="col-span-2 flex flex-col items-center justify-center h-full">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Add references (optional)</h2>
          <p className="text-gray-600">
            Upload images or brand guidelines to improve search accuracy
          </p>
        </div>
        <img
          src="/search-images/search-3.png"
          alt="References illustration"
          className="max-w-sm w-full h-auto"
        />
      </div>

      {/* Right side - Content (3 columns) */}
      <div className="col-span-3 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* File upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors mb-6 ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-500 mb-4">PNG, JPG, PDF up to 10MB each</p>
            
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose files</span>
              </Button>
            </label>
          </div>

          {/* Uploaded files display */}
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">
                Uploaded files ({uploadedFiles.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        {file.type.startsWith("image/") ? "🖼️" : "📄"}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-32">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
