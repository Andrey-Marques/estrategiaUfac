import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TelaCadastro } from './tela-cadastro';
import { Usuario } from '../../model/usuario';

const servidor: Usuario = { id: 2, username: 'servidor', nome_completo: 'Nome original', nome_social: '', cpf: '', email: 'servidor@example.com', date_joined: '', papel: 'SERVIDOR', unidade: 2, is_active: true };

describe('Edição de usuários', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TelaCadastro], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function iniciar(papel: 'ADMIN' | 'GESTOR') {
    const fixture = TestBed.createComponent(TelaCadastro);
    fixture.detectChanges();
    http.match(() => true).forEach(request => request.flush(request.request.url.endsWith('/me/') ? { ...servidor, id: 1, papel } : request.request.url.endsWith('/usuarios/') ? [servidor] : [{ id: 2, sigla: 'PROAES', nome: 'Unidade' }]));
    fixture.componentInstance.abrirVisualizacao(servidor);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const editar = buttons.find(item => item.textContent?.includes('Editar usuário'));
    expect(editar).toBeTruthy();
    editar!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('habilita edição e atualiza a lista após sucesso sem enviar senha', async () => {
    const f = await iniciar('ADMIN');
    expect(f.nativeElement.querySelector('#nome').readOnly).toBe(false);
    expect(f.nativeElement.querySelector('#senha')).toBeNull();
    f.componentInstance.usuarioFormulario.nome_completo = 'Nome atualizado';
    f.componentInstance.salvarEdicaoUsuario();
    const request = http.expectOne(req => req.method === 'PATCH' && req.url.endsWith('/usuarios/2/'));
    expect(request.request.body.password).toBeUndefined();
    expect(f.componentInstance.usuarios()[0].nome_completo).toBe('Nome original');
    request.flush({ ...servidor, nome_completo: 'Nome atualizado' });
    expect(f.componentInstance.modalAberto).toBe(false);
    expect(f.componentInstance.usuarios()[0].nome_completo).toBe('Nome atualizado');
    f.destroy();
  });
  it('bloqueia perfil e unidade para gestor e não os envia no PATCH', async () => {
    const f = await iniciar('GESTOR');
    expect(f.nativeElement.querySelector('#papel').disabled).toBe(true);
    expect(f.nativeElement.querySelector('#unidade').disabled).toBe(true);
    f.componentInstance.salvarEdicaoUsuario();
    const request = http.expectOne(req => req.method === 'PATCH');
    expect(request.request.body.papel).toBeUndefined();
    expect(request.request.body.unidade).toBeUndefined();
    request.flush(servidor); f.destroy();
  });
  it('preserva o formulário e apresenta erro de validação', async () => {
    const f = await iniciar('ADMIN');
    f.componentInstance.usuarioFormulario.email = 'duplicado@example.com';
    f.componentInstance.salvarEdicaoUsuario();
    http.expectOne(req => req.method === 'PATCH').flush({ email: ['Já existe um usuário com este e-mail.'] }, { status: 400, statusText: 'Bad Request' });
    f.detectChanges();
    expect(f.componentInstance.modalAberto).toBe(true);
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain('Já existe');
    expect(f.componentInstance.usuarioFormulario.email).toBe('duplicado@example.com');
    f.destroy();
  });
});
