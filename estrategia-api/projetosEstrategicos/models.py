from django.db import models
from django.db.models import Sum
from decimal import Decimal
from objetivosEstrategicos.models import ObjetivoEstrategico
from django.conf import settings

class ProjetoEstrategico(models.Model):
    STATUS_EXECUCAO_CHOICES = [
        ('ANDAMENTO', 'Em andamento'),
        ('DESCONTINUADO', 'Descontinuado'),
        ('CONCLUIDO', 'Concluído'),
    ]
    STATUS_CHOICES = [
        ('APROVADO', 'Aprovado/Público'),
        ('REJEITADO', 'Rejeitado'),
        ('RASCUNHO', 'Rascunho'),
        ('EM_ESPERA', 'Em Espera'),
    ]
  
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    tempo_estimado = models.CharField(max_length=100)
    custo_estimado = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    percentual_progresso = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20)
    status_execucao = models.CharField(max_length=20, choices=STATUS_EXECUCAO_CHOICES, default='ANDAMENTO')
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.PROTECT, related_name='projetos_estrategicos')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, related_name='projetos_estrategicos', null=True, blank=True)
    objetivos = models.ManyToManyField(ObjetivoEstrategico,through='ObjetivoProjeto',related_name='projetos')
    observacao_analise = models.TextField( blank=True, default='')
    data_analise = models.DateTimeField(null=True,blank=True)
    analisado_por = models.ForeignKey( settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name='projetos_analisados')


    class Meta: 
        verbose_name = 'Projeto Estratégico'
        verbose_name_plural = 'Projetos Estratégicos'
        
    def __str__(self):
        return self.nome

    @property
    def custo_realizado_total(self):
        return self.acoes.aggregate(total=Sum('custo_realizado'))['total'] or Decimal('0.00')

    def atualizar_custo_estimado(self):
        self.custo_estimado = self.acoes.aggregate(total=Sum('custo_estimado'))['total'] or Decimal('0.00')
        self.save(update_fields=['custo_estimado', 'ultima_atualizacao'])
    
    
class EvolucaoProjeto(models.Model):

    TIPO_CHOICES = [
        ('REALIZACAO', 'Realização'),
        ('PROXIMO_PASSO', 'Próximo passo'),
    ]
    descricao = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fk_projeto = models.ForeignKey(ProjetoEstrategico, on_delete=models.CASCADE, related_name='evolucoes')
    class Meta:
        verbose_name = 'Evolução do Projeto'
        verbose_name_plural = 'Evoluções do Projeto'

    def __str__(self):
        return (
            f'{self.get_tipo_display()}: '
            f'{self.descricao}'
        )


class AcaoProjeto(models.Model):
    STATUS_CHOICES = [
        ('PLANEJAMENTO', 'Planejamento'),
        ('ANDAMENTO', 'Em andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]

    nome = models.CharField(max_length=255)
    prazo_inicio = models.DateField()
    prazo_fim = models.DateField()
    custo_estimado = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    custo_realizado = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    data_inicio_efetivo = models.DateField(null=True, blank=True)
    data_fim_efetivo = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANEJAMENTO')
    fk_projeto = models.ForeignKey(ProjetoEstrategico, on_delete=models.CASCADE, related_name='acoes')

    class Meta:
        verbose_name = 'Ação do Projeto'
        verbose_name_plural = 'Ações do Projeto'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.fk_projeto.atualizar_custo_estimado()

    def delete(self, *args, **kwargs):
        projeto = self.fk_projeto
        resultado = super().delete(*args, **kwargs)
        projeto.atualizar_custo_estimado()
        return resultado

    def __str__(self):
        return self.nome


class ObjetivoProjeto(models.Model):
    objetivo = models.ForeignKey(ObjetivoEstrategico,on_delete=models.CASCADE)
    projeto = models.ForeignKey(ProjetoEstrategico,on_delete=models.CASCADE)
    class Meta:
        unique_together = ('objetivo', 'projeto')
