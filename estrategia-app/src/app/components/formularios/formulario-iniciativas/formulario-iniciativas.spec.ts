import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormularioIniciativas } from './formulario-iniciativas';

describe('FormularioIniciativas', () => {
  let component: FormularioIniciativas;
  let fixture: ComponentFixture<FormularioIniciativas>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioIniciativas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioIniciativas);
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
    component.criarNovaIniciativa();
    expect(component.etapaAtual).toBe(1);
    expect(component.formularioIniciativa.invalid).toBe(true);
  });

  it('marca somente ações da iniciativa que estão em atraso', () => {
    component.atrasosService.iniciativas.set([{
      tipo: 'iniciativas',
      registro_id: 1,
      registro_nome: 'Iniciativa teste',
      acao_id: 10,
      acao_nome: 'Ação atrasada',
      prazo_inicio: '2026-01-01',
      dias_atraso: 5,
    }]);

    expect(component.acaoEstaAtrasada(10)).toBe(true);
    expect(component.acaoEstaAtrasada(11)).toBe(false);
    expect(component.acaoEstaAtrasada(undefined)).toBe(false);
  });

  it('avisa a listagem somente depois de salvar na API', () => {
    component.criarNovaIniciativa();
    component.formularioIniciativa.patchValue({
      tituloIniciativa: 'Iniciativa de teste',
      unidadeResponsavel: 1,
      objetivosEstrategicos: [1],
    });

    let atualizacoes = 0;
    component.salvo.subscribe(() => atualizacoes++);
    component.salvarIniciativa('EM_ESPERA');
    const request = http.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/iniciativas/'),
    );
    expect(request.request.body.status).toBe('EM_ESPERA');
    expect(atualizacoes).toBe(0);
    request.flush({ id: 1 });
    expect(atualizacoes).toBe(1);
  });
});
