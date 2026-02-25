'use client';

import { useCallback, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface GPXUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  fileName: string | null;
  onClear: () => void;
}

export function GPXUpload({ onFileLoaded, fileName, onClear }: GPXUploadProps) {
  const t = useTranslations('GPXUpload');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoaded(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.gpx')) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.toLowerCase().endsWith('.gpx')) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  if (fileName) {
    return (
      <div className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-lg border p-3">
        <FileText className="text-primary h-5 w-5 shrink-0" />
        <span className="text-foreground flex-1 truncate text-sm font-medium">{fileName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-7 w-7"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('removeFile')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className="group border-border hover:border-primary/50 hover:bg-primary/5 flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors"
      role="button"
      tabIndex={0}
      aria-label={t('uploadAriaLabel')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <div className="bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary flex h-12 w-12 items-center justify-center rounded-full transition-colors">
        <Upload className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-foreground text-sm font-medium">{t('dragDrop')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{t('clickSelect')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
