import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IniciativaEstrategica } from "../model/iniciativaEstrategica";

@Injectable({
    providedIn: 'root'
})
export class IniciativaService{
    private apiUrl = 'http://localhost:8000/api/objetivos/';

    constructor(private http : HttpClient){}

    get(){
        return this.http.get<IniciativaEstrategica[]>(this.apiUrl);
    }
}