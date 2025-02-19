from transformers import pipeline

sentiment_pipeline = pipeline("sentiment-analysis")

def analyze_sentiment(review_text):
    result = sentiment_pipeline(review_text)[0]["label"]
    return result  # Returns "POSITIVE", "NEGATIVE", or "NEUTRAL"
