import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: `
    <p id="noColor" appHighlight>Sans couleur</p>
    <p id="withColor" [appHighlight]="color">Avec couleur</p>
  `,
})
class HostComponent {
  color: string | null = null;
}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('ne met pas de background sans couleur', () => {
    const el = fixture.debugElement.query(By.css('#noColor')).nativeElement as HTMLElement;
    expect(el.style.backgroundColor).toBe('');
  });

  it('applique la couleur quand l’input change', () => {
    const comp = fixture.componentInstance;
    const el = fixture.debugElement.query(By.css('#withColor')).nativeElement as HTMLElement;

    comp.color = 'rgb(255, 0, 0)'; // rouge
    fixture.detectChanges();

    expect(getComputedStyle(el).backgroundColor).toBe('rgb(255, 0, 0)');

    comp.color = null;
    fixture.detectChanges();
    expect(getComputedStyle(el).backgroundColor).toBe('rgba(0, 0, 0, 0)'); // retirée
  });
});
