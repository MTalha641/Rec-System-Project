from .ai_service import analyze_dispute as analyze_text_dispute
from .clip_image_service import clip_service
from bookings.models import Booking
import logging

logger = logging.getLogger(__name__)

def analyze_dispute_with_images(dispute):
    """Enhanced dispute analysis using condition report images and text"""
    
    # Get text analysis (existing functionality)
    text_analysis = analyze_text_dispute(
        dispute.checkout_report,
        dispute.return_report, 
        dispute.description
    )
    
    # Get booking ID from dispute
    try:
        # Find the booking associated with this dispute
        # You might need to adjust this based on your model relationships
        booking = Booking.objects.filter(item=dispute.rental).first()
        if not booking:
            logger.warning(f"No booking found for dispute {dispute.id}")
            return {
                **text_analysis,
                'analysis_type': 'text_only',
                'error': 'No booking found for this dispute'
            }
        
        # Perform CLIP analysis on condition report images
        image_analysis = clip_service.analyze_condition_change(booking.id)
        
        if 'error' in image_analysis:
            logger.info(f"Image analysis failed for dispute {dispute.id}: {image_analysis['error']}")
            return {
                **text_analysis,
                'analysis_type': 'text_only',
                'image_error': image_analysis['error']
            }
        
        # Combine analyses
        combined_analysis = combine_text_and_image_analysis(text_analysis, image_analysis)
        return combined_analysis
        
    except Exception as e:
        logger.error(f"Error in enhanced dispute analysis: {str(e)}")
        return {
            **text_analysis,
            'analysis_type': 'text_only',
            'error': f'Failed to analyze images: {str(e)}'
        }

def combine_text_and_image_analysis(text_analysis, image_analysis):
    """Combine text and CLIP image analysis results"""
    
    text_confidence = text_analysis.get('confidence_score', 0.0)
    image_confidence = image_analysis['recommendation'].get('confidence_score', 0.0)
    
    # Weight image analysis more heavily (70% vs 30%) since it's more objective
    combined_confidence = (text_confidence * 0.3) + (image_confidence * 0.7)
    
    # Determine final recommendation
    text_outcome = text_analysis.get('outcome', 'none')
    image_outcome = image_analysis['recommendation'].get('outcome', 'none')
    text_at_fault = text_analysis.get('at_fault', 'none')
    image_at_fault = image_analysis['recommendation'].get('at_fault', 'none')
    
    # Agreement between both analyses increases confidence
    if text_outcome == image_outcome:
        final_outcome = text_outcome
        final_at_fault = text_at_fault
        final_confidence = min(combined_confidence * 1.2, 1.0)
        agreement_status = "Both analyses agree"
    # Strong image evidence takes precedence
    elif image_confidence > 0.7:
        final_outcome = image_outcome
        final_at_fault = image_at_fault
        final_confidence = combined_confidence
        agreement_status = "Image analysis has high confidence"
    # Strong text evidence
    elif text_confidence > 0.7:
        final_outcome = text_outcome
        final_at_fault = text_at_fault
        final_confidence = combined_confidence
        agreement_status = "Text analysis has high confidence"
    else:
        # Conflicting results with low confidence
        final_outcome = 'none'
        final_at_fault = 'none'
        final_confidence = combined_confidence * 0.6
        agreement_status = "Conflicting analyses, requires manual review"
    
    # Combine reasoning from both analyses
    text_reasoning = text_analysis.get('analysis', '')
    image_reasoning = '; '.join(image_analysis['recommendation'].get('reasoning', []))
    combined_reasoning = f"Text Analysis: {text_reasoning}; Image Analysis: {image_reasoning}; {agreement_status}"
    
    return {
        'analysis_type': 'combined_text_and_image',
        'text_analysis': text_analysis,
        'image_analysis': image_analysis,
        'outcome': final_outcome,
        'at_fault': final_at_fault,
        'combined_confidence': final_confidence,
        'text_confidence': text_confidence,
        'image_confidence': image_confidence,
        'image_similarity': image_analysis.get('similarity_score', 0.0),
        'damage_progression_score': image_analysis['recommendation'].get('damage_increase_score', 0.0),
        'reasoning': combined_reasoning,
        'agreement_status': agreement_status,
        'analysis': combined_reasoning  # For backward compatibility
    }

def get_booking_from_dispute(dispute):
    """Helper function to get booking from dispute"""
    try:
        # Try to find booking through different possible relationships
        booking = None
        
        # Method 1: Direct relationship (if exists)
        if hasattr(dispute, 'booking'):
            booking = dispute.booking
        
        # Method 2: Through rental item
        elif hasattr(dispute, 'rental'):
            booking = Booking.objects.filter(item=dispute.rental).first()
        
        # Method 3: Through rental ID (if rental is just an ID)
        else:
            booking = Booking.objects.filter(item_id=dispute.rental).first()
        
        return booking
    except Exception as e:
        logger.error(f"Error getting booking from dispute: {e}")
        return None 