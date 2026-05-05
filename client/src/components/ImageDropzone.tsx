import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImageDropzone({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
        disabled ? 'opacity-50 cursor-not-allowed' :
        hover ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400'
      }`}
    >
      <p className="text-slate-600">Drop a photo here or click to choose one</p>
      <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WEBP &middot; up to 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
