import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';
import { InfoBar } from '../utils/info-bar/info-bar';
import { FormsModule } from '@angular/forms';

      //chat recomendou, mas pode tirar se quiser, pois nao sei como vai ser a integração
interface Usuario {
  id: number;
  username: string;
  nome_completo: string;
  nome_social?: string;
  cpf: string
  email: string;
  papel: string;
  unidade: string;
  password?: string;
  dataCadastro?: string;
  status?: 'ATIVO' | 'INATIVO';
}
@Component({
  selector: 'app-tela-cadastro',
  imports: [CommonModule, BarraLateral, InfoBar, FormsModule],
  templateUrl: './tela-cadastro.html',
  styleUrl: './tela-cadastro.scss',
})
export class TelaCadastro {

  unidades_selecionadas: string[] = [];

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


      usuarios: Usuario[] = [
        {
          id: 1,
          username: 'fulano.silva',
          nome_completo: 'Fulano Sicrano Da Silva',
          email: 'fulano@ufac.br',
          papel: 'SERVIDOR',
          unidade: 'PROGRAD',
          dataCadastro: '2026-07-09',
          status: 'ATIVO',
          cpf: "00000000000"
        }
      ];
    modalAberto = false;
    modoVisualizacao = false;
 
    usuarioSelecionado: any = null;

    get camposBloqueados(): boolean {
      return this.modoVisualizacao; // em visualização, tudo (exceto e-mail) fica travado
    }

    abrirModal():void {
      //chat recomendou, mas pode tirar se quiser, pois nao sei como vai ser a integração
      this.usuarioSelecionado = {
        id: 0, username: '', nome_completo: '', email: '',
        papel: '', unidade: '', password: '',  nome_social: '', cpf:''
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
          if (!this.usuarioSelecionado?.nome_completo) return;

              const novo: Usuario = {
                ...this.usuarioSelecionado,
                id: Date.now(), // provisório; o backend vai gerar o id
                dataCadastro: new Date().toISOString().slice(0, 10),
                status: 'ATIVO'
          };

          this.usuarios = [...this.usuarios, novo];
          this.fecharModal();
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
        this.usuarios = this.usuarios.filter(u => u.id !== id);

        this.cancelarExclusao();
        // TODO integração: DELETE /usuarios/{id}
        // e só remover da lista depois que a API responder com sucesso
      }


      statusAberto = false;
      usuarioParaStatus: Usuario | null = null;

      // texto do modal: se está ativo, a ação é inativar (e vice-versa)
      get acaoStatus(): 'Ativar' | 'Inativar' {
        return this.usuarioParaStatus?.status === 'ATIVO' ? 'Inativar' : 'Ativar';
      }

      abrirConfirmacaoStatus(usuario: Usuario): void {
        this.usuarioParaStatus = usuario;
        this.statusAberto = true;
      }

      cancelarAlteracaoStatus(): void {
        this.statusAberto = false;
        this.usuarioParaStatus = null;
      }

      confirmarAlteracaoStatus(): void {
        if (!this.usuarioParaStatus) return;

        const id = this.usuarioParaStatus.id;
        const novoStatus: 'ATIVO' | 'INATIVO' =
          this.usuarioParaStatus.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';

        this.usuarios = this.usuarios.map(u =>
          u.id === id ? { ...u, status: novoStatus } : u
        );

        this.cancelarAlteracaoStatus();
      }

}