import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Unidade } from "../model/unidade";

@Injectable({
    providedIn: 'root'
})
export class UnidadeService {
    private apiUrl = 'http://localhost:8000/api/unidades/';

    constructor(private http: HttpClient){}

    get(){
        return this.http.get<Unidade[]>(this.apiUrl);
    }

    getPublicas(){
        return this.http.get<Unidade[]>('http://localhost:8000/api/unidades-publicas/');
    }

    criar(dados: Pick<Unidade, 'nome' | 'sigla'>) {
        return this.http.post<Unidade>(this.apiUrl, dados);
    }

    editar(id: number, dados: Pick<Unidade, 'nome' | 'sigla'>) {
        return this.http.patch<Unidade>(`${this.apiUrl}${id}/`, dados);
    }

    excluir(id: number) {
        return this.http.delete<void>(`${this.apiUrl}${id}/`);
    }

    
}
