import type { Annotation, MapPopupInfo } from '@/lib/types';

export type MapPopupState = {
  showStreetView: boolean;
  streetViewAvailable: boolean | null;
  showNote: boolean;
  isEditing: boolean;
  noteText: string;
  isSaving: boolean;
};

export type MapPopupAction =
  | { type: 'SET_STREET_VIEW'; payload: boolean }
  | { type: 'SET_STREET_VIEW_AVAILABLE'; payload: boolean | null }
  | { type: 'TOGGLE_NOTE'; payload?: boolean }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_NOTE_TEXT'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'RESET_NOTE'; payload: { showNote: boolean; noteText: string } };

export function popupReducer(state: MapPopupState, action: MapPopupAction): MapPopupState {
  switch (action.type) {
    case 'SET_STREET_VIEW':
      return { ...state, showStreetView: action.payload };
    case 'SET_STREET_VIEW_AVAILABLE':
      return { ...state, streetViewAvailable: action.payload };
    case 'TOGGLE_NOTE':
      return {
        ...state,
        showNote: action.payload ?? !state.showNote,
        isEditing: action.payload === false ? false : state.isEditing,
      };
    case 'SET_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_NOTE_TEXT':
      return { ...state, noteText: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'RESET_NOTE':
      return {
        ...state,
        showNote: action.payload.showNote,
        noteText: action.payload.noteText,
        isEditing: false,
      };
    default:
      return state;
  }
}
