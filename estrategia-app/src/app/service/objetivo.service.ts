import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ObjetivoEstrategico, CriarObjetivoEstrategico} from '../model/objetivoEstrategico';

@Injectable({
  providedIn: 'root'
})
export class ObjetivoService {

  private apiUrl = 'http://localhost:8000/api/objetivos/';

  constructor(private http: HttpClient){}

  listar(){
    return this.http.get<ObjetivoEstrategico[]>(this.apiUrl);
  }

  criar(objetivo: CriarObjetivoEstrategico){
    return this.http.post<ObjetivoEstrategico>(this.apiUrl, objetivo);
  }
}
