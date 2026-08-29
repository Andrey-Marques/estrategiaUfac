from rest_framework import viewsets
from .models import Unidade
from .serializers import UnidadeSerializer
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from iniciativasEstrategicas.models import IniciativaEstrategica
from projetosEstrategicos.models import ProjetoEstrategico
from indicadoresEstrategicos.models import IndicadorEstrategico

class UnidadeViewSet(viewsets.ModelViewSet):
     queryset = Unidade.objects.all()
     serializer_class = UnidadeSerializer
     
class ResumoUnidadeView(APIView):
     permission_classes = [IsAuthenticated]
     
     def get(self, request):
          unidade_id = request.user.unidade_id
          
          if not unidade_id:
               return Response({'iniciativas': 0, 'projetos': 0, 'indicadores': 0})
          
          return Response({
               'iniciativas': IniciativaEstrategica.objects.filter(unidade_id=unidade_id).count(),
               'projetos': ProjetoEstrategico.objects.filter(unidade_id = unidade_id).count(),
               'indicadores': IndicadorEstrategico.objects.filter(unidade_id=unidade_id).count()
               
               })