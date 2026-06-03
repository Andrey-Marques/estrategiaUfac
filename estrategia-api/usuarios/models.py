from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    PAPEL_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('SERVI', 'Servidor'),
    ]
    id = models.AutoField(primary_key=True)
    papel = models.CharField(max_length=5, choices = PAPEL_CHOICES, default ='SERVI')
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
    
    def __str__(self):
        return self.get_full_name() or self.username
    
