import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UsuarioService } from '../service/usuario.service';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(UsuarioService).getAtual().pipe(
    map(usuario => usuario.papel === 'ADMIN' ? true : router.createUrlTree(['/home'])),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
