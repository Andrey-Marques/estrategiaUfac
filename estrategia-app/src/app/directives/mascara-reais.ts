import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appMascaraReais]',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MascaraReais),
    multi: true,
  }],
})
export class MascaraReais implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly formato = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  });
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | string | null): void {
    this.input.value = value === null || value === '' || !Number.isFinite(Number(value))
      ? '' : this.formato.format(Number(value));
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  @HostListener('input')
  formatar(): void {
    const digitos = this.input.value.replace(/\D/g, '');
    const valor = digitos ? Number(digitos) / 100 : null;
    this.writeValue(valor);
    this.onChange(valor);
  }

  @HostListener('blur')
  marcarTocado(): void {
    this.onTouched();
  }
}
