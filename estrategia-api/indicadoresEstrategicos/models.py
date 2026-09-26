from django.db import models

class IndicadorEstrategico(models.Model):
    
    nome = models.CharField(max_length=255)
    polaridade = models.CharField(max_length=50)
    finalidade = models.TextField()
    status = models.CharField(max_length=20)
    metodo_calculo = models.TextField()  
    formula = models.TextField() #-----deve armazenar o codigo latex da formula------
    unidade = models.ForeignKey('unidades.Unidade', on_delete= models.PROTECT, related_name= "indicador_estrategico" )
    objetivo = models.ForeignKey('objetivosEstrategicos.ObjetivoEstrategico', on_delete=models.PROTECT, related_name="indicador_estrategico")
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete = models.PROTECT, related_name="indicador_estrategico", null=True, blank=True)
    observacao = models.TextField(blank=True, null=True)
    unidade_medida = models.CharField(max_length=100, blank=True)
    data_envio = models.DateTimeField(auto_now_add=True)
    observacao_analise = models.TextField(blank=True, default='')
    class Meta:
        verbose_name = 'Indicador Estratégico'
        verbose_name_plural = 'Indicadores Estratégicos'
    
    def __str__(self):
        return self.nome


class EvolucaoIndicador(models.Model):
    meta_prevista = models.CharField(max_length=25)
    meta_alcancada = models.CharField(max_length=25)
    ano = models.CharField(max_length=25)
    indicador = models.ForeignKey(IndicadorEstrategico, on_delete=models.CASCADE, related_name='evolucao_indicador')
    
    class Meta:
        verbose_name = 'Evoluçaõ Indicador'
        verbose_name_plural = 'Evoluções indicador'
        
    def __str__(self):
        return f"{self.ano} - {self.meta_alcancada}"
        
    