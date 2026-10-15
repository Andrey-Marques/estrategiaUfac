import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormularioIndicadores } from './formulario-indicadores';

describe('FormularioIndicadores', () => {
  let component: FormularioIndicadores;
  let fixture: ComponentFixture<FormularioIndicadores>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioIndicadores],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FormularioIndicadores);
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
    component.fecharFormulario();
    expect(component.etapaAtual).toBe(1);
    expect(component.formularioIndicador.invalid).toBe(true);
  });

  it('avisa a listagem somente depois de salvar na API', () => {
    component.fecharFormulario();
    component.formularioIndicador.patchValue({
      nome: 'Indicador de teste',
      unidade: 1,
      finalidade: 'Medir resultados',
      polaridade: 'POSITIVA',
      metodoCalculo: 'Soma',
    });
    component.objetivoSelecionado = 1;
    let atualizacoes = 0;
    component.salvo.subscribe(() => atualizacoes++);
    component.salvarIndicador('EM_ESPERA');
    const request = http.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/indicadores/'),
    );
    expect(request.request.body.status).toBe('EM_ESPERA');
    expect(atualizacoes).toBe(0);
    request.flush({ id: 1 });
    expect(atualizacoes).toBe(1);
  });
});
