from transformers import pipeline
from django.db.models import Avg
from .models import Review

# Load BERT-based sentiment analysis model
sentiment_pipeline = pipeline("sentiment-analysis")

def calculate_review_score(rating, review_text, item_id):
    """Calculate an updated overall score (1-5) considering BERT analysis + past reviews & ratings"""

    sentiment_result = sentiment_pipeline(review_text)[0]["label"]
    sentiment_weight = {"POSITIVE": 0.5, "NEUTRAL": 0.25, "NEGATIVE": -0.5}
    sentiment_score = sentiment_weight.get(sentiment_result, 0.25)  
    review_length_weight = min(0.5, len(review_text.split()) / 40)  

    
    new_review_score = round((rating + sentiment_score + review_length_weight), 2)
    new_review_score = max(1, min(new_review_score, 5))

    past_reviews = Review.objects.filter(item_id=item_id)

    if not past_reviews.exists():
        return new_review_score

    past_avg_score = past_reviews.aggregate(Avg("overall_score"))["overall_score__avg"] or 0


    total_reviews = past_reviews.count() + 1  # Include new review
    final_score = round(((past_avg_score * past_reviews.count()) + new_review_score) / total_reviews, 2)

    return final_score
