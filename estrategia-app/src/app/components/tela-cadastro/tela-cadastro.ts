import { Component, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';
import { Unidade } from '../../model/unidade';
import { UnidadeService } from '../../service/unidade.service';

//chat recomendou, mas pode tirar se quiser, pois nao sei como vai ser a integração
@Component({
  selector: 'app-tela-cadastro',
  imports: [CommonModule, FormsModule],
  templateUrl: './tela-cadastro.html',
  styleUrl: './tela-cadastro.scss',
  providers: [DatePipe],
})
export class TelaCadastro {
  constructor(
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
  ) {}
  ngOnInit(): void {
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidade();
  }

  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  usuarioAtual = signal<Usuario | null>(null);
  termoPesquisa = signal('');
  unidadesSelecionadas = signal<number[]>([]);
  menuUnidadesAberto = signal(false);

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.aplicarFiltrosDeAcesso();
      },
      error: (erro) => console.error('Erro ao buscar usuário atual', erro),
    });
  }

  buscarUsuarios() {
    this.usuarioService.get().subscribe({
      next: (usuario) => {
        this.usuarios.set(usuario);
        this.aplicarFiltrosDeAcesso();
      },
      error: (erro) => console.error('erro ao buscar projetos', erro),
    });
  }

  private aplicarFiltrosDeAcesso(): void {
    const atual = this.usuarioAtual();
    if (!atual || atual.papel === 'ADMIN') {
      return;
    }

    const unidadeId = this.obterIdUnidade(atual);
    this.usuarios.update((usuarios) =>
      usuarios.filter((usuario) => this.obterIdUnidade(usuario) === unidadeId),
    );
  }

  private obterIdUnidade(usuario: Usuario): number | null {
    if (typeof usuario.unidade === 'number') {
      return usuario.unidade;
    }
    return usuario.unidade?.id ?? null;
  }

  pesquisarUsuario(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.termoPesquisa.set(input.value.trim().toLowerCase());
  }

  alternarUnidade(unidadeId: number): void {
    const selecionadas = this.unidadesSelecionadas();
    this.unidadesSelecionadas.set(
      selecionadas.includes(unidadeId)
        ? selecionadas.filter((id) => id !== unidadeId)
        : [...selecionadas, unidadeId],
    );
  }

  unidadeEstaSelecionada(unidadeId: number): boolean {
    return this.unidadesSelecionadas().includes(unidadeId);
  }

  alternarMenuUnidades(): void {
    this.menuUnidadesAberto.update((aberto) => !aberto);
  }

  limparFiltroUnidades(): void {
    this.unidadesSelecionadas.set([]);
  }

  usuariosFiltrados(): Usuario[] {
    const pesquisa = this.termoPesquisa();
    const unidadesSelecionadas = this.unidadesSelecionadas();

    return this.usuarios().filter((usuario) => {
      const atendePesquisa = !pesquisa || usuario.nome_completo.toLowerCase().includes(pesquisa);
      const atendeUnidade =
        this.usuarioAtual()?.papel !== 'ADMIN' ||
        unidadesSelecionadas.length === 0 ||
        unidadesSelecionadas.includes(this.obterIdUnidade(usuario) ?? 0);

      return atendePesquisa && atendeUnidade;
    });
  }

  unidadesDisponiveis(): Unidade[] {
    const atual = this.usuarioAtual();
    if (!atual || atual.papel === 'ADMIN') {
      return this.unidades();
    }

    const unidadeId = this.obterIdUnidade(atual);
    return this.unidades().filter((unidade) => unidade.id === unidadeId);
  }

  podeCadastrarUsuarios(): boolean {
    return this.usuarioAtual()?.papel === 'ADMIN' || this.usuarioAtual()?.papel === 'GESTOR';
  }

  buscarUnidade() {
    this.unidadeService.get().subscribe({
      next: (unidade) => this.unidades.set(unidade),
      error: (erro) => console.error('Erro ao buscar unidade', erro),
    });
  }

  obterUnidade(usuario: Usuario): Unidade | undefined {
    return this.unidades().find((unidade) => unidade.id === usuario.unidade);
  }

  abrirModal(): void {
    this.usuarioFormulario = {
      id: 0,
      username: '',
      password: '',
      nome_completo: '',
      nome_social: '',
      cpf: '',
      email: '',
      date_joined: '',
      papel: '',
      unidade: null,
    };

    const atual = this.usuarioAtual();
    if (atual?.papel === 'GESTOR') {
      this.usuarioFormulario.unidade = this.obterIdUnidade(atual);
    }

    this.modoVisualizacao = false;
    this.modalAberto = true;
  }

  abrirVisualizacao(usuario: Usuario): void {
    this.usuarioFormulario = { ...usuario };
    this.modalAberto = true;
    this.modoVisualizacao = true;
  }

  cadastrarUsuario(): void {
    if(!this.usuarioFormulario){
      return
    }

    const dados = {
      username: this.usuarioFormulario.username,
      password: this.usuarioFormulario.password,
      nome_completo: this.usuarioFormulario.nome_completo,
      nome_social: this.usuarioFormulario.nome_social,
      cpf: this.usuarioFormulario.cpf,
      email: this.usuarioFormulario.email,
      papel: this.usuarioFormulario.papel,
      unidade: this.usuarioFormulario.unidade,
    }
    this.usuarioService.cadastrarUsuario(dados).subscribe({
      next: () => {
       alert('Usuario cadastrado com sucesso');
       this.buscarUsuarios();
       this.fecharModal();
      },
      error: (erro) => {
        console.error(
        'Erro ao cadastrar usuário:',
        erro
      );
      }
    })
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.modoVisualizacao = false;
    this.usuarioFormulario = null;
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

    this.usuarioService.excluirUsuario(id).subscribe({

      next: () => {
        console.log('Usuario excluido com sucesso');
        this.cancelarExclusao();
        this.buscarUsuarios();
      },
      error: (erro) => {
        console.error('Erro ao excluir usuário', erro);
      }
    })
    // TODO integração: DELETE /usuarios/{id}
    // e só remover da lista depois que a API responder com sucesso
  }

  modalAberto = false;
  modoVisualizacao = false;

  usuarioFormulario: any = null;

  get camposBloqueados(): boolean {
    return this.modoVisualizacao; // em visualização, tudo (exceto e-mail) fica travado
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
