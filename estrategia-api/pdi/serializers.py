from rest_framework import serializers
from .models import Planejamento

class PlanejamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planejamento
        fields = '__all__'