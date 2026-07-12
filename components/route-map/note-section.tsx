'use client';

import { Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Annotation } from '@/lib/types';

interface NoteSectionProps {
  currentAnnotation: Annotation | null;
  isEditing: boolean;
  noteText: string;
  isSaving: boolean;
  savedRouteId: string | null | undefined;
  ta: (key: string) => string;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onSave: (text: string) => void;
  onCancel: () => void;
  onChangeText: (text: string) => void;
}

export function NoteSection({
  currentAnnotation,
  isEditing,
  noteText,
  isSaving,
  savedRouteId,
  ta,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onChangeText,
}: NoteSectionProps) {
  if (currentAnnotation && !isEditing) {
    return (
      <div className="bg-amber-500/10 mt-2 rounded-lg px-2.5 py-2">
        <p className="text-foreground mb-1.5 text-xs leading-relaxed">{currentAnnotation.text}</p>
        <div className="flex gap-1">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
            onClick={() => onEdit(currentAnnotation.text)}
          >
            <Pencil className="size-2.5" />
            {ta('edit')}
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="size-2.5" />
            {ta('delete')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <textarea
        className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full resize-none rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        placeholder={ta('placeholder')}
        maxLength={500}
        rows={3}
        value={noteText}
        onChange={(e) => onChangeText(e.target.value)}
        disabled={!savedRouteId}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        aria-label={ta('placeholder')}
      />
      {!savedRouteId && (
        <p className="text-muted-foreground mt-0.5 text-[9px]">{ta('saveRouteFirst')}</p>
      )}
      <div className="mt-1.5 flex gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 flex-1 gap-1 text-[10px] font-bold uppercase"
          disabled={!savedRouteId || !noteText.trim() || isSaving}
          onClick={() => onSave(noteText.trim())}
        >
          {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          {ta('save')}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={onCancel}>
          {ta('cancel')}
        </Button>
      </div>
    </div>
  );
}
