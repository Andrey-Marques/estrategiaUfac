from rest_framework import serializers
from .models import IniciativaEstrategica

class IniciativaEstrategicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IniciativaEstrategica
        fields = '__all__'