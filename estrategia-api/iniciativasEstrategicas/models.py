from django.db import models
from objetivosEstrategicos.models import ObjetivoEstrategico

class IniciativaEstrategica(models.Model):
    STATUS_CHOICES = [
        ('APROVADO', 'Aprovado/Público'),
        ('REJEITADO', 'Rejeitado'),
        ('RASCUNHO', 'Rascunho'),
    ]
    nome = models.CharField(max_length=255)
    data_preenchimento = models.DateTimeField(auto_now_add=True)
    observacao = models.TextField(blank=True, null=True)
    percentual_evolucao = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) 
    status = models.CharField(max_length=20)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.PROTECT, related_name='iniciativas_estrategicas')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, related_name='iniciativas_estrategicas')
    projeto = models.ForeignKey('projetosEstrategicos.ProjetoEstrategico', on_delete=models.PROTECT, null=True, blank=True, related_name='iniciativas_estrategicas')
    objetivos = models.ManyToManyField(ObjetivoEstrategico,through='ObjetivoIniciativa',related_name='iniciativas')

    class Meta: 
        verbose_name = 'Iniciativa Estratégica'
        verbose_name_plural = 'Iniciativas Estratégicas'
        
    def __str__(self):
        return self.nome
    
class AcaoRealizada(models.Model):
    STATUS_CHOICES = [
        ('PLANEJAMENTO', 'Planejamento'),
        ('ANDAMENTO', 'Em andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    nome = models.CharField(max_length=255)
    prazo_inicio = models.DateField()
    prazo_fim = models.DateField()
    custo = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default= 'PLANEJAMENTO') 
    fk_iniciativa = models.ForeignKey(IniciativaEstrategica, on_delete=models.CASCADE, related_name='acoes_realizadas')
    
    class Meta:
        verbose_name = 'Ação Realizada'
        verbose_name_plural = 'Ações Realizadas'
    
    def __str__(self):
        return self.nome
    
class ObjetivoIniciativa(models.Model):
    objetivo = models.ForeignKey(ObjetivoEstrategico,on_delete=models.CASCADE)
    iniciativa = models.ForeignKey(IniciativaEstrategica,on_delete=models.CASCADE)
    class Meta:
        unique_together = ('objetivo', 'iniciativa')