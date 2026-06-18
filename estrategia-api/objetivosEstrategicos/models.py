from django.db import models

class ObjetivoEstrategico(models.Model):
    codigo = models.CharField(max_length=8)
    descricao = models.TextField()
    unidade = models.ManyToManyField('unidades.Unidade', related_name='objetivos_estrategicos')
    
    class Meta:
        verbose_name = 'Objetivo Estratégico'
        verbose_name_plural = 'Objetivos Estratégicos'
        
    def __str__(self):
        return self.codigo
