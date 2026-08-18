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
}
