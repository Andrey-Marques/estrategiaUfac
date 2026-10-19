import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../../environments/environment';

interface LoginResponse{
    access: string;
    refresh: string;
}
interface RefreshResponse{
    access: string;
    refresh: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService{
    private url = environment.apiUrl;

    constructor (private http: HttpClient){}

    login(username: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
            `${this.url}/login/`,{
                username,
                password}
        );
    }

     refreshToken(): Observable<RefreshResponse> {

    const refresh = localStorage.getItem('refresh');

    return this.http.post<RefreshResponse>(
      `${this.url}/token/refresh/`,
      {
        refresh: refresh,
      }
    );
  }

  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  solicitarRecuperacaoSenha(email: string): Observable<{detail: string}> {
    return this.http.post<{detail: string}>(`${this.url}/recuperar-senha/`, { email });
  }

  redefinirSenha(dados: {uid: string; token: string; nova_senha: string; confirmar_senha: string}): Observable<{detail: string}> {
    return this.http.post<{detail: string}>(`${this.url}/redefinir-senha/`, dados);
  }

}
