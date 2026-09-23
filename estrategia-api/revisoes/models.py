from django.db import models
from django.conf import settings


class RevisaoEdicao(models.Model):

    TIPO_ENTIDADE_CHOICES = [
        ('PROJETO', 'Projeto'),
        ('INICIATIVA', 'Iniciativa'),
        ('INDICADOR', 'Indicador'),
    ]

    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADA', 'Aprovada'),
        ('REJEITADA', 'Rejeitada'),
    ]

    entidade = models.CharField(max_length=20, choices=TIPO_ENTIDADE_CHOICES)
    entidade_id = models.PositiveIntegerField()
    dados_anteriores = models.JSONField()
    dados_propostos = models.JSONField()
    diferencas = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,  default='PENDENTE')
    observacao = models.TextField(blank=True,  default='')
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='revisoes_criadas')
    analisado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='revisoes_analisadas')
    criado_em = models.DateTimeField(auto_now_add=True)
    analisado_em = models.DateTimeField(null=True,  blank=True)
    
    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return (
            f'{self.entidade} '
            f'#{self.entidade_id} - '
            f'{self.status}'
        )