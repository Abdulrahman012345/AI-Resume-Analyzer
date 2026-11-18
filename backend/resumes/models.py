
from django.db import models
from django.conf import settings


# 1. Resume Model
class Resume(models.Model):

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='resumes'
    )

    file = models.FileField(
        upload_to='resumes/%Y/%m/'
    )

    original_name = models.CharField(
        max_length=255
    )

    size = models.PositiveIntegerField()

    extracted_text = models.TextField(
        blank=True,
        default=''
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.original_name


# 2. Job Description Model
class JobDescription(models.Model):

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='job_descriptions'
    )

    job_title = models.CharField(
        max_length=255
    )

    company_name = models.CharField(
        max_length=255,
        blank=True
    )

    description = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.job_title


# 3. Analysis Result Model
class AnalysisResult(models.Model):

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='analysis_results'
    )

    job_description = models.ForeignKey(
        JobDescription,
        on_delete=models.CASCADE,
        related_name='analysis_results'
    )

    match_score = models.FloatField(
        default=0
    )

    matched_skills = models.JSONField(
        default=list
    )

    missing_skills = models.JSONField(
        default=list
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Analysis {self.id} - {self.match_score}%"
