from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    PAPEL_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('UNIDADE', 'Unidade'),
        ('SERVIDOR', 'Servidor'),
    ]
    nome_completo = models.CharField(max_length=255)
    papel = models.CharField(max_length=10, choices = PAPEL_CHOICES, default ='SERVIDOR')
    unidade = models.ForeignKey('unidades.Unidade', on_delete= models.PROTECT, null=False,blank=True, related_name='usuarios')
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
    
    def __str__(self):
        return self.nome_completo or self.username

