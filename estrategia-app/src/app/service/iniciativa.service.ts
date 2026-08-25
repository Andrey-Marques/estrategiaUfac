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
}
