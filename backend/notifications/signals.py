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
        # Handle newly created booking (notification to item owner)
        if created:
            # Notify the item owner that someone wants to rent their item
            item_owner = instance.item.rentee
            if item_owner:
                create_notification(
                    recipient=item_owner,
                    sender=instance.user,
                    notification_type='request',
                    message=f"{instance.user.username} requested to rent your {instance.item.title}",
                    reference_id=instance.id,
                    reference_type='booking'
                )
                logger.info(f"Created booking request notification for {item_owner.username}")
                
        # Not a new booking, so this is an update
        else:
            # Handle status change notifications
            if instance.status == 'approved':
                # Notify the renter that their request was approved
                create_notification(
                    recipient=instance.user,
                    sender=instance.item.rentee,
                    notification_type='approval',
                    message=f"Your rental request for {instance.item.title} has been approved!",
                    reference_id=instance.id,
                    reference_type='booking'
                )
                logger.info(f"Created approval notification for {instance.user.username}")
                
            elif instance.status == 'rejected':
                # Notify the renter that their request was rejected
                create_notification(
                    recipient=instance.user,
                    sender=instance.item.rentee,
                    notification_type='rejection',
                    message=f"Your rental request for {instance.item.title} has been rejected.",
                    reference_id=instance.id,
                    reference_type='booking'
                )
                logger.info(f"Created rejection notification for {instance.user.username}")
                
    except Exception as e:
        logger.error(f"Error creating booking notification: {str(e)}")
        # Don't raise the exception - we don't want to prevent the booking from being saved
        # if notification creation fails

# You can add more signals here for other notification types
# For example, when a rental period is about to end, when payment is received, etc. 