import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RevisaoEdicao } from '../model/revisaoEdicao';

@Injectable({ providedIn: 'root' })
export class RevisaoService {
  private readonly apiUrl = 'http://localhost:8000/api/revisoes/';

  constructor(private http: HttpClient) {}

  listar(): Observable<RevisaoEdicao[]> {
    return this.http.get<RevisaoEdicao[]>(this.apiUrl);
  }

  aprovar(id: number): Observable<{ detail: string; projeto_id: number }> {
    return this.http.post<{ detail: string; projeto_id: number }>(`${this.apiUrl}${id}/aprovar/`, {});
  }

  rejeitar(id: number, observacao: string): Observable<RevisaoEdicao> {
    return this.http.post<RevisaoEdicao>(`${this.apiUrl}${id}/rejeitar/`, { observacao });
  }
}