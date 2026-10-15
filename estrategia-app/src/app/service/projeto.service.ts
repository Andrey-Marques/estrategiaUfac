import { CriarProjeto } from './../model/projetoEstrategico';
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ProjetoEstrategico } from "../model/projetoEstrategico";
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class ProjetoService {
    private url = `${environment.apiUrl}/projetos/`;
    private apiUrlEvolucao = `${environment.apiUrl}/projetos/`;

    constructor(private http: HttpClient){}

    get(){
        return this.http.get<ProjetoEstrategico[]>(this.url);
    }

    getById(id: number): Observable<ProjetoEstrategico> {
      return this.http.get<ProjetoEstrategico>(`${this.url}${id}/`);
    }

    CriarProjeto(projeto: CriarProjeto){
      return this.http.post<ProjetoEstrategico>(this.url, projeto);
    }

    atualizarProjeto(id: number, projeto: Partial<CriarProjeto & { responsavel?: number | null; evolucoes?: Array<{ realizacao?: string; proximo_passo?: string }> }>): Observable<ProjetoEstrategico> {
      return this.http.patch<ProjetoEstrategico>(`${this.url}${id}/`, projeto);
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
    aprovarProjeto(id: number, observacao: string): Observable<ProjetoEstrategico> {
      return this.http.post<ProjetoEstrategico>(
        `${this.url}${id}/aprovar/`,
        {
          observacao
        }
      );
    }

    rejeitarProjeto(id: number, observacao: string): Observable<ProjetoEstrategico> {
      return this.http.post<ProjetoEstrategico>(
        `${this.url}${id}/rejeitar/`,
        {
          observacao
        }
      );
    }
    submeterAtualizacao(projetoId: number, dados: any) {
      return this.http.post(
        `${this.url}${projetoId}/submeter-atualizacao/`,
        dados
      );
    }
}
