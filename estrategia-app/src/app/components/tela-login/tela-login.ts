import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
@Component({
  selector: 'app-tela-login',
  imports: [FormsModule],
  templateUrl: './tela-login.html',
  styleUrl: './tela-login.scss',
  standalone: true
})
export class TelaLogin {
  constructor(private authService: AuthService, private router: Router){}

  username = '';
  password = '';

  login(){
    this.authService.login(this.username, this.password).subscribe({

      next: (res) => {
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);

        this.router.navigate(['/home'])
      },

      error: (erro) => {
        alert('usuario ou senha invalida')
      }
    })
  }
}
