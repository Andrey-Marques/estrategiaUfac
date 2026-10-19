from rest_framework import serializers
from .models import Unidade

class UnidadeSerializer(serializers.ModelSerializer):
    def validate_sigla(self, value):
        value = value.strip().upper()
        unidades = Unidade.objects.filter(sigla__iexact=value)
        if self.instance:
            unidades = unidades.exclude(pk=self.instance.pk)
        if unidades.exists():
            raise serializers.ValidationError('Já existe uma unidade com esta sigla.')
        return value

    class Meta:
        model = Unidade 
        fields = '__all__'
