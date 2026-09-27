import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioService } from '../service/usuario.service';

export const usuariosGuard: CanActivateFn = () => {
  const router = inject(Router);

  return inject(UsuarioService).getAtual().pipe(
    map(usuario =>
      usuario.papel === 'ADMIN' || usuario.papel === 'GESTOR'
        ? true
        : router.createUrlTree(['/home'])
    ),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
