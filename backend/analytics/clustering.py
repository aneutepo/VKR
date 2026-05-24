"""
Гибридный алгоритм кластеризации: GKA + метод Уорда
Сегментация студентов: Проактивный / Средний / Апатичный
"""
import numpy as np
import random
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import silhouette_score, silhouette_samples
from sklearn.cluster import AgglomerativeClustering


def build_feature_matrix(metrics_qs):
    student_ids, features = [], []
    for m in metrics_qs:
        student_ids.append(m.student_id)
        features.append([
            m.total_time_minutes,
            m.session_count,
            m.content_views,
            m.test_attempts,
            m.avg_test_score,
        ])
    if not features:
        return [], np.array([])
    X = np.array(features, dtype=float)
    X_norm = MinMaxScaler().fit_transform(X)
    return student_ids, X_norm


def gka_init_centroids(X, k, population_size=20, generations=30):
    """Инициализация центроидов через генетический алгоритм"""
    n = len(X)

    def fitness(ind):
        centroids = X[ind]
        return -sum(min(np.linalg.norm(x - c) ** 2 for c in centroids) for x in X)

    population = [random.sample(range(n), k) for _ in range(population_size)]

    for _ in range(generations):
        scored = sorted(population, key=fitness, reverse=True)
        survivors = scored[:population_size // 2]
        children = []
        for i in range(0, len(survivors) - 1, 2):
            p1, p2 = survivors[i], survivors[i + 1]
            cut = random.randint(1, k - 1)
            child = list(set(p1[:cut] + p2[cut:]))
            while len(child) < k:
                child.append(random.randint(0, n - 1))
            if random.random() < 0.3:
                child[random.randint(0, k - 1)] = random.randint(0, n - 1)
            children.append(child[:k])
        population = survivors + children

    return X[max(population, key=fitness)]


def kmeans_gka(X, k, max_iter=100):
    centroids = gka_init_centroids(X, k)
    for _ in range(max_iter):
        dists = np.array([[np.linalg.norm(x - c) ** 2 for c in centroids] for x in X])
        labels = np.argmin(dists, axis=1)
        new_c = np.array([X[labels == j].mean(axis=0) if (labels == j).any() else centroids[j] for j in range(k)])
        if np.linalg.norm(new_c - centroids) < 1e-4:
            break
        centroids = new_c
    return labels


def run_hybrid_clustering(metrics_qs, n_clusters=3):
    student_ids, X = build_feature_matrix(metrics_qs)
    if len(student_ids) < 2:
        return {}, 0.0

    k = min(n_clusters, len(student_ids) - 1)

    labels_kmeans = kmeans_gka(X, k)
    labels_ward = AgglomerativeClustering(n_clusters=k, linkage='ward').fit_predict(X)

    score_k = silhouette_score(X, labels_kmeans) if len(set(labels_kmeans)) > 1 else 0
    score_w = silhouette_score(X, labels_ward) if len(set(labels_ward)) > 1 else 0

    if score_w >= score_k:
        labels, global_score = labels_ward, score_w
    else:
        labels, global_score = labels_kmeans, score_k

    individual = silhouette_samples(X, labels)

    # Определяем семантику: сортируем кластеры по средней вовлечённости
    cluster_means = {c: X[labels == c].mean() for c in set(labels)}
    sorted_clusters = sorted(cluster_means, key=cluster_means.get, reverse=True)
    pattern_map = {c: i for i, c in enumerate(sorted_clusters)}

    results = {}
    for i, sid in enumerate(student_ids):
        results[sid] = {
            'cluster': int(labels[i]),
            'pattern_index': pattern_map[int(labels[i])],
            'silhouette': round(float(individual[i]), 4),
            'features': X[i].tolist(),
        }
    return results, round(float(global_score), 4)


def get_recommendation(pattern_name):
    recs = {
        'Проактивный': 'Высокая вовлечённость. Рекомендуется предложить дополнительные материалы углублённого уровня.',
        'Средний': 'Умеренная активность. Рекомендуется направлять напоминания о дедлайнах и добавлять практические задания.',
        'Апатичный': 'Низкая активность — группа риска. Требуется срочное внимание преподавателя и коррекция образовательной траектории.',
    }
    return recs.get(pattern_name, 'Нет данных.')
