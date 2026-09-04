import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';

import { AuthService } from '../service/auth.service';


let renovandoToken = false;

const novoTokenSubject =
  new BehaviorSubject<string | null>(null);


export const authInterceptor: HttpInterceptorFn = (
  req,
  next
) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken =
    localStorage.getItem('access');


  let requisicao = req;


  if (accessToken) {

    requisicao = req.clone({
      setHeaders: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    });

  }


  return next(requisicao).pipe(

    catchError((erro: HttpErrorResponse) => {

      if (erro.status !== 401) {
        return throwError(() => erro);
      }


      // Não tenta renovar login ou refresh
      if (
        req.url.includes('/login/') ||
        req.url.includes('/token/refresh/')
      ) {

        return throwError(() => erro);

      }


      const refreshToken =
        localStorage.getItem('refresh');


      if (!refreshToken) {

        authService.logout();

        router.navigate(['/login']);

        return throwError(() => erro);

      }


      // Nenhuma renovação acontecendo
      if (!renovandoToken) {

        renovandoToken = true;

        novoTokenSubject.next(null);


        return authService
          .refreshToken()
          .pipe(

            switchMap((resposta) => {

              renovandoToken = false;


              localStorage.setItem(
                'access',
                resposta.access
              );


              if (resposta.refresh) {

                localStorage.setItem(
                  'refresh',
                  resposta.refresh
                );

              }


              novoTokenSubject.next(
                resposta.access
              );


              const novaRequisicao =
                req.clone({

                  setHeaders: {

                    Authorization:
                      `Bearer ${resposta.access}`,

                  },

                });


              return next(novaRequisicao);

            }),


            catchError((erroRefresh) => {

              renovandoToken = false;

              novoTokenSubject.next(null);


              authService.logout();

              router.navigate(['/login']);


              return throwError(
                () => erroRefresh
              );

            })

          );

      }


      /*
       * Já existe outra requisição
       * renovando o token.
       *
       * Aguarda ela terminar.
       */
      return novoTokenSubject.pipe(

        filter(
          (token): token is string =>
            token !== null
        ),

        take(1),

        switchMap((token) => {

          const novaRequisicao =
            req.clone({

              setHeaders: {

                Authorization:
                  `Bearer ${token}`,

              },

            });


          return next(novaRequisicao);

        })

      );

    })

  );

};
