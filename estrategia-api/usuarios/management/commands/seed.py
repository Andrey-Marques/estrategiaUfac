from django.core.management.base import BaseCommand

from unidades.models import Unidade
from usuarios.models import Usuario
from objetivosEstrategicos.models import ObjetivoEstrategico


class Command(BaseCommand):
    help = 'Popula o banco com dados iniciais do Estratégia UFAC'


    def handle(self, *args, **options):

        self.stdout.write(
            self.style.WARNING(
                'Iniciando criação dos dados de teste...'
            )
        )


        # =====================================================
        # UNIDADES
        # =====================================================

        proplan, _ = Unidade.objects.get_or_create(
            sigla='PROPLAN',
            defaults={
                'nome': 'Pró-Reitoria de Planejamento'
            }
        )

        proaes, _ = Unidade.objects.get_or_create(
            sigla='PROAES',
            defaults={
                'nome': 'Pró-Reitoria de Assuntos Estudantis'
            }
        )

        proex, _ = Unidade.objects.get_or_create(
            sigla='PROEX',
            defaults={
                'nome': 'Pró-Reitoria de Extensão e Cultura'
            }
        )

        prograd, _ = Unidade.objects.get_or_create(
            sigla='PROGRAD',
            defaults={
                'nome': 'Pró-Reitoria de Graduação'
            }
        )


        self.stdout.write(
            self.style.SUCCESS(
                '✓ Unidades criadas'
            )
        )


        # =====================================================
        # USUÁRIOS
        # =====================================================

        # -------------------------
        # ADMIN - PROPLAN
        # -------------------------

        admin, criado = Usuario.objects.get_or_create(
            username='admin',
            defaults={
                'nome_completo':
                    'Administrador PROPLAN',

                'nome_social':
                    '',

                'cpf':
                    '000.000.000-01',

                'email':
                    'admin.proplan@ufac.br',

                'papel':
                    'ADMIN',

                'unidade':
                    proplan,

                'is_staff':
                    True,

                'is_superuser':
                    True
            }
        )

        if criado:
            admin.set_password('123456')
            admin.save()


        # -------------------------
        # SERVIDOR - PROAES
        # -------------------------

        servidor_proaes, criado = (
            Usuario.objects.get_or_create(
                username='servidorproaes',
                defaults={
                    'nome_completo':
                        'Raimundo Nonato',

                    'nome_social':
                        '',

                    'cpf':
                        '000.000.000-02',

                    'email':
                        'raimundo.proaes@ufac.br',

                    'papel':
                        'SERVIDOR',

                    'unidade':
                        proaes
                }
            )
        )

        if criado:
            servidor_proaes.set_password(
                '123456'
            )
            servidor_proaes.save()


        # -------------------------
        # SERVIDOR - PROEX
        # -------------------------

        servidor_proex, criado = (
            Usuario.objects.get_or_create(
                username='servidorproex',
                defaults={
                    'nome_completo':
                        'Maria da Silva',

                    'nome_social':
                        '',

                    'cpf':
                        '000.000.000-03',

                    'email':
                        'maria.proex@ufac.br',

                    'papel':
                        'SERVIDOR',

                    'unidade':
                        proex
                }
            )
        )

        if criado:
            servidor_proex.set_password(
                '123456'
            )
            servidor_proex.save()


        # -------------------------
        # SERVIDOR - PROGRAD
        # -------------------------

        servidor_prograd, criado = (
            Usuario.objects.get_or_create(
                username='servidorprograd',
                defaults={
                    'nome_completo':
                        'João da Costa',

                    'nome_social':
                        '',

                    'cpf':
                        '000.000.000-04',

                    'email':
                        'joao.prograd@ufac.br',

                    'papel':
                        'SERVIDOR',

                    'unidade':
                        prograd
                }
            )
        )

        if criado:
            servidor_prograd.set_password(
                '123456'
            )
            servidor_prograd.save()


        self.stdout.write(
            self.style.SUCCESS(
                '✓ Usuários criados'
            )
        )


        # =====================================================
        # OBJETIVOS ESTRATÉGICOS
        # =====================================================

        objetivos = [
            {
                'codigo': 'OE1',
                'descricao':
                    'Ampliar o número de profissionais formados e '
                    'qualificados'
            },
            {
                'codigo': 'OE2',
                'descricao':
                    'Ampliar a produção de conhecimentos científicos '
                    'e artístico-culturais aplicados às necessidades '
                    'da sociedade'
            },
            {
                'codigo': 'OE3',
                'descricao':
                    'Desenvolver ações e projetos junto à sociedade '
                    'visando às melhorias sociais'
            },
            {
                'codigo': 'OE4',
                'descricao':
                    'Desenvolver soluções inovadoras visando à '
                    'transformação da realidade regional'
            },
            {
                'codigo': 'OE5',
                'descricao':
                    'Promover a melhoria da qualidade e a adequação '
                    'da oferta de cursos'
            },
            {
                'codigo': 'OE6',
                'descricao':
                    'Intensificar e integrar as ações relacionadas '
                    'ao ensino, pesquisa e extensão'
            },
            {
                'codigo': 'OE7',
                'descricao':
                    'Potencializar a produção científica '
                    'institucional'
            },
            {
                'codigo': 'OE8',
                'descricao':
                    'Fortalecer políticas de acesso, permanência e '
                    'sucesso no Ensino Superior'
            },
            {
                'codigo': 'OE9',
                'descricao':
                    'Promover um ambiente institucional que estimule '
                    'o empreendedorismo e a inovação'
            },
            {
                'codigo': 'OE10',
                'descricao':
                    'Aprimorar os mecanismos de inclusão com equidade, '
                    'garantindo a acessibilidade e o aprendizado do '
                    'estudante'
            },
            {
                'codigo': 'OE11',
                'descricao':
                    'Ampliar e qualificar parcerias estratégicas '
                    'nacionais e internacionais'
            },
            {
                'codigo': 'OE12',
                'descricao':
                    'Fortalecer os processos de governança '
                    'institucional'
            },
            {
                'codigo': 'OE13',
                'descricao':
                    'Fortalecer a comunicação institucional de forma '
                    'efetiva e transparente'
            },
            {
                'codigo': 'OE14',
                'descricao':
                    'Fortalecer políticas de valorização, motivação '
                    'e desenvolvimento dos servidores'
            },
            {
                'codigo': 'OE15',
                'descricao':
                    'Otimizar a força de trabalho alinhada às '
                    'necessidades estratégicas'
            },
            {
                'codigo': 'OE16',
                'descricao':
                    'Ampliar, otimizar e modernizar as instalações '
                    'físicas'
            },
            {
                'codigo': 'OE17',
                'descricao':
                    'Prover soluções de TIC alinhadas às necessidades '
                    'estratégicas'
            },
            {
                'codigo': 'OE18',
                'descricao':
                    'Viabilizar recursos orçamentários e financeiros '
                    'para a execução da estratégia'
            },
        ]


        for dados in objetivos:

            ObjetivoEstrategico.objects.update_or_create(
                codigo=dados['codigo'],
                defaults={
                    'descricao':
                        dados['descricao']
                }
            )


        self.stdout.write(
            self.style.SUCCESS(
                '✓ Objetivos estratégicos criados'
            )
        )


        # =====================================================
        # RESUMO
        # =====================================================

        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                '======================================'
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                'SEED EXECUTADO COM SUCESSO'
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                '======================================'
            )
        )

        self.stdout.write('')

        self.stdout.write(
            'Usuários disponíveis:'
        )

        self.stdout.write(
            'ADMIN PROPLAN'
        )

        self.stdout.write(
            '  usuário: admin'
        )

        self.stdout.write(
            '  senha:   123456'
        )

        self.stdout.write('')

        self.stdout.write(
            'SERVIDOR PROAES'
        )

        self.stdout.write(
            '  usuário: servidorproaes'
        )

        self.stdout.write(
            '  senha:   123456'
        )

        self.stdout.write('')

        self.stdout.write(
            'SERVIDOR PROEX'
        )

        self.stdout.write(
            '  usuário: servidorproex'
        )

        self.stdout.write(
            '  senha:   123456'
        )

        self.stdout.write('')

        self.stdout.write(
            'SERVIDOR PROGRAD'
        )

        self.stdout.write(
            '  usuário: servidorprograd'
        )

        self.stdout.write(
            '  senha:   123456'
        )