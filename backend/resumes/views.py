
import pdfplumber

from .gemini_service import get_gemini_insights
from .matching import analyze_resume
from .serializers import RegisterSerializer
from .models import Resume, JobDescription, AnalysisResult

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import (
    FormParser,
    MultiPartParser,
    JSONParser
)
from rest_framework.response import Response
from rest_framework.views import APIView


MAX_UPLOAD_BYTES = 5 * 1024 * 1024


class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):

        upload = request.FILES.get('file')

        if upload is None:
            return Response(
                {'error': 'No file was sent. Use the form field "file".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not upload.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'Only PDF files are accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if upload.size > MAX_UPLOAD_BYTES:
            return Response(
                {'error': 'File is larger than 5 MB.'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )

        header = upload.read(5)
        upload.seek(0)

        if header != b'%PDF-':
            return Response(
                {'error': 'File does not look like a PDF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            upload.seek(0)

            with pdfplumber.open(upload) as pdf:

                extracted_text = ""

                for page in pdf.pages:
                    page_text = page.extract_text()

                    if page_text:
                        extracted_text += page_text + "\n"

        except Exception as e:

            print("PDF EXTRACTION ERROR:", repr(e))

            return Response(
                {'error': 'Unable to read PDF file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not extracted_text.strip():
            return Response(
                {'error': 'No readable text found in PDF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        upload.seek(0)

        resume = Resume.objects.create(
            owner=request.user,
            file=upload,
            original_name=upload.name,
            size=upload.size,
            extracted_text=extracted_text
        )

        return Response(
            {
                'id': resume.id,
                'original_name': resume.original_name,
                'size': resume.size,
                'uploaded_at': resume.uploaded_at,
                'extracted_text': resume.extracted_text[:1000],
                'extracted_char_count': len(resume.extracted_text),
                'message': 'Resume uploaded and text extracted successfully.'
            },
            status=status.HTTP_201_CREATED
        )


class JobDescriptionCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):

        job_title = request.data.get('job_title')
        company_name = request.data.get('company_name', '')
        description = request.data.get('description')

        if not job_title or not description:
            return Response(
                {
                    'error': 'Job title and description are required.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        job = JobDescription.objects.create(
            owner=request.user,
            job_title=job_title,
            company_name=company_name,
            description=description
        )

        return Response(
            {
                'id': job.id,
                'job_title': job.job_title,
                'company_name': job.company_name,
                'description': job.description,
                'created_at': job.created_at,
                'message': 'Job Description saved successfully.'
            },
            status=status.HTTP_201_CREATED
        )


class ResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):

        resume_id = request.data.get('resume_id')
        job_id = request.data.get('job_description_id')

        if not resume_id or not job_id:
            return Response(
                {'error': 'resume_id and job_description_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resume = Resume.objects.get(
                id=resume_id,
                owner=request.user
            )

            job = JobDescription.objects.get(
                id=job_id,
                owner=request.user
            )

        except Resume.DoesNotExist:
            return Response(
                {'error': 'Resume not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        except JobDescription.DoesNotExist:
            return Response(
                {'error': 'Job Description not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not resume.extracted_text.strip():
            return Response(
                {'error': 'Resume has no extracted text.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 1: Existing Advanced Resume Analysis
        # This always runs, even if Gemini is unavailable.

        result = analyze_resume(
            resume.extracted_text,
            job.description
        )

        # Step 2: Gemini AI Analysis
        # If Gemini fails or Free Tier quota is exceeded,
        # the existing analysis will be used.

        ai_result = get_gemini_insights(
            resume.extracted_text,
            job.description
        )

        if ai_result:

            strengths = (
                ai_result.get('strengths')
                or result['strengths']
            )

            weaknesses = (
                ai_result.get('weaknesses')
                or result['weaknesses']
            )

            suggestions = (
                ai_result.get('suggestions')
                or result['suggestions']
            )

            ai_status = "success"

        else:

            strengths = result['strengths']
            weaknesses = result['weaknesses']
            suggestions = result['suggestions']

            ai_status = "unavailable"

        # Step 3: Save analysis in database

        analysis = AnalysisResult.objects.create(
            resume=resume,
            job_description=job,
            match_score=result['match_score'],
            matched_skills=result['matched_skills'],
            missing_skills=result['missing_skills']
        )

        # Step 4: Return complete ATS and AI report

        return Response(
            {
                'analysis_id': analysis.id,
                'resume_id': resume.id,
                'job_description_id': job.id,

                'ats_score': result['ats_score'],
                'match_score': result['match_score'],
                'section_score': result['section_score'],

                'resume_skills': result['resume_skills'],
                'required_skills': result['required_skills'],
                'matched_skills': result['matched_skills'],
                'missing_skills': result['missing_skills'],

                'found_sections': result['found_sections'],
                'missing_sections': result['missing_sections'],

                'strengths': strengths,
                'weaknesses': weaknesses,
                'suggestions': suggestions,

                'ai_status': ai_status,

                'message': 'Advanced Resume Analysis completed successfully.'
            },
            status=status.HTTP_200_OK
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    'message': 'User registered successfully!',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# Resume History API

class ResumeHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        analyses = AnalysisResult.objects.filter(
            resume__owner=request.user,
            job_description__owner=request.user
        ).select_related(
            'resume',
            'job_description'
        ).order_by('-created_at')

        history = []

        for analysis in analyses:

            history.append({
                "analysis_id": analysis.id,
                "resume_id": analysis.resume.id,
                "resume_name": analysis.resume.original_name,
                "job_description_id": analysis.job_description.id,
                "job_title": analysis.job_description.job_title,
                "company_name": analysis.job_description.company_name,
                "match_score": analysis.match_score,
                "matched_skills": analysis.matched_skills,
                "missing_skills": analysis.missing_skills,
                "created_at": analysis.created_at
            })

        return Response(
            {
                "count": len(history),
                "history": history
            },
            status=status.HTTP_200_OK
        )


# Delete Previous Analysis API

class DeleteAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        try:
            analysis = AnalysisResult.objects.get(
                id=pk,
                resume__owner=request.user,
                job_description__owner=request.user
            )

            analysis.delete()

            return Response(
                {
                    "message": "Analysis deleted successfully"
                },
                status=status.HTTP_200_OK
            )

        except AnalysisResult.DoesNotExist:

            return Response(
                {
                    "error": "Analysis not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )


# View Previous Analysis API

class ViewAnalysisDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        try:
            analysis = AnalysisResult.objects.select_related(
                'resume',
                'job_description'
            ).get(
                id=pk,
                resume__owner=request.user,
                job_description__owner=request.user
            )

            return Response(
                {
                    "analysis_id": analysis.id,
                    "resume_name": analysis.resume.original_name,
                    "job_title": analysis.job_description.job_title,
                    "company_name": analysis.job_description.company_name,
                    "match_score": analysis.match_score,
                    "matched_skills": analysis.matched_skills,
                    "missing_skills": analysis.missing_skills,
                    "created_at": analysis.created_at
                },
                status=status.HTTP_200_OK
            )

        except AnalysisResult.DoesNotExist:

            return Response(
                {
                    "error": "Analysis not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
