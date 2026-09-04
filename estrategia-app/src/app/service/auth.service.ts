import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

interface LoginResponse{
    access: string;
    refresh: string;
}
interface RefreshResponse{
    access: string;
    refresh: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService{
    private url = 'http://127.0.0.1:8000/api';

    constructor (private http: HttpClient){}

    login(username: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
            `${this.url}/login/`,{
                username,
                password}
        );
    }

     refreshToken(): Observable<RefreshResponse> {

    const refresh = localStorage.getItem('refresh');

    return this.http.post<RefreshResponse>(
      `${this.url}/token/refresh/`,
      {
        refresh: refresh,
      }
    );
  }

  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

}
