from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Course, Module, Enrollment, ModuleCompletion
from .serializers import CourseSerializer, ModuleSerializer, EnrollmentSerializer
from users.views import IsTeacherOrAdmin


class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            enrolled_ids = user.enrollments.values_list('course_id', flat=True)
            return Course.objects.filter(id__in=enrolled_ids, status='published')
        return Course.objects.all()


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]


class ModuleListCreateView(generics.ListCreateAPIView):
    serializer_class = ModuleSerializer

    def get_queryset(self):
        return Module.objects.filter(course_id=self.kwargs['course_pk'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeacherOrAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['course_pk'])
        serializer.save(course=course)


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsTeacherOrAdmin]


class EnrollmentListCreateView(generics.ListCreateAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        qs = Enrollment.objects.all()
        course_id = self.request.query_params.get('course')
        student_id = self.request.query_params.get('student')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_courses(request):
    enrollments = Enrollment.objects.filter(student=request.user).select_related('course')
    return Response(EnrollmentSerializer(enrollments, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_module(request, pk):
    try:
        module = Module.objects.select_related('course').get(pk=pk)
    except Module.DoesNotExist:
        return Response({'error': 'Модуль не найден'}, status=404)

    ModuleCompletion.objects.get_or_create(student=request.user, module=module)

    enrollment = Enrollment.objects.filter(student=request.user, course=module.course).first()
    if enrollment:
        total = module.course.modules.count()
        completed = ModuleCompletion.objects.filter(
            student=request.user, module__course=module.course
        ).count()
        enrollment.progress = round(completed / total * 100) if total > 0 else 0
        enrollment.save()

    completed_ids = list(
        ModuleCompletion.objects.filter(
            student=request.user, module__course=module.course
        ).values_list('module_id', flat=True)
    )
    return Response({
        'progress': enrollment.progress if enrollment else 0,
        'completed_module_ids': completed_ids,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_completions(request):
    ids = ModuleCompletion.objects.filter(student=request.user).values_list('module_id', flat=True)
    return Response(list(ids))
