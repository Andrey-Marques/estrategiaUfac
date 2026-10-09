import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appMascaraCpf]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MascaraCpf), multi: true }],
})
export class MascaraCpf implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.input.value = (value ?? '').replace(/\D/g, '').slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.input.disabled = disabled; }
  @HostListener('input') formatar(): void {
    this.writeValue(this.input.value);
    this.onChange(this.input.value);
  }
  @HostListener('blur') marcarTocado(): void { this.onTouched(); }
}
