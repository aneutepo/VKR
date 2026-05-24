from django.urls import path
from . import views

urlpatterns = [
    path('tests/',                                      views.TestListCreateView.as_view()),
    path('tests/<int:pk>/',                             views.TestDetailView.as_view()),
    path('tests/<int:test_pk>/questions/',              views.QuestionListCreateView.as_view()),
    path('tests/<int:test_pk>/submit/',                 views.submit_test),
    path('questions/<int:pk>/',                         views.QuestionDetailView.as_view()),
    path('questions/<int:question_pk>/answers/',        views.AnswerListCreateView.as_view()),
    path('answers/<int:pk>/',                           views.AnswerDetailView.as_view()),
    path('results/',                                    views.TestResultListCreateView.as_view()),
    path('course-results/',                             views.course_test_results),
]
