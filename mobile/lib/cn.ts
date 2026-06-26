type ClassValue = string | number | false | null | undefined;

// Une clases (idéntico al cn de la web). NativeWind resuelve la cadena final.
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
