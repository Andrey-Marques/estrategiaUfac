from rest_framework import viewsets
from .models import Unidade
from .serializers import UnidadeSerializer
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.db.models.deletion import ProtectedError


class PodeGerenciarUnidades(BasePermission):
     def has_permission(self, request, view):
          return bool(request.user and request.user.is_authenticated and (
               request.method in SAFE_METHODS or request.user.papel == 'ADMIN'
          ))

from iniciativasEstrategicas.models import IniciativaEstrategica
from projetosEstrategicos.models import ProjetoEstrategico
from indicadoresEstrategicos.models import IndicadorEstrategico

class UnidadeViewSet(viewsets.ModelViewSet):
     queryset = Unidade.objects.order_by('sigla', 'id')
     serializer_class = UnidadeSerializer
     permission_classes = [PodeGerenciarUnidades]

     def destroy(self, request, *args, **kwargs):
          try:
               return super().destroy(request, *args, **kwargs)
          except ProtectedError:
               return Response(
                    {'detail': 'Esta unidade não pode ser excluída porque possui usuários ou ações estratégicas vinculados.'},
                    status=409,
               )

class UnidadesPublicasView(APIView):
     permission_classes = [AllowAny]
     authentication_classes = []

     def get(self, request):
          unidades = Unidade.objects.order_by('sigla', 'id').values('id', 'nome', 'sigla')
          return Response(list(unidades))
     
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
