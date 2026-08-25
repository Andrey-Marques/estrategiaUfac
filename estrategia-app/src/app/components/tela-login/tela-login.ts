import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-tela-login',
  imports: [FormsModule],
  templateUrl: './tela-login.html',
  styleUrl: './tela-login.scss',
  standalone: true
})
export class TelaLogin {
  constructor(private authService: AuthService){}

  username = '';
  password = '';

  login(){
    this.authService.login(this.username, this.password).subscribe({

      next: (res) => {
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);
        console.log('login realizado');
      },

      error: (erro) => {
        console.log('usuario ou senha invalida')
        console.error(erro)
      }
    })
  }
}
