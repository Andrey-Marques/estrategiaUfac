import { HttpClient } from '@angular/common/http';
import { Injectable, Service } from '@angular/core';
import { Usuario } from '../model/usuario';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = 'http://localhost:8000/api/usuarios/';

    constructor(private http: HttpClient){}
    get(){
        return this.http.get<Usuario[]>(this.apiUrl);
    }

    getAtual(){
        return this.http.get<Usuario>(`${this.apiUrl}me/`);
    }
}
