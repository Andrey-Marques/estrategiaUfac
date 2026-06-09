from django.db import models

class Unidade(models.Model):
    nome = models.CharField(max_length=255)
    sigla = models.CharField(max_length=10, unique=True)
    
    class Meta:
        verbose_name = 'Unidade'
        verbose_name_plural = 'Unidades'
        
    def __str__(self):
        return self.nome
    
