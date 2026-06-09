from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    PAPEL_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('UNIDADE', 'Unidade'),
        ('SERVIDOR', 'Servidor'),
    ]
    papel = models.CharField(max_length=10, choices = PAPEL_CHOICES, default ='SERVIDOR ')
    unidade = models.ForeignKey('unidades.Unidade', on_delete=models.SET_NULL, null=True,blank=True, related_name='usuarios')
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
    
    def __str__(self):
        return self.get_full_name() or self.username
    
