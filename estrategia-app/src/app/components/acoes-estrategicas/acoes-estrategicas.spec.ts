import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AcoesEstrategicas } from './acoes-estrategicas';
import { AcaoEstrategicaPublica } from '../../service/acoes-estrategicas.service';

const base = { titulo: 'Registro', unidade_id: 1, unidade_sigla: 'PROPLAN', responsavel: 'Responsável', objetivos: [], data_atualizacao: null, data_cadastro: null };
const registros: AcaoEstrategicaPublica[] = [
  { ...base, id: 1, tipo: 'projetos', status_execucao: 'ANDAMENTO', progresso: '25.50' },
  { ...base, id: 2, tipo: 'projetos', status_execucao: 'DESCONTINUADO', progresso: 40 },
  { ...base, id: 3, tipo: 'projetos', status_execucao: 'CONCLUIDO', progresso: 100 },
  { ...base, id: 4, tipo: 'iniciativas', progresso: '65.00' },
  { ...base, id: 5, tipo: 'indicadores' },
];

describe('Acompanhamento na consulta pública', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AcoesEstrategicas], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function iniciar() {
    const fixture = TestBed.createComponent(AcoesEstrategicas);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/acoes-estrategicas/')).flush({ registros, unidades: [], objetivos: [] });
    return fixture;
  }
  it('filtra projetos por status, reinicia paginação e limpa seleção', () => {
    const f = iniciar(); const c = f.componentInstance;
    c.abaAtiva.set('projetos'); c.paginaAtual.set(2); c.filtrarStatus('DESCONTINUADO');
    expect(c.paginaAtual()).toBe(1);
    expect(c.registrosFiltrados().map(r => r.id)).toEqual([2]);
    c.limparFiltros();
    expect(c.registrosFiltrados().length).toBe(3);
    f.destroy();
  });
  it('mostra badges e barras nos projetos e mantém filtro no contexto da unidade', () => {
    const f = iniciar(); const c = f.componentInstance;
    c.abaAtiva.set('projetos'); c.unidadeDoPainel.set(1); f.detectChanges();
    expect(f.nativeElement.querySelector('.filtros #status-projetos-publicos')).toBeTruthy();
    expect(f.nativeElement.querySelector('.barra-informacoes #status-projetos-publicos')).toBeNull();
    expect(f.nativeElement.querySelector('.indicador > .progresso-publico')).toBeTruthy();
    expect(f.nativeElement.querySelector('.titulo-indicador .progresso-publico')).toBeNull();
    expect(f.nativeElement.querySelectorAll('app-status-projeto').length).toBe(3);
    expect(f.nativeElement.querySelectorAll('[role="progressbar"]').length).toBe(3);
    expect(f.nativeElement.textContent).toContain('25,5%');
    f.destroy();
  });
  it('não aplica status a iniciativas e não mostra barra ou filtro em indicadores', () => {
    const f = iniciar(); const c = f.componentInstance;
    c.filtrarStatus('CONCLUIDO'); c.abaAtiva.set('iniciativas'); f.detectChanges();
    expect(c.registrosFiltrados().map(r => r.id)).toEqual([4]);
    expect(f.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('65');
    expect(f.nativeElement.querySelector('#status-projetos-publicos')).toBeNull();
    c.abaAtiva.set('indicadores'); f.detectChanges();
    expect(f.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
    expect(c.percentual({ ...registros[0], progresso: 120 })).toBe(100);
    expect(c.percentual({ ...registros[0], progresso: -1 })).toBe(0);
    f.destroy();
  });
});
