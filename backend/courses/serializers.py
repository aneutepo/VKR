from rest_framework import serializers
from .models import Course, Module, Enrollment


class ModuleTestSerializer(serializers.Serializer):
    id             = serializers.IntegerField()
    title          = serializers.CharField()
    max_score      = serializers.FloatField()
    passing_score  = serializers.FloatField()
    question_count = serializers.SerializerMethodField()

    def get_question_count(self, obj):
        return obj.questions.count()


class ModuleSerializer(serializers.ModelSerializer):
    tests = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'content', 'tests']

    def get_tests(self, obj):
        return ModuleTestSerializer(obj.tests.all(), many=True).data


class CourseSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'author', 'author_name',
                  'status', 'created_at', 'updated_at', 'modules', 'enrolled_count']
        read_only_fields = ['created_at', 'updated_at', 'author']

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name   = serializers.CharField(source='student.full_name', read_only=True)
    course_title   = serializers.CharField(source='course.title', read_only=True)
    course_modules = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_title',
                  'enrolled_at', 'progress', 'course_modules']
        read_only_fields = ['enrolled_at']

    def get_course_modules(self, obj):
        return ModuleSerializer(obj.course.modules.all(), many=True).data
