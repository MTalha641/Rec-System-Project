from nltk.sentiment import SentimentIntensityAnalyzer
from sentence_transformers import SentenceTransformer, util

sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
sia = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    scores = sia.polarity_scores(text)
    return scores['compound'] 

def contextual_difference_score(text1, text2):
    """Compute context difference score using sentence embeddings."""
    embedding1 = sentence_model.encode(text1, convert_to_tensor=True)
    embedding2 = sentence_model.encode(text2, convert_to_tensor=True)
    similarity = util.cos_sim(embedding1, embedding2).item() 
    difference = 1 - similarity 
    return difference

def calculate_confidence_score(context_difference, dispute_negativity):
    
    confidence_factors = []
    
    if context_difference > 0.6 or context_difference < 0.2:
        confidence_factors.append(0.8)  
    else:
        confidence_factors.append(0.4)  
    
    if dispute_negativity > 0.4:
        confidence_factors.append(0.8)  
    elif dispute_negativity > 0.2:
        confidence_factors.append(0.6)  
    else:
        confidence_factors.append(0.4)  
    
    confidence = sum(confidence_factors) / len(confidence_factors)
    return min(max(confidence, 0.0), 1.0)  

def analyze_dispute(checkout_report, return_report, dispute_description):
    """Analyze dispute using contextual analysis and sentiment analysis."""
    
    context_difference = contextual_difference_score(checkout_report, return_report)
    
    checkout_sentiment = analyze_sentiment(checkout_report)
    return_sentiment = analyze_sentiment(return_report)
    dispute_sentiment = analyze_sentiment(dispute_description)
    
    outcome = 'none'
    at_fault = 'none'
    reasoning_factors = []
    
    context_score = context_difference * 0.7

    dispute_negativity_score = max(0, -dispute_sentiment) * 0.4
    print(f"Context Score: {context_score}, Dispute Negativity Score: {dispute_negativity_score}")
    total_score = context_score + dispute_negativity_score
    
    if total_score > 0.5:
        outcome = 'valid'
        at_fault = 'renter'
        reasoning_factors.append(f"High evidence score: {total_score:.2f}")
    elif total_score > 0.3:  
        if dispute_sentiment < -0.3:
            outcome = 'valid'
            at_fault = 'renter'
            reasoning_factors.append(f"Moderate evidence ({total_score:.2f}) + negative complaint")
        else:
            outcome = 'invalid'
            at_fault = 'none'
            reasoning_factors.append(f"Moderate evidence ({total_score:.2f}) but weak complaint")
    else:  
        outcome = 'invalid'
        at_fault = 'none'
        reasoning_factors.append(f"Low evidence score: {total_score:.2f}")
    
    if context_difference > 0.4:
        reasoning_factors.append(f"Significant contextual change: {context_difference:.2f}")
    if dispute_sentiment < -0.3:
        reasoning_factors.append(f"Strong negative dispute complaint: {dispute_sentiment:.2f}")
    
    analysis = "; ".join(reasoning_factors)
    
    confidence_score = calculate_confidence_score(
        context_difference, max(0, -dispute_sentiment)
    )
    
    return {
        'analysis': analysis,
        'outcome': outcome,
        'at_fault': at_fault,
        'confidence_score': confidence_score,
        'total_evidence_score': total_score,
        'context_difference': context_difference,
        'context_score': context_score,
        'checkout_sentiment': checkout_sentiment,
        'return_sentiment': return_sentiment,
        'dispute_sentiment': dispute_sentiment,
        'dispute_negativity_score': dispute_negativity_score,
    }