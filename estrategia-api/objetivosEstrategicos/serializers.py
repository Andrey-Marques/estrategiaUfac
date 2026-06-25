from rest_framework import serializers
from .models import ObjetivoEstrategico

class ObjetivoEstrategicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjetivoEstrategico
        fields = '__all__'