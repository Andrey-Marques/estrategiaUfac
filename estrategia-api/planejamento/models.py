from django.db import models
from django.core.exceptions import ValidationError

STATUS_CHOICES = [
    ('Vigente', 'Vigente'),
    ('Expirado', 'Expirado'),
]

class Planejamento(models.Model):
    nome = models.CharField(max_length=100)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Vigente')
    
    class Meta:
        verbose_name = 'Planejamento'
        verbose_name_plural = 'Planejamentos'
        
    def clean(self):
        super().clean()
        if self.data_fim < self.data_inicio:
            raise ValidationError('A data de fim não pode ser anterior à data de início.')
    
    def __str__(self):
        return self.nome