from rest_framework import serializers
from .models import ProjetoEstrategico

class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjetoEstrategico
        fields = '__all__'