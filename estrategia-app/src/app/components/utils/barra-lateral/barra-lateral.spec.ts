import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { UsuarioService } from '../../../service/usuario.service';
import { Usuario, PapelUsuario } from '../../../model/usuario';

import { BarraLateral } from './barra-lateral';

describe('BarraLateral', () => {
  let perfil: Subject<Usuario>;

  beforeEach(async () => {
    perfil = new Subject<Usuario>();
    await TestBed.configureTestingModule({
      imports: [BarraLateral],
      providers: [
        provideRouter([]),
        provideZonelessChangeDetection(),
        { provide: UsuarioService, useValue: { getAtual: () => perfil } },
      ],
    }).compileComponents();
  });

  for (const papel of ['ADMIN', 'GESTOR', 'SERVIDOR'] as PapelUsuario[]) {
    it(`atualiza o menu após receber o perfil ${papel}`, async () => {
      const fixture = TestBed.createComponent(BarraLateral);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('a[href="/tela-cadastro"]')).toBeNull();

      // Simula a resposta assíncrona da API, sem clique ou detectChanges manual.
      await Promise.resolve();
      perfil.next({ papel } as Usuario);
      await fixture.whenStable();

      const link = fixture.nativeElement.querySelector('a[href="/tela-cadastro"]');
      expect(!!link).toBe(papel !== 'SERVIDOR');
    });
  }

  it('mantém a gestão oculta quando o perfil não carrega', async () => {
    const fixture = TestBed.createComponent(BarraLateral);
    await fixture.whenStable();
    perfil.error(new Error('Falha ao carregar perfil'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('a[href="/tela-cadastro"]')).toBeNull();
  });
});
