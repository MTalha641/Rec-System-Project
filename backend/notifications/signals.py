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
        # Get the users involved in this booking
        renter = instance.user  # The user who wants to rent the item
        item_owner = instance.item.rentee  # The owner of the item (rentee)
        
        # Handle newly created booking (notification to item owner only)
        if created:
            # Notify the item owner that someone wants to rent their item
            if item_owner:
                create_notification(
                    recipient=item_owner,  # Only the item owner gets this notification
                    sender=renter,
                    notification_type='request',
                    message=f"{renter.username} requested to rent your {instance.item.title}",
                    reference_id=instance.id,
                    reference_type='booking'
                )
                logger.info(f"Created booking request notification for {item_owner.username}")
                
        # Not a new booking, so this is an update
        else:
            # Previous status (to detect changes)
            previous_status = getattr(instance, '_previous_status', None)
            current_status = instance.status
            
            # Only handle status changes
            if previous_status != current_status:
                # Handle status change notifications - only send to the renter, not the owner
                if current_status == 'approved':
                    # Notify ONLY the renter that their request was approved
                    create_notification(
                        recipient=renter,  # Only the renter gets this notification
                        sender=item_owner,
                        notification_type='approval',
                        message=f"Your rental request for {instance.item.title} has been approved!",
                        reference_id=instance.id,
                        reference_type='booking'
                    )
                    logger.info(f"Created approval notification for {renter.username}")
                    
                elif current_status == 'rejected':
                    # Notify ONLY the renter that their request was rejected
                    create_notification(
                        recipient=renter,  # Only the renter gets this notification
                        sender=item_owner,
                        notification_type='rejection',
                        message=f"Your rental request for {instance.item.title} has been rejected.",
                        reference_id=instance.id,
                        reference_type='booking'
                    )
                    logger.info(f"Created rejection notification for {renter.username}")
                    
    except Exception as e:
        logger.error(f"Error creating booking notification: {str(e)}")
        # Don't raise the exception - we don't want to prevent the booking from being saved
        # if notification creation fails

# Add pre_save signal to track status changes
@receiver(pre_save, sender=Booking)
def store_previous_status(sender, instance, **kwargs):
    """
    Store the previous status before saving, so we can detect changes
    """
    try:
        # If this is an existing object
        if instance.pk:
            # Get the previous instance from the database
            prev_instance = Booking.objects.get(pk=instance.pk)
            # Store its status on the instance being saved
            instance._previous_status = prev_instance.status
        else:
            # This is a new instance, no previous status
            instance._previous_status = None
    except Exception as e:
        logger.error(f"Error in pre_save signal: {str(e)}")
        # Don't propagate the error
        pass

# You can add more signals here for other notification types
# For example, when a rental period is about to end, when payment is received, etc. 