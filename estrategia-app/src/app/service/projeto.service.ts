import { CriarProjeto } from './../model/projetoEstrategico';
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ProjetoEstrategico } from "../model/projetoEstrategico";
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjetoService {
    private apiUrl = 'http://localhost:8000/api/projetos/';
    private apiUrlEvolucao = 'http://localhost:8000/api/evolucoes-projeto/';

    constructor(private http: HttpClient){}

    get(){
        return this.http.get<ProjetoEstrategico[]>(this.apiUrl);
    }

    getById(id: number): Observable<ProjetoEstrategico> {
      return this.http.get<ProjetoEstrategico>(`${this.apiUrl}${id}/`);
    }

    CriarProjeto(projeto: CriarProjeto){
      return this.http.post<ProjetoEstrategico>(this.apiUrl, projeto);
    }

    atualizarProjeto(id: number, projeto: Partial<CriarProjeto & { evolucoes?: Array<{ realizacao?: string; proximo_passo?: string }> }>): Observable<ProjetoEstrategico> {
      return this.http.patch<ProjetoEstrategico>(`${this.apiUrl}${id}/`, projeto);
    }

    adicionarEvolucao(projetoId: number, evolucao: { realizacao?: string; proximo_passo?: string }): Observable<any> {
      return this.http.post(this.apiUrlEvolucao, {
        ...evolucao,
        fk_projeto: projetoId
      });
    }

    atualizarEvolucao(id: number, evolucao: { realizacao?: string; proximo_passo?: string }): Observable<any> {
      return this.http.patch(`${this.apiUrlEvolucao}${id}/`, evolucao);
    }

    removerEvolucao(id: number): Observable<any> {
      return this.http.delete(`${this.apiUrlEvolucao}${id}/`);
    }
    aprovarProjeto(
      id: number,
      observacao: string
    ): Observable<ProjetoEstrategico> {

      return this.http.post<ProjetoEstrategico>(
        `${this.apiUrl}${id}/aprovar/`,
        {
          observacao
        }
      );
    }

    rejeitarProjeto(
      id: number,
      observacao: string
    ): Observable<ProjetoEstrategico> {

      return this.http.post<ProjetoEstrategico>(
        `${this.apiUrl}${id}/rejeitar/`,
        {
          observacao
        }
      );
    }
}
