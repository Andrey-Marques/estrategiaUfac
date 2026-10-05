from django.test import TestCase
from datetime import date
from decimal import Decimal

from unidades.models import Unidade
from .models import AcaoProjeto, ProjetoEstrategico


class CustosAcoesProjetoTests(TestCase):
    def setUp(self):
        unidade = Unidade.objects.create(nome='Unidade teste', sigla='TEST')
        self.projeto = ProjetoEstrategico.objects.create(
            nome='Projeto teste',
            descricao='',
            tempo_estimado='',
            status='RASCUNHO',
            unidade=unidade,
        )

    def criar_acao(self, nome, estimado, realizado):
        return AcaoProjeto.objects.create(
            fk_projeto=self.projeto,
            nome=nome,
            prazo_inicio=date(2026, 1, 1),
            prazo_fim=date(2026, 12, 31),
            custo_estimado=Decimal(estimado),
            custo_realizado=Decimal(realizado),
        )

    def test_custos_do_projeto_refletem_a_soma_das_acoes(self):
        primeira = self.criar_acao('Ação 1', '100.00', '25.00')
        self.criar_acao('Ação 2', '200.00', '50.00')

        self.projeto.refresh_from_db()
        self.assertEqual(self.projeto.custo_estimado, Decimal('300.00'))
        self.assertEqual(self.projeto.custo_realizado_total, Decimal('75.00'))

        primeira.custo_estimado = Decimal('150.00')
        primeira.custo_realizado = Decimal('40.00')
        primeira.save()

        self.projeto.refresh_from_db()
        self.assertEqual(self.projeto.custo_estimado, Decimal('350.00'))
        self.assertEqual(self.projeto.custo_realizado_total, Decimal('90.00'))

        primeira.delete()
        self.projeto.refresh_from_db()
        self.assertEqual(self.projeto.custo_estimado, Decimal('200.00'))
        self.assertEqual(self.projeto.custo_realizado_total, Decimal('50.00'))
