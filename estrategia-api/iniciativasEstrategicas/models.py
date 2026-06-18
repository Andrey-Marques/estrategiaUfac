from django.db import models

class IniciativaEstrategica(models.Model):
   
    
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    data_preenchimento = models.DateTimeField(auto_now_add=True)
    observacao = models.TextField(blank=True, null=True)
    percentual_evolucao = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) 
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.PROTECT, null=True, blank=True, related_name='iniciativas_estrategicas')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, null=True, blank=True, related_name='iniciativas_estrategicas')


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