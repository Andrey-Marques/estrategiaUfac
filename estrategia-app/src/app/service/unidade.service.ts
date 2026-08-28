import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Unidade } from "../model/unidade";

@Injectable({
    providedIn: 'root'
})
export class UnidadeService {
    private apiUrl = 'http://localhost:8000/api/unidades/';

    constructor(private http: HttpClient){}

    get(){
        return this.http.get<Unidade[]>(this.apiUrl);
    }

    
}