from rest_framework.routers import (DefaultRouter)
from .views import (RevisaoEdicaoViewSet)


router = DefaultRouter()
router.register('', RevisaoEdicaoViewSet, basename='revisoes')

urlpatterns = router.urls