// FILE: frontend/components/shared/utils.tsx
/**
 * Shared utility functions
 * - AntD v5 validators: return Promise<void>, no callback
 * - No implicit any
 */

type FieldValidator = (_rule: unknown, value: unknown) => Promise<void>;

/** Latitude valide strictement dans l'intervalle (-90, 90). */
export const validateLatitude: FieldValidator = async (_rule, value) => {
  // Champ non requis: ne pas invalider si vide
  if (value === undefined || value === null || String(value).trim() === '') {
    return;
  }

  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (Number.isNaN(num)) {
    throw new Error('Please fill in a valid latitude value!');
  }
  // Reproduit la logique d’origine: bornes -90 et 90 sont considérées invalides
  if (num <= -90 || num >= 90) {
    throw new Error('Please fill in a valid latitude value!');
  }
};

/** Longitude valide strictement dans l'intervalle (-180, 180). */
export const validateLongitude: FieldValidator = async (_rule, value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return;
  }

  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (Number.isNaN(num)) {
    throw new Error('Please fill in a valid longitude value!');
  }
  // Reproduit la logique d’origine: bornes -180 et 180 sont considérées invalides
  if (num <= -180 || num >= 180) {
    throw new Error('Please fill in a valid longitude value!');
  }
};

/**
 * Supprime les accents pour faciliter les recherches "accent-insensitive".
 * Conserve le comportement original (mise en minuscule).
 */
export const convertNonAccent = (str: string): string => {
  if (str == null) return '';
  // Normalisation unicode + suppression des diacritiques
  let s = String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Spécifiques vietnamien (compat avec ancien code)
  s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
  return s;
};
