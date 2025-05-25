from nltk.sentiment import SentimentIntensityAnalyzer
from disputes.contextual_analyzer import ContextualAnalyzer

contextual_analyzer = ContextualAnalyzer()

# Initialize once (can move to global if you want)
sia = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    """Analyze sentiment polarity of text"""
    scores = sia.polarity_scores(text)
    return scores['compound']  # Compound gives a final score between -1 (very negative) to 1 (very positive)


# disputes/ai_service.py
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords


from sentence_transformers import SentenceTransformer, util

# Load once at top of your ai_service.py
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

def contextual_difference_score(text1, text2):
    """Compute context difference score using sentence embeddings."""
    embedding1 = sentence_model.encode(text1, convert_to_tensor=True)
    embedding2 = sentence_model.encode(text2, convert_to_tensor=True)
    similarity = util.cos_sim(embedding1, embedding2).item()  # cosine similarity
    difference = 1 - similarity  # higher = more different
    return difference
# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

def preprocess_text(text):
    """Preprocess text for analysis"""
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and digits
    text = re.sub(r'\W', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [word for word in tokens if word not in stop_words]
    
    return ' '.join(tokens)

def compute_similarity(text1, text2):
    """Compute semantic similarity between two texts"""
    # Preprocess texts
    processed_text1 = preprocess_text(text1)
    processed_text2 = preprocess_text(text2)
    
    # Create TF-IDF vectors
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([processed_text1, processed_text2])
    
    # Compute cosine similarity
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    return similarity

def extract_key_differences(checkout_text, return_text):
    """Extract key differences between checkout and return reports"""
    # This is a simplified implementation
    # In a production system, you'd use more advanced NLP techniques
    
    checkout_tokens = set(preprocess_text(checkout_text).split())
    return_tokens = set(preprocess_text(return_text).split())
    
    # Find unique words in each report
    checkout_unique = checkout_tokens - return_tokens
    return_unique = return_tokens - checkout_tokens
    
    return checkout_unique, return_unique

def detect_damage_keywords(text):
    """Detect damage-related keywords in text"""
    damage_keywords = [
        'damage', 'damaged', 'broken', 'scratch', 'scratched', 'dent',
        'torn', 'stain', 'stained', 'missing', 'lost', 'crack', 'cracked'
    ]
    
    processed_text = preprocess_text(text)
    found_keywords = [word for word in damage_keywords if word in processed_text]
    
    return found_keywords

def calculate_confidence_score(similarity_score, context_difference, new_damage, sentiment_scores):
    """
    Calculate confidence score for AI prediction based on multiple factors
    Returns score between 0 and 1
    """
    confidence_factors = []
    
    # Factor 1: Similarity confidence
    if similarity_score > 0.8 or similarity_score < 0.3:
        confidence_factors.append(0.9)  # High confidence when very similar or very different
    else:
        confidence_factors.append(0.5)  # Medium confidence for borderline cases
    
    # Factor 2: Context difference confidence
    if context_difference > 0.6 or context_difference < 0.2:
        confidence_factors.append(0.8)  # High confidence for clear context changes
    else:
        confidence_factors.append(0.4)  # Lower confidence for ambiguous context
    
    # Factor 3: Damage keywords confidence
    if len(new_damage) > 2:
        confidence_factors.append(0.9)  # High confidence with multiple damage indicators
    elif len(new_damage) == 1:
        confidence_factors.append(0.6)  # Medium confidence with single damage indicator
    else:
        confidence_factors.append(0.7)  # Good confidence when no damage found
    
    # Factor 4: Sentiment confidence
    sentiment_change = abs(sentiment_scores['return'] - sentiment_scores['checkout'])
    if sentiment_change > 0.5:
        confidence_factors.append(0.8)  # High confidence for strong sentiment change
    else:
        confidence_factors.append(0.5)  # Medium confidence for small sentiment change
    
    # Calculate weighted average confidence
    confidence = sum(confidence_factors) / len(confidence_factors)
    return min(max(confidence, 0.0), 1.0)  # Ensure between 0 and 1

def analyze_dispute(checkout_report, return_report, dispute_description):
    """Analyze dispute between checkout and return reports with contextual, semantic, and sentiment analysis."""
    
    # Prepare texts
    checkout_text = f"{checkout_report}"
    return_text = f"{return_report}"
    
    # ✨ Compute semantic similarity
    similarity_score = compute_similarity(checkout_text, return_text)
    
    # ✨ Extract differences and damage keywords
    checkout_unique, return_unique = extract_key_differences(checkout_text, return_text)
    checkout_damage = detect_damage_keywords(checkout_text)
    return_damage = detect_damage_keywords(return_text)
    new_damage = [word for word in return_damage if word not in checkout_damage]
    
    # ✨ Perform sentiment analysis
    checkout_sentiment = analyze_sentiment(checkout_text)
    return_sentiment = analyze_sentiment(return_text)
    dispute_sentiment = analyze_sentiment(dispute_description)

    # ✨ Perform contextual analysis
    context_difference = contextual_difference_score(checkout_text, return_text)
    # (example: 0 = very similar context, 1 = very different context)

    # ✨ Decision Logic with enhanced reasoning
    outcome = 'none'
    at_fault = 'none'
    analysis = ""
    reasoning_factors = []

    # Enhanced decision logic with scoring
    damage_score = len(new_damage) * 0.3  # Each new damage keyword adds 0.3
    sentiment_score = max(0, checkout_sentiment - return_sentiment) * 0.5  # Sentiment deterioration
    context_score = context_difference * 0.4  # Context change weight
    similarity_penalty = max(0, 0.8 - similarity_score) * 0.6  # Penalty for low similarity
    
    total_score = damage_score + sentiment_score + context_score + similarity_penalty
    
    # Decision thresholds
    if total_score > 0.6:  # Strong evidence of damage
        outcome = 'valid'
        at_fault = 'renter'
        reasoning_factors.append(f"High damage evidence score: {total_score:.2f}")
    elif total_score > 0.3:  # Moderate evidence
        if dispute_sentiment < -0.4:  # Strong negative complaint
            outcome = 'valid'
            at_fault = 'renter'
            reasoning_factors.append(f"Moderate evidence ({total_score:.2f}) + strong negative complaint")
        else:
            outcome = 'invalid'
            at_fault = 'none'
            reasoning_factors.append(f"Moderate evidence ({total_score:.2f}) but weak complaint")
    else:  # Low evidence
        outcome = 'invalid'
        at_fault = 'none'
        reasoning_factors.append(f"Low damage evidence score: {total_score:.2f}")
    
    # Add specific evidence to reasoning
    if new_damage:
        reasoning_factors.append(f"New damage keywords: {', '.join(new_damage)}")
    if context_difference > 0.5:
        reasoning_factors.append(f"Significant context change: {context_difference:.2f}")
    if return_sentiment < -0.3:
        reasoning_factors.append(f"Negative return sentiment: {return_sentiment:.2f}")
    if similarity_score < 0.5:
        reasoning_factors.append(f"Low report similarity: {similarity_score:.2f}")
    
    analysis = "; ".join(reasoning_factors)
    
    # Calculate confidence score
    sentiment_scores = {
        'checkout': checkout_sentiment,
        'return': return_sentiment,
        'dispute': dispute_sentiment
    }
    confidence_score = calculate_confidence_score(
        similarity_score, context_difference, new_damage, sentiment_scores
    )

    # ✨ Final structured response with enhanced metrics
    return {
        'analysis': analysis,
        'outcome': outcome,
        'at_fault': at_fault,
        'confidence_score': confidence_score,
        'total_evidence_score': total_score,
        'similarity_score': similarity_score,
        'context_difference': context_difference,
        'checkout_sentiment': checkout_sentiment,
        'return_sentiment': return_sentiment,
        'dispute_sentiment': dispute_sentiment,
        'new_damage_keywords': new_damage,
        'damage_score': damage_score,
        'sentiment_score': sentiment_score,
        'context_score': context_score,
        'similarity_penalty': similarity_penalty,
    }

