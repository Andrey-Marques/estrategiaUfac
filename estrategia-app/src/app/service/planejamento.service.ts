import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CriarPdi, CriarPlanejamento, Pdi, Planejamento } from '../model/planejamento';

@Injectable({
  providedIn: 'root',
})
export class PlanejamentoService {
  private readonly planejamentosUrl = `${environment.apiUrl}/planejamentos/`;
  private readonly pdisUrl = `${environment.apiUrl}/pdis/`;

  constructor(private http: HttpClient) {}

  listarPlanejamentos() {
    return this.http.get<Planejamento[]>(this.planejamentosUrl);
  }

  listarPdis() {
    return this.http.get<Pdi[]>(this.pdisUrl);
  }

  criarPlanejamento(dados: CriarPlanejamento) {
    return this.http.post<Planejamento>(this.planejamentosUrl, dados);
  }

  atualizarPlanejamento(id: number, dados: CriarPlanejamento) {
    return this.http.patch<Planejamento>(`${this.planejamentosUrl}${id}/`, dados);
  }

  excluirPlanejamento(id: number) {
    return this.http.delete<void>(`${this.planejamentosUrl}${id}/`);
  }

  criarPdi(dados: CriarPdi) {
    return this.http.post<Pdi>(this.pdisUrl, dados);
  }

  atualizarPdi(id: number, dados: CriarPdi) {
    return this.http.patch<Pdi>(`${this.pdisUrl}${id}/`, dados);
  }

  excluirPdi(id: number) {
    return this.http.delete<void>(`${this.pdisUrl}${id}/`);
  }
}
