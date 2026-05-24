from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg
from .models import Test, Question, Answer, TestResult
from users.views import IsTeacherOrAdmin
from activity_tracker.models import StudentMetrics


# ── Serializers ────────────────────────────────────────────────────────────────

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'test', 'text', 'question_type', 'order', 'answers']
        read_only_fields = ['test']


class TestSerializer(serializers.ModelSerializer):
    questions      = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'module', 'title', 'max_score', 'passing_score',
                  'question_count', 'questions']

    def get_question_count(self, obj):
        return obj.questions.count()


class TestResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    test_title   = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestResult
        fields = ['id', 'student', 'student_name', 'test', 'test_title',
                  'score', 'attempts', 'passed', 'completed_at']
        read_only_fields = ['completed_at', 'passed']


# ── Test views ─────────────────────────────────────────────────────────────────

class TestListCreateView(generics.ListCreateAPIView):
    serializer_class = TestSerializer

    def get_permissions(self):
        return [IsTeacherOrAdmin()] if self.request.method == 'POST' else [permissions.IsAuthenticated()]

    def get_queryset(self):
        module_id = self.request.query_params.get('module')
        return Test.objects.filter(module_id=module_id) if module_id else Test.objects.all()


class TestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all()
    serializer_class = TestSerializer

    def get_permissions(self):
        return [IsTeacherOrAdmin()] if self.request.method != 'GET' else [permissions.IsAuthenticated()]


# ── Question views ─────────────────────────────────────────────────────────────

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        return Question.objects.filter(test_id=self.kwargs['test_pk'])

    def perform_create(self, serializer):
        test = Test.objects.get(pk=self.kwargs['test_pk'])
        last_order = Question.objects.filter(test=test).count()
        serializer.save(test=test, order=last_order)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrAdmin]


# ── Answer views ───────────────────────────────────────────────────────────────

class AnswerListCreateView(generics.ListCreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        return Answer.objects.filter(question_id=self.kwargs['question_pk'])

    def perform_create(self, serializer):
        serializer.save(question_id=self.kwargs['question_pk'])


class AnswerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    permission_classes = [IsTeacherOrAdmin]


# ── Test results ───────────────────────────────────────────────────────────────

class TestResultListCreateView(generics.ListCreateAPIView):
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return TestResult.objects.filter(student=user) if user.role == 'student' else TestResult.objects.all()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_test(request, test_pk):
    """Студент сдаёт тест: принимает {answers: [answer_id, ...]}, считает балл."""
    try:
        test = Test.objects.prefetch_related('questions__answers').get(pk=test_pk)
    except Test.DoesNotExist:
        return Response({'error': 'Тест не найден'}, status=404)

    submitted_ids = set(request.data.get('answers', []))
    questions = test.questions.all()

    if not questions:
        return Response({'error': 'В тесте нет вопросов'}, status=400)

    correct_q = 0
    for q in questions:
        correct_ids  = set(q.answers.filter(is_correct=True).values_list('id', flat=True))
        selected_ids = submitted_ids & set(q.answers.values_list('id', flat=True))
        if q.question_type == Question.TYPE_SINGLE:
            if selected_ids == correct_ids:
                correct_q += 1
        else:
            if selected_ids == correct_ids:
                correct_q += 1

    score = round((correct_q / len(questions)) * test.max_score, 1)

    existing = TestResult.objects.filter(student=request.user, test=test).first()
    if existing:
        existing.score    = max(existing.score, score)
        existing.attempts += 1
        existing.save()
        result = existing
    else:
        result = TestResult.objects.create(student=request.user, test=test, score=score)

    course = test.module.course
    metrics_obj, _ = StudentMetrics.objects.get_or_create(student=request.user, course=course)
    course_results = TestResult.objects.filter(student=request.user, test__module__course=course)
    metrics_obj.test_attempts = course_results.count()
    avg = course_results.aggregate(avg=Avg('score'))['avg']
    metrics_obj.avg_test_score = round(avg, 2) if avg else 0
    metrics_obj.save(update_fields=['test_attempts', 'avg_test_score'])

    from notifications.utils import notify
    if result.passed:
        notify(
            user=request.user,
            title=f'Тест «{test.title}» сдан!',
            message=f'Вы успешно прошли тест и набрали {score} баллов ({correct_q} из {len(questions)} верных ответов). Поздравляем!',
            notif_type='success',
        )
    else:
        notify(
            user=request.user,
            title=f'Тест «{test.title}» не пройден',
            message=f'Вы набрали {score} баллов ({correct_q} из {len(questions)} верных ответов). Проходной балл: {test.passing_score}. Попробуйте ещё раз.',
            notif_type='warning',
        )

    return Response({
        'score': score,
        'passed': result.passed,
        'correct': correct_q,
        'total': len(questions),
    })


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def course_test_results(request):
    course_id = request.query_params.get('course_id')
    qs = (TestResult.objects.filter(test__module__course_id=course_id)
          .select_related('student', 'test') if course_id else TestResult.objects.none())
    return Response(TestResultSerializer(qs, many=True).data)
