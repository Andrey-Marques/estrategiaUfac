import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe} from '@angular/common';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';
import { InfoBar } from '../utils/info-bar/info-bar';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';
import { Unidade } from '../../model/unidade';
import { UnidadeService } from '../../service/unidade.service';

      //chat recomendou, mas pode tirar se quiser, pois nao sei como vai ser a integração
@Component({
  selector: 'app-tela-cadastro',
  imports: [CommonModule, BarraLateral, InfoBar, FormsModule],
  templateUrl: './tela-cadastro.html',
  styleUrl: './tela-cadastro.scss',
  providers: [DatePipe]
})
export class TelaCadastro {

  constructor(private usuarioService: UsuarioService, private unidadeService: UnidadeService){}
  ngOnInit(): void {
    this.buscarUsuarios();
    this.buscarUnidade();
  }
  

  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  unidades_selecionadas: string[] = [];

  buscarUsuarios(){
    this.usuarioService.get().subscribe({
      next: (usuario) => this.usuarios.set(usuario),
      error: (erro) => console.error('erro ao buscar projetos', erro)
    })
  }

  buscarUnidade(){
    this.unidadeService.get().subscribe({
      next: (unidade)=> this.unidades.set(unidade),
      error: (erro) => console.error('Erro ao buscar unidade', erro)
    })
  }

  obterUnidade(usuario: Usuario): Unidade | undefined{
    return this.unidades().find(
      unidade => unidade.id === usuario.unidade
    )
  }

  filtrarUnidade(unidade: string): void {
     if (this.unidades_selecionadas.includes(unidade)){
        this.unidades_selecionadas =
        this.unidades_selecionadas.filter(
          unidade_Selecionada => unidade_Selecionada !== unidade);
     }else{
        this.unidades_selecionadas.push(unidade)

     }

    }

    filtroAberto = false;
    alternarFiltro(): void{
      this.filtroAberto = !this.filtroAberto;
    }

    modalAberto = false;
    modoVisualizacao = false;
 
    usuarioSelecionado: any = null;

    get camposBloqueados(): boolean {
      return this.modoVisualizacao; // em visualização, tudo (exceto e-mail) fica travado
    }

    abrirModal():void {
      this.usuarioSelecionado = {
        id: 0,
        username: '',
        nome_completo: '',
        nome_social: '',
        cpf: '',
        email: '',
        date_joined: '',
        papel: '',
        unidade: null,
        password: ''
      };

      this.modalAberto = true;
      this.modoVisualizacao = false;
    }

    abrirVisualizacao(usuario: Usuario): void {
        this.usuarioSelecionado = { ...usuario };
        this.modalAberto = true;
        this.modoVisualizacao = true;
  
     }

 

      cadastrarUsuario(): void {
         
          // TODO integração: POST /usuarios
        }

      fecharModal(): void {
          this.modalAberto = false;
          this.modoVisualizacao = false;
          this.usuarioSelecionado = null;

      }

      confirmarExclusaoAberto = false;
      usuarioParaExcluir: Usuario | null = null;

      abrirConfirmacaoExclusao(usuario: Usuario): void {
        this.usuarioParaExcluir = usuario;
        this.confirmarExclusaoAberto = true;
      }

      cancelarExclusao(): void {
        this.confirmarExclusaoAberto = false;
        this.usuarioParaExcluir = null;
      }

      confirmarExclusao(): void {
        if (!this.usuarioParaExcluir) return;

        const id = this.usuarioParaExcluir.id;

        this.cancelarExclusao();
        // TODO integração: DELETE /usuarios/{id}
        // e só remover da lista depois que a API responder com sucesso
      }


      statusAberto = false;
      usuarioParaStatus: Usuario | null = null;

      // texto do modal: se está ativo, a ação é inativar (e vice-versa)

      // get acaoStatus(): 'Ativar' | 'Inativar' {
      //   return this.usuarioParaStatus?. === 'ATIVO' ? 'Inativar' : 'Ativar';
      // }

      abrirConfirmacaoStatus(usuario: Usuario): void {
        this.usuarioParaStatus = usuario;
        this.statusAberto = true;
      }

      cancelarAlteracaoStatus(): void {
        this.statusAberto = false;
        this.usuarioParaStatus = null;
      }

      // confirmarAlteracaoStatus(): void {
      //   if (!this.usuarioParaStatus) return;

      //   const id = this.usuarioParaStatus.id;
      //   const novoStatus: 'ATIVO' | 'INATIVO' =
      //     this.usuarioParaStatus.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

      //   this.cancelarAlteracaoStatus();
      // }

}