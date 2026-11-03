from django.db import models

StatusChoices = [
    ('Vigente', 'Vigente'),
    ('Expirado', 'Expirado'),
]

class PDI(models.Model):
    nome = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=StatusChoices, default='Vigente')
    planejamento = models.ForeignKey('planejamento.Planejamento', on_delete=models.CASCADE, related_name='pdis')
    
    
    class Meta:
        verbose_name = 'PDI'
        verbose_name_plural = 'PDIs'
    
    def __str__(self):
        return self.nome