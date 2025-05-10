# disputes/contextual_analyzer.py

import spacy
from sentence_transformers import SentenceTransformer, util

# Load models once at startup
nlp = spacy.load("en_core_web_sm")  # For Named Entity Recognition (NER)
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')  # For deep semantic comparison

class ContextualAnalyzer:
    def __init__(self):
        pass

    def extract_entities(self, text):
        """Extract important objects/parts mentioned in text."""
        doc = nlp(text)
        entities = [ent.text.lower() for ent in doc.ents if ent.label_ in ('PRODUCT', 'FAC', 'LOC', 'ORG')]
        return list(set(entities))  # Unique list
    
    def compute_sentence_similarity(self, sentence1, sentence2):
        """Compute semantic similarity between two sentences."""
        embedding1 = sentence_model.encode(sentence1, convert_to_tensor=True)
        embedding2 = sentence_model.encode(sentence2, convert_to_tensor=True)
        similarity = util.cos_sim(embedding1, embedding2)
        return similarity.item()  # scalar float

    def detect_condition_change(self, checkout_text, return_text):
        """Detect condition progression in reports."""
        checkout_doc = nlp(checkout_text)
        return_doc = nlp(return_text)

        checkout_sentences = [sent.text for sent in checkout_doc.sents]
        return_sentences = [sent.text for sent in return_doc.sents]

        changes = []

        for ret_sent in return_sentences:
            max_sim = 0
            best_checkout_sent = None

            for chk_sent in checkout_sentences:
                sim = self.compute_sentence_similarity(chk_sent, ret_sent)
                if sim > max_sim:
                    max_sim = sim
                    best_checkout_sent = chk_sent

            if max_sim < 0.6:
                changes.append({
                    'return_sentence': ret_sent,
                    'similarity_to_checkout': max_sim,
                    'best_match_checkout_sentence': best_checkout_sent
                })

        return changes