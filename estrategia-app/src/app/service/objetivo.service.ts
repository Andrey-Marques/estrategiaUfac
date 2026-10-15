import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ObjetivoEstrategico, CriarObjetivoEstrategico} from '../model/objetivoEstrategico';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ObjetivoService {

  private apiUrl = `${environment.apiUrl}/objetivos/`;

  constructor(private http: HttpClient){}

  get(){
    return this.http.get<ObjetivoEstrategico[]>(this.apiUrl);
  }

  criar(objetivo: CriarObjetivoEstrategico){
    return this.http.post<ObjetivoEstrategico>(this.apiUrl, objetivo);
  }
}
