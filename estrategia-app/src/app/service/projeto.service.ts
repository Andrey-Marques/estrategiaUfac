import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ProjetoEstrategico } from "../model/projetoEstrategico";

@Injectable({
    providedIn: 'root'
})
export class ProjetoService {
    private apUrl = 'http://localhost:8000/api/projetos/';

    constructor(private http: HttpClient){}

    get(){
        return this.http.get<ProjetoEstrategico[]>(this.apUrl);
    }
}