from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from bookings.models import Booking
from .views import create_notification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Booking)
def create_booking_notification(sender, instance, created, **kwargs):
    """
    Signal to create a notification when a booking is created or its status changes
    """
    try:
        renter = instance.user  
        item_owner = instance.item.rentee  
        
        if created:
            if item_owner:
                create_notification(
                    recipient=item_owner,  
                    sender=renter,
                    notification_type='request',
                    message=f"{renter.username} requested to rent your {instance.item.title}",
                    reference_id=instance.id,
                    reference_type='booking'
                )
                logger.info(f"Created booking request notification for {item_owner.username}")
                
        else:
            previous_status = getattr(instance, '_previous_status', None)
            current_status = instance.status
            
            if previous_status != current_status:
                if current_status == 'approved':
                    create_notification(
                        recipient=renter, 
                        sender=item_owner,
                        notification_type='approval',
                        message=f"Your rental request for {instance.item.title} has been approved!",
                        reference_id=instance.id,
                        reference_type='booking'
                    )
                    logger.info(f"Created approval notification for {renter.username}")
                    
                elif current_status == 'rejected':
                    create_notification(
                        recipient=renter,  
                        sender=item_owner,
                        notification_type='rejection',
                        message=f"Your rental request for {instance.item.title} has been rejected.",
                        reference_id=instance.id,
                        reference_type='booking'
                    )
                    logger.info(f"Created rejection notification for {renter.username}")
                    
    except Exception as e:
        logger.error(f"Error creating booking notification: {str(e)}")

@receiver(pre_save, sender=Booking)
def store_previous_status(sender, instance, **kwargs):
    """
    Store the previous status before saving, so we can detect changes
    """
    try:
        if instance.pk:
            prev_instance = Booking.objects.get(pk=instance.pk)
            instance._previous_status = prev_instance.status
        else:
            instance._previous_status = None
    except Exception as e:
        logger.error(f"Error in pre_save signal: {str(e)}")
        pass

