from rest_framework.routers import DefaultRouter
from .views import PDIViewSet

router = DefaultRouter()
router.register('pdis', PDIViewSet, basename='pdi')

urlpatterns = router.urls
