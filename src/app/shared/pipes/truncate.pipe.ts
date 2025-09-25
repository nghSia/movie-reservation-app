import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(p_value: string, p_limit = 30, p_trail = '...'): string {
    if (!p_value) return '';
    return p_value.length > p_limit ? p_value.substring(0, p_limit) + p_trail : p_value;
  }
}
