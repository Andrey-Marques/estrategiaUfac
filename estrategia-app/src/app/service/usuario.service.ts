import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../model/usuario';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8000/api/usuarios/';

  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  buscarMeuPerfil() {
    return this.http.get<Usuario>(`${this.apiUrl}me/`);
  }

  salvarMeuPerfil(dados: Partial<Usuario>) {
    return this.http.patch<Usuario>(`${this.apiUrl}me/`, dados);
  }

  getAtual() {
    return this.http.get<Usuario>(`${this.apiUrl}me/`);
  }
}
