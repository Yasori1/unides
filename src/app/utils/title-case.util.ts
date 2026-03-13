/**
 * Metni "Her Kelimenin İlk Harfi Büyük" formatına çevirir (Türkçe alfabe uyumlu).
 * Örn: "MERHABA DÜNYA" → "Merhaba Dünya", "istanbul" → "İstanbul"
 */
export function toTitleCase(str: string | null | undefined): string {
  if (str == null || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word.length) return word;
      return (
        word[0].toLocaleUpperCase('tr-TR') +
        word.slice(1).toLocaleLowerCase('tr-TR')
      );
    })
    .join(' ');
}
