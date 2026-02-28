import { Pipe, PipeTransform } from '@angular/core';

/**
 * Türkçe büyük harf dönüşümü (I -> İ, i -> İ, ı -> I).
 * CSS text-transform: uppercase Türkçe karakterleri yanlış dönüştürür; bu pipe tr-TR locale kullanır.
 */
@Pipe({ name: 'turkishUppercase', standalone: true })
export class TurkishUppercasePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (value == null || value === '') return '';
    return String(value).toLocaleUpperCase('tr-TR');
  }
}
