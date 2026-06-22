from rest_framework import serializers
from .models import Unidade

class UnidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidade 
        fields = '__all__'
        