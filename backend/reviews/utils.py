from transformers import pipeline
from django.db.models import Avg
from .models import Review

sentiment_pipeline = pipeline("sentiment-analysis")

def calculate_overall_score(item_id):
    past_reviews = Review.objects.filter(item_id=item_id)

    if not past_reviews.exists():
        return 0

    total_score = 0
    total_reviews = past_reviews.count()

    for review in past_reviews:
        sentiment_result = sentiment_pipeline(review.review)[0]["label"]

        sentiment_weight = {"POSITIVE": 0.5, "NEUTRAL": 0.25, "NEGATIVE": -0.5}
        sentiment_score = sentiment_weight.get(sentiment_result, 0.25)  

        review_length_weight = min(0.5, len(review.review.split()) / 40)  

        adjusted_score = round((review.rating + sentiment_score + review_length_weight), 2)

        adjusted_score = max(1, min(adjusted_score, 5))

        total_score += adjusted_score

    overall_score = round(total_score / total_reviews, 2)
    
    return overall_score
