from django.db import models

class IniciativaEstrategica(models.Model):
    STATUS_CHOICES = [
        ('PLANEJAMENTO', 'Planejamento'),
        ('ANDAMENTO', 'Em andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    data_preenchimento = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True)
    percentual_evolucao = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default= 'PLANEJAMENTO') 
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.SET_NULL, null=True, blank=True, related_name='iniciativas_estrategicas')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='iniciativas_estrategicas')


    class Meta: 
        verbose_name = 'Iniciativa Estratégica'
        verbose_name_plural = 'Iniciativas Estratégicas'
        
    def __str__(self):
        return self.nome