from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand

from unidades.models import Unidade
from usuarios.models import Usuario
from objetivosEstrategicos.models import ObjetivoEstrategico
from projetosEstrategicos.models import ProjetoEstrategico, EvolucaoProjeto
from iniciativasEstrategicas.models import IniciativaEstrategica, AcaoRealizada
from indicadoresEstrategicos.models import IndicadorEstrategico, EvolucaoIndicador


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

        unidades_dados = [
            ('PROGRAD', 'Pró-Reitoria de Graduação'),
            ('PROPEG', 'Pró-Reitoria de Pesquisa e Pós-Graduação'),
            ('PROEX', 'Pró-Reitoria de Extensão e Cultura'),
            ('PROAES', 'Pró-Reitoria de Assuntos Estudantis'),
            ('PROINT', 'Pró-Reitoria de Inovação e Tecnologia'),
            ('PROPLAN', 'Pró-Reitoria de Planejamento'),
            ('PRAD', 'Pró-Reitoria de Administração'),
            ('PRODGEP', 'Pró-Reitoria de Desenvolvimento e Gestão de Pessoas'),
            ('ASCOM', 'Assessoria de Comunicação'),
            ('ACI', 'Assessoria de Cooperação Interinstitucional'),
            ('UEPMV', 'Unidade de Ensino e Pesquisa em Medicina Veterinária'),
            ('UTAL', 'Unidade de Tecnologia de Alimentos'),
            ('NIED', 'Núcleo de Interiorização e Educação a Distância'),
            ('AC', 'Arquivo Central'),
            ('EDUFAC', 'Editora Universitária'),
            ('CAP', 'Colégio de Aplicação'),
            ('BC', 'Biblioteca Central'),
            ('PZ', 'Parque Zoobotânico'),
            ('PREFCAM', 'Prefeitura do Campus'),
        ]

        unidades = {}

        for sigla, nome in unidades_dados:
            unidade, _ = Unidade.objects.update_or_create(
                sigla=sigla,
                defaults={
                    'nome': nome
                }
            )
            unidades[sigla] = unidade

        proplan = unidades['PROPLAN']
        proaes = unidades['PROAES']
        proex = unidades['PROEX']
        prograd = unidades['PROGRAD']

        self.stdout.write(
            self.style.SUCCESS(
                '✓ Unidades criadas'
            )
        )

        # =====================================================
        # FUNÇÃO AUXILIAR PARA CRIAR USUÁRIOS
        # =====================================================

        def criar_usuario(
            username,
            nome_completo,
            cpf,
            email,
            papel,
            unidade,
            is_staff=False,
            is_superuser=False
        ):
            usuario, criado = Usuario.objects.get_or_create(
                username=username,
                defaults={
                    'nome_completo': nome_completo,
                    'nome_social': '',
                    'cpf': cpf,
                    'email': email,
                    'papel': papel,
                    'unidade': unidade,
                    'is_staff': is_staff,
                    'is_superuser': is_superuser,
                }
            )

            # Mantém os dados do seed atualizados mesmo se o usuário já existir.
            campos_alterados = []

            dados_atualizados = {
                'nome_completo': nome_completo,
                'nome_social': '',
                'cpf': cpf,
                'email': email,
                'papel': papel,
                'unidade': unidade,
                'is_staff': is_staff,
                'is_superuser': is_superuser,
            }

            for campo, valor in dados_atualizados.items():
                if getattr(usuario, campo) != valor:
                    setattr(usuario, campo, valor)
                    campos_alterados.append(campo)

            if criado:
                usuario.set_password('123456')
                usuario.save()
            elif campos_alterados:
                usuario.save(update_fields=campos_alterados)

            return usuario

        # =====================================================
        # USUÁRIOS JÁ EXISTENTES
        # =====================================================

        admin = criar_usuario(
            username='admin',
            nome_completo='Administrador PROPLAN',
            cpf='000.000.000-01',
            email='admin.proplan@ufac.br',
            papel='ADMIN',
            unidade=proplan,
            is_staff=True,
            is_superuser=True
        )

        servidor_proaes = criar_usuario(
            username='servidorproaes',
            nome_completo='Raimundo Nonato',
            cpf='000.000.000-02',
            email='raimundo.proaes@ufac.br',
            papel='SERVIDOR',
            unidade=proaes
        )

        servidor_proex = criar_usuario(
            username='servidorproex',
            nome_completo='Maria da Silva',
            cpf='000.000.000-03',
            email='maria.proex@ufac.br',
            papel='SERVIDOR',
            unidade=proex
        )

        servidor_prograd = criar_usuario(
            username='servidorprograd',
            nome_completo='João da Costa',
            cpf='000.000.000-04',
            email='joao.prograd@ufac.br',
            papel='SERVIDOR',
            unidade=prograd
        )

        # =====================================================
        # GESTORES DAS UNIDADES QUE JÁ POSSUEM USUÁRIOS
        # =====================================================

        gestor_proplan = criar_usuario(
            username='gestorproplan',
            nome_completo='Gestor PROPLAN',
            cpf='000.000.000-05',
            email='gestor.proplan@ufac.br',
            papel='GESTOR',
            unidade=proplan
        )

        gestor_proaes = criar_usuario(
            username='gestorproaes',
            nome_completo='Gestor PROAES',
            cpf='000.000.000-06',
            email='gestor.proaes@ufac.br',
            papel='GESTOR',
            unidade=proaes
        )

        gestor_proex = criar_usuario(
            username='gestorproex',
            nome_completo='Gestor PROEX',
            cpf='000.000.000-07',
            email='gestor.proex@ufac.br',
            papel='GESTOR',
            unidade=proex
        )

        gestor_prograd = criar_usuario(
            username='gestorprograd',
            nome_completo='Gestor PROGRAD',
            cpf='000.000.000-08',
            email='gestor.prograd@ufac.br',
            papel='GESTOR',
            unidade=prograd
        )

        self.stdout.write(
            self.style.SUCCESS(
                '✓ Usuários e gestores criados'
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
                    'descricao': dados['descricao']
                }
            )

        objetivo1 = ObjetivoEstrategico.objects.get(codigo='OE1')
        objetivo3 = ObjetivoEstrategico.objects.get(codigo='OE3')
        objetivo8 = ObjetivoEstrategico.objects.get(codigo='OE8')
        objetivo12 = ObjetivoEstrategico.objects.get(codigo='OE12')

        self.stdout.write(
            self.style.SUCCESS(
                '✓ Objetivos estratégicos criados'
            )
        )

        # =====================================================
        # PROJETOS ESTRATÉGICOS
        # 4 projetos para cada unidade que já possui servidor
        # =====================================================

        projetos_dados = {
            'PROPLAN': [
                (
                    'Modernização da Gestão Institucional',
                    'Modernização dos processos administrativos e de planejamento.',
                    '24 meses', 150000.00, 45.00,
                    'Digitalização de processos e revisão dos fluxos institucionais.',
                    objetivo12
                ),
                (
                    'Gestão Integrada do Planejamento',
                    'Integração das informações de planejamento das unidades.',
                    '18 meses', 90000.00, 35.00,
                    'Implantar rotinas integradas de acompanhamento estratégico.',
                    objetivo12
                ),
                (
                    'Painel Estratégico Institucional',
                    'Desenvolvimento de mecanismos para acompanhamento da estratégia.',
                    '12 meses', 70000.00, 60.00,
                    'Consolidar indicadores e informações em painéis de gestão.',
                    objetivo12
                ),
                (
                    'Aprimoramento da Governança',
                    'Fortalecimento dos processos de governança institucional.',
                    '20 meses', 110000.00, 25.00,
                    'Revisar processos e estabelecer mecanismos de monitoramento.',
                    objetivo12
                ),
            ],
            'PROAES': [
                (
                    'Programa de Permanência Estudantil',
                    'Fortalecimento das políticas de permanência dos estudantes.',
                    '18 meses', 200000.00, 60.00,
                    'Ampliar ações de assistência e acompanhamento estudantil.',
                    objetivo8
                ),
                (
                    'Acompanhamento Acadêmico Estudantil',
                    'Acompanhamento dos estudantes atendidos pela assistência estudantil.',
                    '12 meses', 80000.00, 40.00,
                    'Criar rotinas de acompanhamento e atendimento aos estudantes.',
                    objetivo8
                ),
                (
                    'Inclusão e Acessibilidade Estudantil',
                    'Ampliação das ações de inclusão e acessibilidade.',
                    '24 meses', 130000.00, 30.00,
                    'Desenvolver ações de inclusão e apoio acadêmico.',
                    objetivo8
                ),
                (
                    'Fortalecimento da Assistência Estudantil',
                    'Melhoria dos serviços oferecidos aos estudantes.',
                    '16 meses', 160000.00, 55.00,
                    'Reestruturar serviços e ampliar ações de assistência.',
                    objetivo8
                ),
            ],
            'PROEX': [
                (
                    'UFAC e Comunidade',
                    'Ampliação da integração entre universidade e comunidade.',
                    '12 meses', 80000.00, 35.00,
                    'Realizar oficinas e atividades abertas à comunidade.',
                    objetivo3
                ),
                (
                    'Extensão nos Municípios',
                    'Ampliação das ações extensionistas nos municípios.',
                    '18 meses', 120000.00, 50.00,
                    'Promover atividades de extensão em diferentes municípios.',
                    objetivo3
                ),
                (
                    'Cultura e Universidade',
                    'Fortalecimento das ações culturais promovidas pela UFAC.',
                    '12 meses', 60000.00, 70.00,
                    'Realizar eventos e atividades artístico-culturais.',
                    objetivo3
                ),
                (
                    'Programa de Integração Social',
                    'Desenvolvimento de projetos de impacto social.',
                    '20 meses', 100000.00, 25.00,
                    'Executar projetos em parceria com comunidades locais.',
                    objetivo3
                ),
            ],
            'PROGRAD': [
                (
                    'Fortalecimento da Graduação',
                    'Melhoria da qualidade dos cursos de graduação.',
                    '24 meses', 120000.00, 50.00,
                    'Acompanhar cursos e desenvolver ações de melhoria acadêmica.',
                    objetivo1
                ),
                (
                    'Programa de Formação Acadêmica',
                    'Aprimoramento da formação dos estudantes de graduação.',
                    '18 meses', 95000.00, 40.00,
                    'Promover atividades complementares e apoio à formação.',
                    objetivo1
                ),
                (
                    'Modernização dos Cursos de Graduação',
                    'Atualização de processos e práticas acadêmicas.',
                    '24 meses', 180000.00, 30.00,
                    'Revisar processos acadêmicos e apoiar atualização dos cursos.',
                    objetivo1
                ),
                (
                    'Programa de Sucesso Acadêmico',
                    'Desenvolvimento de ações voltadas ao desempenho acadêmico.',
                    '16 meses', 85000.00, 65.00,
                    'Monitorar desempenho e implementar ações de apoio acadêmico.',
                    objetivo1
                ),
            ],
        }

        responsaveis = {
            'PROPLAN': gestor_proplan,
            'PROAES': gestor_proaes,
            'PROEX': gestor_proex,
            'PROGRAD': gestor_prograd,
        }

        projetos_criados = {}

        for sigla, dados_unidade in projetos_dados.items():
            projetos_criados[sigla] = []

            for (
                nome,
                descricao,
                tempo_estimado,
                custo_estimado,
                percentual,
                acoes,
                objetivo
            ) in dados_unidade:

                projeto, _ = ProjetoEstrategico.objects.update_or_create(
                    nome=nome,
                    defaults={
                        'descricao': descricao,
                        'tempo_estimado': tempo_estimado,
                        'custo_estimado': custo_estimado,
                        'percentual_progresso': percentual,
                        'status': 'APROVADO',
                        'acoes_previstas': acoes,
                        'unidade': unidades[sigla],
                        'responsavel': responsaveis[sigla],
                    }
                )

                projeto.objetivos.add(objetivo)
                projetos_criados[sigla].append(projeto)

        self.stdout.write(
            self.style.SUCCESS(
                '✓ 16 projetos estratégicos criados'
            )
        )

        # =====================================================
        # INICIATIVAS ESTRATÉGICAS
        # 4 iniciativas para cada unidade que já possui servidor
        # =====================================================

        iniciativas_dados = {
            'PROPLAN': [
                ('Digitalização dos Processos de Planejamento', 40, objetivo12),
                ('Integração dos Planos Institucionais', 55, objetivo12),
                ('Monitoramento da Estratégia', 65, objetivo12),
                ('Revisão de Processos de Governança', 30, objetivo12),
            ],
            'PROAES': [
                ('Acompanhamento da Permanência Estudantil', 55, objetivo8),
                ('Programa de Apoio ao Estudante', 45, objetivo8),
                ('Ações de Inclusão Acadêmica', 35, objetivo8),
                ('Melhoria dos Serviços Estudantis', 60, objetivo8),
            ],
            'PROEX': [
                ('Programa Universidade Aberta', 30, objetivo3),
                ('Extensão Itinerante', 50, objetivo3),
                ('Agenda Cultural UFAC', 70, objetivo3),
                ('Ações Comunitárias Integradas', 40, objetivo3),
            ],
            'PROGRAD': [
                ('Programa de Melhoria dos Cursos', 65, objetivo1),
                ('Acompanhamento da Formação Acadêmica', 50, objetivo1),
                ('Atualização das Práticas de Ensino', 35, objetivo1),
                ('Apoio ao Desempenho Acadêmico', 60, objetivo1),
            ],
        }

        for sigla, dados_unidade in iniciativas_dados.items():
            for indice, (nome, percentual, objetivo) in enumerate(dados_unidade):
                iniciativa, _ = IniciativaEstrategica.objects.update_or_create(
                    nome=nome,
                    defaults={
                        'observacao':
                            'Iniciativa criada para dados de teste do '
                            'sistema Estratégia UFAC.',
                        'percentual_evolucao': percentual,
                        'status': 'APROVADO',
                        'unidade': unidades[sigla],
                        'responsavel': responsaveis[sigla],
                        'projeto': projetos_criados[sigla][indice],
                    }
                )

                iniciativa.objetivos.add(objetivo)

        self.stdout.write(
            self.style.SUCCESS(
                '✓ 16 iniciativas estratégicas criadas'
            )
        )

        # =====================================================
        # INDICADORES ESTRATÉGICOS
        # 4 indicadores para cada unidade que já possui servidor
        # =====================================================

        indicadores_dados = {
            'PROPLAN': [
                ('Percentual de Processos Digitalizados', '%', objetivo12),
                ('Índice de Execução do Planejamento', '%', objetivo12),
                ('Índice de Acompanhamento Estratégico', '%', objetivo12),
                ('Índice de Processos Revisados', '%', objetivo12),
            ],
            'PROAES': [
                ('Taxa de Permanência Estudantil', '%', objetivo8),
                ('Taxa de Atendimento Estudantil', '%', objetivo8),
                ('Índice de Participação em Ações de Inclusão', '%', objetivo8),
                ('Índice de Satisfação com a Assistência', '%', objetivo8),
            ],
            'PROEX': [
                ('Participação em Ações de Extensão', 'Participantes', objetivo3),
                ('Quantidade de Ações Extensionistas', 'Ações', objetivo3),
                ('Participação em Atividades Culturais', 'Participantes', objetivo3),
                ('Projetos com Participação Comunitária', 'Projetos', objetivo3),
            ],
            'PROGRAD': [
                ('Taxa de Conclusão dos Cursos', '%', objetivo1),
                ('Taxa de Sucesso Acadêmico', '%', objetivo1),
                ('Índice de Cursos Acompanhados', '%', objetivo1),
                ('Índice de Participação em Ações Acadêmicas', '%', objetivo1),
            ],
        }

        for sigla, dados_unidade in indicadores_dados.items():
            for indice, (nome, unidade_medida, objetivo) in enumerate(dados_unidade):

                indicador, _ = IndicadorEstrategico.objects.update_or_create(
                    nome=nome,
                    defaults={
                        'polaridade': 'POSITIVA',
                        'finalidade':
                            'Acompanhar o desempenho das ações estratégicas '
                            'da unidade.',
                        'status': 'APROVADO',
                        'metodo_calculo':
                            'Relação entre o resultado alcançado e a meta '
                            'prevista no período.',
                        'formula':
                            r'\frac{Resultado\ Alcancado}{Meta\ Prevista}'
                            r'\times 100',
                        'unidade': unidades[sigla],
                        'objetivo': objetivo,
                        'responsavel': responsaveis[sigla],
                        'observacao':
                            'Indicador criado para dados de teste.',
                        'unidade_medida': unidade_medida,
                    }
                )

                EvolucaoIndicador.objects.get_or_create(
                    indicador=indicador,
                    ano='2026',
                    defaults={
                        'meta_prevista': str(70 + (indice * 5)),
                        'meta_alcancada': str(50 + (indice * 5)),
                    }
                )

        self.stdout.write(
            self.style.SUCCESS(
                '✓ 16 indicadores estratégicos criados'
            )
        )

        # =====================================================
        # COMPLEMENTAR REGISTROS SEM HISTÓRICO
        # Dados fictícios para demonstração. Preserva os históricos existentes.
        # Também contempla registros que já estavam no banco antes deste seed.
        # =====================================================

        realizacoes_adicionadas = 0
        proximos_passos_adicionados = 0
        acoes_adicionadas = 0
        evolucoes_adicionadas = 0

        for projeto in ProjetoEstrategico.objects.all().iterator():
            if not projeto.evolucoes.filter(tipo='REALIZACAO').exists():
                for descricao in (
                    f'Levantamento das necessidades e definição da equipe do projeto "{projeto.nome}" concluídos.',
                    f'Plano de execução do projeto "{projeto.nome}" elaborado e primeira etapa iniciada.',
                ):
                    EvolucaoProjeto.objects.get_or_create(
                        fk_projeto=projeto,
                        tipo='REALIZACAO',
                        descricao=descricao,
                    )
                    realizacoes_adicionadas += 1

            if not projeto.evolucoes.filter(tipo='PROXIMO_PASSO').exists():
                for descricao in (
                    f'Executar a próxima etapa do projeto "{projeto.nome}" conforme o plano de trabalho.',
                    f'Avaliar os resultados do projeto "{projeto.nome}" com a unidade responsável e atualizar o acompanhamento.',
                ):
                    EvolucaoProjeto.objects.get_or_create(
                        fk_projeto=projeto,
                        tipo='PROXIMO_PASSO',
                        descricao=descricao,
                    )
                    proximos_passos_adicionados += 1

        for iniciativa in IniciativaEstrategica.objects.all().iterator():
            if iniciativa.acoes_realizadas.exists():
                continue

            acoes_exemplo = (
                ('Levantamento de necessidades', date(2026, 2, 2), date(2026, 3, 31), Decimal('1500.00'), 'CONCLUIDA'),
                ('Execução das atividades previstas', date(2026, 4, 1), date(2026, 10, 30), Decimal('5000.00'), 'ANDAMENTO'),
                ('Avaliação dos resultados', date(2026, 11, 2), date(2026, 12, 18), Decimal('1000.00'), 'PLANEJAMENTO'),
            )
            for nome, inicio, fim, custo, status in acoes_exemplo:
                AcaoRealizada.objects.get_or_create(
                    fk_iniciativa=iniciativa,
                    nome=nome,
                    defaults={
                        'prazo_inicio': inicio,
                        'prazo_fim': fim,
                        'custo': custo,
                        'status': status,
                    },
                )
                acoes_adicionadas += 1

        for indicador in IndicadorEstrategico.objects.all().iterator():
            if indicador.evolucao_indicador.exists():
                continue

            # Metas fictícias na unidade de medida do indicador.
            # Percentuais ficam entre 0 e 100; contagens usam valores absolutos.
            percentual = indicador.unidade_medida.strip().lower() in (
                '%', 'percentual', 'porcentagem',
            )
            negativa = indicador.polaridade.strip().upper() == 'NEGATIVA'
            if percentual:
                historico = (('2025', '40', '45'), ('2026', '30', '35')) if negativa else (
                    ('2025', '70', '55'), ('2026', '80', '65'),
                )
            else:
                historico = (('2025', '100', '120'), ('2026', '80', '95')) if negativa else (
                    ('2025', '100', '80'), ('2026', '120', '100'),
                )

            for ano, prevista, alcancada in historico:
                EvolucaoIndicador.objects.get_or_create(
                    indicador=indicador,
                    ano=ano,
                    defaults={
                        'meta_prevista': prevista,
                        'meta_alcancada': alcancada,
                    },
                )
                evolucoes_adicionadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'✓ Históricos complementados: {realizacoes_adicionadas} realizações, '
            f'{proximos_passos_adicionados} próximos passos, '
            f'{acoes_adicionadas} ações e {evolucoes_adicionadas} evoluções de indicadores'
        ))

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
            'Senha padrão dos usuários criados: 123456'
        )
        self.stdout.write('')

        self.stdout.write('ADMIN PROPLAN')
        self.stdout.write('  usuário: admin')

        self.stdout.write('')
        self.stdout.write('SERVIDOR PROAES')
        self.stdout.write('  usuário: servidorproaes')

        self.stdout.write('')
        self.stdout.write('SERVIDOR PROEX')
        self.stdout.write('  usuário: servidorproex')

        self.stdout.write('')
        self.stdout.write('SERVIDOR PROGRAD')
        self.stdout.write('  usuário: servidorprograd')

        self.stdout.write('')
        self.stdout.write('GESTORES')
        self.stdout.write('  gestorproplan')
        self.stdout.write('  gestorproaes')
        self.stdout.write('  gestorproex')
        self.stdout.write('  gestorprograd')
