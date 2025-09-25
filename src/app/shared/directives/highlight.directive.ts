import { Directive, ElementRef, inject, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective implements OnChanges {
  @Input('appHighlight') i_color: string | null = null;

  private m_el = inject(ElementRef);
  private m_renderer = inject(Renderer2);

  ngOnChanges() {
    if (this.i_color) {
      this.m_renderer.setStyle(this.m_el.nativeElement, 'backgroundColor', this.i_color);
    } else {
      this.m_renderer.removeStyle(this.m_el.nativeElement, 'backgroundColor');
    }
  }
}
