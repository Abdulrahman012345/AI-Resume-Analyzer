
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

from .views import (
    ResumeUploadView,
    JobDescriptionCreateView,
    ResumeAnalysisView,
    RegisterView,
    ResumeHistoryView,
    DeleteAnalysisView,
    ViewAnalysisDetailView
)

urlpatterns = [
    # User Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Resume APIs
    path('resumes/', ResumeUploadView.as_view(), name='resume-upload'),
    path('job-description/', JobDescriptionCreateView.as_view(), name='job-description-create'),
    path('analyze/', ResumeAnalysisView.as_view(), name='resume-analysis'),

    # Resume History API
    path('history/', ResumeHistoryView.as_view(), name='resume-history'),

    # View Previous Analysis API
    path('history/<int:pk>/', ViewAnalysisDetailView.as_view(), name='view-analysis-detail'),

    # Delete Analysis API
    path('history/<int:pk>/delete/', DeleteAnalysisView.as_view(), name='delete-analysis'),
]
