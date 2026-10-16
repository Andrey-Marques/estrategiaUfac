import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormularioProjetos } from './formulario-projetos';

describe('FormularioProjetos', () => {
  let component: FormularioProjetos;
  let fixture: ComponentFixture<FormularioProjetos>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioProjetos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
});
