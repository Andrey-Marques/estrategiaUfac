import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../model/usuario';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private url = 'http://localhost:8000/api/usuarios/';

  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<Usuario[]>(this.url);
  }

  getAtual() {
    return this.http.get<Usuario>(`${this.url}me/`);
  }

  buscarMeuPerfil() {
    return this.getAtual();
  }

  salvarMeuPerfil(dados: Partial<Usuario>) {
    return this.http.patch<Usuario>(`${this.url}me/`, dados);
  }

  cadastrarUsuario(dados: any):Observable<any>{
    return this.http.post(this.url, dados)
  }
}
