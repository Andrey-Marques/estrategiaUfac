from django.db import models

class ProjetoEstrategico(models.Model):
    STATUS_CHOICES = [
        ('PLANEJAMENTO', 'Planejamento'),
        ('ANDAMENTO', 'Em andamento'),
        ('CONCLUIDA', 'Concluída'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    tempo_estimado = models.CharField(max_length=100)
    custo_estimado = models.DecimalField(max_digits=10, decimal_places=2)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    percentual_progresso = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default= 'PLANEJAMENTO') 
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.SET_NULL, null=True, blank=True, related_name='projetos_estrategicos')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='projetos_estrategicos')


    class Meta: 
        verbose_name = 'Projeto Estratégico'
        verbose_name_plural = 'Projetos Estratégicos'
        
    def __str__(self):
        return self.nome