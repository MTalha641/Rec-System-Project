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

    # ✨ Decision Logic
    if similarity_score > 0.8 and not new_damage and context_difference < 0.3:
        # Reports very similar and no major context change
        outcome = 'invalid'
        at_fault = 'none'
        analysis = (
            f"The checkout and return reports are highly similar (similarity: {similarity_score:.2f}), "
            f"and context remains consistent (context difference: {context_difference:.2f}). "
            "No significant damage indicators found. Dispute appears invalid."
        )
    elif new_damage or return_sentiment < -0.3 or context_difference > 0.5:
        # New damage detected or negative sentiment or major context change
        outcome = 'valid'
        at_fault = 'renter'
        reasons = []
        if new_damage:
            reasons.append(f"new damage keywords detected ({', '.join(new_damage)})")
        if return_sentiment < -0.3:
            reasons.append(f"negative return sentiment ({return_sentiment:.2f})")
        if context_difference > 0.5:
            reasons.append(f"significant context shift ({context_difference:.2f})")
        analysis = " and ".join(reasons) + ". Dispute appears valid."
    elif dispute_sentiment < -0.3:
        # Even if reports are unclear, owner's complaint is strongly negative
        outcome = 'valid'
        at_fault = 'renter'
        analysis = (
            f"The dispute description shows strongly negative sentiment "
            f"(sentiment: {dispute_sentiment:.2f}), supporting owner's claim."
        )
    else:
        # Default: no clear evidence
        outcome = 'invalid'
        at_fault = 'none'
        analysis = (
            f"No clear damage or context issues found. Report similarity: {similarity_score:.2f}, "
            f"context difference: {context_difference:.2f}, checkout sentiment: {checkout_sentiment:.2f}, "
            f"return sentiment: {return_sentiment:.2f}, dispute sentiment: {dispute_sentiment:.2f}. "
            "Dispute appears invalid."
        )

    # ✨ Final structured response
    return {
        'analysis': analysis,
        'outcome': outcome,
        'at_fault': at_fault,
        'similarity_score': similarity_score,
        'context_difference': context_difference,
        'checkout_sentiment': checkout_sentiment,
        'return_sentiment': return_sentiment,
        'dispute_sentiment': dispute_sentiment,
        'new_damage_keywords': new_damage,
    }

