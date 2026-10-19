import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DashBoardService {
    constructor(private http: HttpClient){}

    getResumoUnidade(){
        return this.http.get<{iniciativas: number; projetos:number; indicadores: number;}>(`${environment.apiUrl}/resumo-unidade/`);
    }
}
