from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.functions import Lower, Trim, Replace


def cpf_sem_mascara():
    expressao = models.F('cpf')
    for caractere in ('.', '-', ' '):
        expressao = Replace(expressao, models.Value(caractere), models.Value(''))
    return expressao

class Usuario(AbstractUser):
    PAPEL_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('GESTOR', 'Gestor'),
        ('SERVIDOR', 'Servidor'),
    ]
    nome_completo = models.CharField(max_length=255)
    nome_social = models.CharField(max_length=255, blank=True, default='')
    cpf = models.CharField(max_length=14, blank=True, default='')
    papel = models.CharField(max_length=10, choices = PAPEL_CHOICES, default ='SERVIDOR')
    unidade = models.ForeignKey('unidades.Unidade', on_delete= models.PROTECT, null=True,blank=True, related_name='usuarios')
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        constraints = [
            models.UniqueConstraint(Lower(Trim('email')), condition=~models.Q(email=''), name='usuario_email_unico'),
            models.UniqueConstraint(cpf_sem_mascara(), condition=~models.Q(cpf=''), name='usuario_cpf_unico'),
        ]
    
    def __str__(self):
        return self.nome_completo or self.username


class TentativaLogin(models.Model):
    chave = models.CharField(max_length=80, unique=True)
    falhas = models.PositiveIntegerField(default=0)
    expira_em = models.DateTimeField(db_index=True)

