import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IndicadorEstrategico } from "../model/indicadorEstrategico";

@Injectable({
    providedIn: 'root'
})
export class IndicadorService {
    private apiUrl = 'http://localhost:8000/api/indicadores/';

    constructor(private http: HttpClient) {}

    get(){
        return this.http.get<IndicadorEstrategico[]>(this.apiUrl);
    }
    getById(id: number){
        return this.http.get<IndicadorEstrategico>(`${this.apiUrl}${id}/`);
    }
    criarIndicador(dados: any){
        return this.http.post<IndicadorEstrategico>(this.apiUrl, dados);
    }
    atualizarIndicador(id: number, dados: Partial<IndicadorEstrategico>) {
      return this.http.patch<IndicadorEstrategico>(`${this.apiUrl}${id}/`, dados);
    }

        submeterAtualizacao(id: number, dados: Partial<IndicadorEstrategico>) {
            return this.http.post(`${this.apiUrl}${id}/submeter-atualizacao/`, dados);
        }
}
