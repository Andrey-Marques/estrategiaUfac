from django.db import models
from objetivosEstrategicos.models import ObjetivoEstrategico

class ProjetoEstrategico(models.Model):
  
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    tempo_estimado = models.CharField(max_length=100)
    custo_estimado = models.DecimalField(max_digits=20, decimal_places=2)
    ultima_atualizacao = models.DateTimeField(auto_now=True)
    percentual_progresso = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    acoes_previstas = models.TextField()
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.PROTECT, related_name='projetos_estrategicos')
    responsavel = models.ForeignKey('usuarios.Usuario', on_delete=models.PROTECT, related_name='projetos_estrategicos')
    objetivos = models.ManyToManyField(ObjetivoEstrategico,through='ObjetivoProjeto',related_name='projetos')


    class Meta: 
        verbose_name = 'Projeto Estratégico'
        verbose_name_plural = 'Projetos Estratégicos'
        
    def __str__(self):
        return self.nome
    
    
class EvolucaoProjeto(models.Model):
    realizacao = models.TextField()
    proximo_passo = models.TextField()
    fk_projeto = models.ForeignKey(ProjetoEstrategico, on_delete=models.CASCADE, related_name= 'evolucoes')
    
    class Meta:
        verbose_name = 'Evolução do Projeto'
        verbose_name_plural = 'Evoluções do Projeto'
        
    def __str__(self):
        return f'Evolução do Projeto: {self.fk_projeto.nome}'


class EvolucaoOrcamentaria(models.Model):
    valor = models.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    data_registro = models.DateTimeField(auto_now_add=True)
    fk_projeto = models.ForeignKey(ProjetoEstrategico, on_delete=models.CASCADE, related_name= 'evolucoesOrcamentarias')
    
    class Meta:
        verbose_name = 'Evolução Orçamentaria'
        verbose_name_plural = 'Evoluções Orçamentarias'
        
    def __str__(self):
        return f'Investido em {self.data_registro.strftime("%d/%m/%y")}: R$ {self.valor}'
    
class ObjetivoProjeto(models.Model):
    objetivo = models.ForeignKey(ObjetivoEstrategico,on_delete=models.CASCADE)
    projeto = models.ForeignKey(ProjetoEstrategico,on_delete=models.CASCADE)
    class Meta:
        unique_together = ('objetivo', 'projeto')