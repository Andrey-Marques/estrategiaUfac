from django.db import models

StatusChoices = [
    ('Vigente', 'Vigente'),
    ('Expirado', 'Expirado'),
]

class Planejamento(models.Model):
    nome = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=StatusChoices, default='Vigente')
    
    class Meta:
        verbose_name = 'Planejamento'
        verbose_name_plural = 'Planejamentos'
    def __str__(self):
        return self.nome