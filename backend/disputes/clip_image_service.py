import torch
import clip
import numpy as np
from PIL import Image
import os
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple, Optional
import logging
from condition_reports.models import ItemConditionReport

logger = logging.getLogger(__name__)

class CLIPImageAnalysisService:
    def __init__(self):
        """Initialize CLIP model"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
            logger.info(f"CLIP model loaded on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load CLIP model: {e}")
            self.model = None
            self.preprocess = None
    
    def encode_image(self, image_path: str) -> Optional[np.ndarray]:
        """Encode a single image using CLIP"""
        if not os.path.exists(image_path):
            logger.warning(f"Image not found: {image_path}")
            return None
            
        try:
            image = Image.open(image_path).convert('RGB')
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            return image_features.cpu().numpy()
        except Exception as e:
            logger.error(f"Error encoding image {image_path}: {e}")
            return None
    
    def encode_text(self, text: str) -> Optional[np.ndarray]:
        """Encode text using CLIP"""
        try:
            text_input = clip.tokenize([text]).to(self.device)
            
            with torch.no_grad():
                text_features = self.model.encode_text(text_input)
                text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            
            return text_features.cpu().numpy()
        except Exception as e:
            logger.error(f"Error encoding text: {e}")
            return None
    
    def get_condition_report_images(self, booking_id: int) -> Dict[str, Optional[str]]:
        """Get checkout and return images from condition reports"""
        try:
            # Get checkout report
            checkout_report = ItemConditionReport.objects.filter(
                booking_id=booking_id,
                report_type='checkout'
            ).first()
            
            # Get return report  
            return_report = ItemConditionReport.objects.filter(
                booking_id=booking_id,
                report_type='return'
            ).first()
            
            checkout_image_path = None
            return_image_path = None
            
            if checkout_report and checkout_report.checkout_image:
                checkout_image_path = checkout_report.checkout_image.path
            
            if return_report and return_report.return_image:
                return_image_path = return_report.return_image.path
                
            return {
                'checkout_image': checkout_image_path,
                'return_image': return_image_path,
                'checkout_report': checkout_report,  # Keep for internal use
                'return_report': return_report       # Keep for internal use
            }
            
        except Exception as e:
            logger.error(f"Error getting condition report images: {e}")
            return {
                'checkout_image': None, 
                'return_image': None,
                'checkout_report': None,
                'return_report': None
            }
    
    def analyze_condition_change(self, booking_id: int) -> Dict:
        """Analyze condition change using checkout and return images"""
        if self.model is None:
            return {"error": "CLIP model not available"}
        
        # Get images from condition reports
        image_data = self.get_condition_report_images(booking_id)
        checkout_image_path = image_data['checkout_image']
        return_image_path = image_data['return_image']
        
        if not checkout_image_path or not return_image_path:
            return {
                "error": "Missing checkout or return images",
                "checkout_available": bool(checkout_image_path is not None),
                "return_available": bool(return_image_path is not None)
            }
        
        # Encode images
        checkout_features = self.encode_image(checkout_image_path)
        return_features = self.encode_image(return_image_path)
        
        if checkout_features is None or return_features is None:
            return {"error": "Failed to encode images"}
        
        # Calculate similarity
        similarity = cosine_similarity(checkout_features, return_features)[0][0]
        
        # Define damage queries
        damage_queries = [
            "pristine clean condition",
            "excellent condition item", 
            "minor wear and tear",
            "visible scratches on surface",
            "damaged item with scratches",
            "broken or cracked object",
            "stained or dirty surface", 
            "torn or ripped material",
            "dented or bent item",
            "missing parts or components",
            "worn out deteriorated condition"
        ]
        
        # Analyze damage in both images
        checkout_damage_scores = {}
        return_damage_scores = {}
        
        for query in damage_queries:
            # Checkout image analysis
            text_features = self.encode_text(query)
            if text_features is not None:
                checkout_score = cosine_similarity(checkout_features, text_features)[0][0]
                return_score = cosine_similarity(return_features, text_features)[0][0]
                
                checkout_damage_scores[query] = float(checkout_score)
                return_damage_scores[query] = float(return_score)
        
        # Calculate damage progression
        damage_progression = self._calculate_damage_progression(
            checkout_damage_scores, 
            return_damage_scores
        )
        
        # Make recommendation
        recommendation = self._make_condition_recommendation(
            similarity, 
            damage_progression,
            image_data['checkout_report'],
            image_data['return_report']
        )
        
        return {
            'similarity_score': float(similarity),
            'checkout_damage_analysis': checkout_damage_scores,
            'return_damage_analysis': return_damage_scores,
            'damage_progression': damage_progression,
            'recommendation': recommendation,
            'checkout_image_path': checkout_image_path,
            'return_image_path': return_image_path
        }
    
    def _calculate_damage_progression(self, checkout_scores: Dict, return_scores: Dict) -> Dict:
        """Calculate how damage has progressed from checkout to return"""
        progression = {}
        
        for damage_type in checkout_scores.keys():
            checkout_score = checkout_scores.get(damage_type, 0)
            return_score = return_scores.get(damage_type, 0)
            
            progression[damage_type] = {
                'checkout_score': float(checkout_score),
                'return_score': float(return_score),
                'change': float(return_score - checkout_score),
                'percentage_change': float(((return_score - checkout_score) / max(checkout_score, 0.01)) * 100)
            }
        
        return progression
    
    def _make_condition_recommendation(self, similarity: float, damage_progression: Dict, 
                                     checkout_report, return_report) -> Dict:
        """Make recommendation based on condition analysis"""
        
        # Calculate damage increase indicators
        damage_increases = []
        significant_damage_types = [
            "damaged item with scratches",
            "broken or cracked object", 
            "stained or dirty surface",
            "torn or ripped material",
            "dented or bent item"
        ]
        
        for damage_type in significant_damage_types:
            if damage_type in damage_progression:
                change = damage_progression[damage_type]['change']
                if change > 0:
                    damage_increases.append(change)
        
        avg_damage_increase = float(np.mean(damage_increases)) if damage_increases else 0.0
        max_damage_increase = float(max(damage_increases)) if damage_increases else 0.0
        
        # Decision logic
        confidence_score = 0.0
        reasoning = []
        
        # Factor 1: Image similarity (lower = more change)
        if similarity < 0.80:
            confidence_score += 0.4
            reasoning.append(f"Significant visual changes detected (similarity: {similarity:.3f})")
        elif similarity < 0.90:
            confidence_score += 0.2
            reasoning.append(f"Moderate visual changes detected (similarity: {similarity:.3f})")
        
        # Factor 2: Damage progression
        if avg_damage_increase > 0.15:
            confidence_score += 0.4
            reasoning.append(f"High average damage increase: {avg_damage_increase:.3f}")
        elif avg_damage_increase > 0.08:
            confidence_score += 0.2
            reasoning.append(f"Moderate damage increase: {avg_damage_increase:.3f}")
        
        # Factor 3: Maximum single damage increase
        if max_damage_increase > 0.20:
            confidence_score += 0.2
            reasoning.append(f"Severe damage detected: {max_damage_increase:.3f}")
        
        # Factor 4: Text analysis from condition reports
        if checkout_report and return_report:
            checkout_text = f"{checkout_report.overall_condition} {checkout_report.notes}"
            return_text = f"{return_report.overall_condition} {return_report.notes}"
            
            # Simple keyword analysis
            damage_keywords = ['damage', 'broken', 'scratch', 'stain', 'torn', 'crack']
            checkout_damage_count = sum(1 for word in damage_keywords if word in checkout_text.lower())
            return_damage_count = sum(1 for word in damage_keywords if word in return_text.lower())
            
            if return_damage_count > checkout_damage_count:
                confidence_score += 0.1
                reasoning.append("Text reports indicate increased damage")
        
        # Final recommendation
        if confidence_score > 0.6:
            outcome = 'valid'
            at_fault = 'renter'
        elif confidence_score > 0.3:
            outcome = 'valid' 
            at_fault = 'renter'
        else:
            outcome = 'invalid'
            at_fault = 'none'
        
        return {
            'confidence_score': float(min(confidence_score, 1.0)),
            'outcome': outcome,
            'at_fault': at_fault,
            'reasoning': reasoning,
            'damage_increase_score': avg_damage_increase,
            'max_damage_increase': max_damage_increase,
            'similarity_threshold_met': bool(similarity < 0.85)
        }

# Global instance
clip_service = CLIPImageAnalysisService() 