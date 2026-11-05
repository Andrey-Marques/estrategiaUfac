from django.db import models
from django.core.exceptions import ValidationError

STATUS_CHOICES = [
    ('Vigente', 'Vigente'),
    ('Expirado', 'Expirado'),
]

class PDI(models.Model):
    nome = models.CharField(max_length=100)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Vigente')
    planejamento = models.ForeignKey('planejamento.Planejamento', on_delete=models.CASCADE, related_name='pdis')
    
    
    class Meta:
        verbose_name = 'PDI'
        verbose_name_plural = 'PDIs'
            
    def clean(self):
        super().clean()
        if self.data_fim < self.data_inicio:
            raise ValidationError('A data de fim não pode ser anterior à data de início.')
        if self.planejamento_id and (
            self.data_inicio < self.planejamento.data_inicio
            or self.data_fim > self.planejamento.data_fim
        ):
            raise ValidationError('O período do PDI deve estar dentro do período do planejamento escolhido.')

    def __str__(self):
        return self.nome