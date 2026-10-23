import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MascaraReais } from '../../../directives/mascara-reais';
import { CurrencyPipe } from '@angular/common';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { appConfig } from '../../../app.config';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormularioProjetos } from './formulario-projetos';

@Component({ imports: [ReactiveFormsModule, MascaraReais], template: '<input appMascaraReais [formControl]="custo">' })
class CampoCustoTeste {
  custo = new FormControl<number | null>(1234567.89);
}

describe('FormularioProjetos', () => {
  let component: FormularioProjetos;
  let fixture: ComponentFixture<FormularioProjetos>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioProjetos, CampoCustoTeste],
      providers: [provideHttpClient(), provideHttpClientTesting(), ...appConfig.providers.filter(provider =>
        provider && typeof provider === 'object' && 'provide' in provider &&
        (provider.provide === LOCALE_ID || provider.provide === DEFAULT_CURRENCY_CODE))],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioProjetos);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // Inclui a consulta de revisões disparada ao identificar o usuário.
    let requests = http.match(() => true);
    while (requests.length) {
      for (const request of requests) {
        request.flush(
          request.request.url.endsWith('/me/') ? { id: 1, papel: 'ADMIN', unidade: 1 } : [],
        );
      }
      requests = http.match(() => true);
    }
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('inicia um novo formulário sem dados da edição anterior', () => {
    component.etapaAtual = 3;
    component.criarNovoProjeto();
    expect(component.etapaAtual).toBe(1);
    expect(component.formularioProjeto.invalid).toBe(true);
  });

  it('avisa a listagem somente depois de salvar na API', () => {
    component.criarNovoProjeto();
    component.formularioProjeto.patchValue({
      tituloProjeto: 'Projeto de teste',
      unidadeResponsavel: 1,
      tempoEstimado: '6 meses',
      objetivos: [1],
    });

    let atualizacoes = 0;
    component.salvo.subscribe(() => atualizacoes++);
    component.salvarProjeto('EM_ESPERA');
    const request = http.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/projetos/'),
    );
    expect(request.request.body.status).toBe('EM_ESPERA');
    expect(atualizacoes).toBe(0);
    request.flush({ id: 1 });
    expect(atualizacoes).toBe(1);
  });
  it('usa a configuração brasileira da aplicação para exibir reais', () => {
    const pipe = new CurrencyPipe(TestBed.inject(LOCALE_ID), TestBed.inject(DEFAULT_CURRENCY_CODE));
    expect(pipe.transform(1234567.89)?.replace(/\s/g, ' ')).toBe('R$ 1.234.567,89');
  });

  it('exibe a máscara brasileira e mantém o custo numérico no formulário', () => {
    const campo = TestBed.createComponent(CampoCustoTeste);
    campo.detectChanges();
    const input: HTMLInputElement = campo.nativeElement.querySelector('input');
    expect(input.value.replace(/\s/g, ' ')).toBe('R$ 1.234.567,89');
    input.value = 'R$ 1.234,56';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campo.componentInstance.custo.value).toBe(1234.56);
    campo.destroy();
  });
});
