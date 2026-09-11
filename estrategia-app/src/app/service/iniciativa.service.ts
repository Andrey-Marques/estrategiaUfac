import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IniciativaEstrategica } from "../model/iniciativaEstrategica";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class IniciativaService{
    private apiUrl = 'http://localhost:8000/api/iniciativas/';

    constructor(private http : HttpClient){}

    get(){
        return this.http.get<IniciativaEstrategica[]>(this.apiUrl);
    }

    getById(id: number): Observable<IniciativaEstrategica>{
        return this.http.get<IniciativaEstrategica>(`${this.apiUrl}${id}/`);
    }

    criarIniciativa(dados: any):Observable<any>{
        return this.http.post(this.apiUrl, dados);
    }

    atualizarIniciativa(id: number, dados: any): Observable<IniciativaEstrategica>{
      return this.http.patch<IniciativaEstrategica>(`${this.apiUrl}${id}/`, dados);
    }

    aprovar(id: number, observacao: string): Observable<IniciativaEstrategica>{
      return this.http.post<IniciativaEstrategica>(
        `${this.apiUrl}${id}/aprovar/`, {observacao}
      );
    }

    rejeitar(id: number, observacao: string): Observable<IniciativaEstrategica>{
      return this.http.post<IniciativaEstrategica>(
        `${this.apiUrl}${id}/rejeitar/`, {observacao}
      )
    }
}
