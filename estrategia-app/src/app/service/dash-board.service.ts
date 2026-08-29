import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class DashBoardService {
    constructor(private http: HttpClient){}

    getResumoUnidade(){
        return this.http.get<{iniciativas: number; projetos:number; indicadores: number;}>('http://localhost:8000/api/resumo-unidade/');
    }
}
