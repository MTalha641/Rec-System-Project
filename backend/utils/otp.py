import pyotp
import base64
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail

# Generate a secret key for the user
def generate_otp_secret():
    return pyotp.random_base32()

# Generate a time-based OTP
def generate_totp(secret):
    totp = pyotp.TOTP(secret)
    return totp.now()

# Verify a time-based OTP
def verify_totp(secret, token):
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

# Send OTP email
def send_otp_email(email, otp):
    subject = 'Your RentSpot OTP Code'
    message = f'''
Hello,

Your one-time password (OTP) for RentSpot account verification is: {otp}

This code will expire in 5 minutes for security reasons.

If you didn't request this code, please ignore this email or contact support if you have concerns.

This is an automated message, please do not reply to this email.

© 2025 RentSpot. All rights reserved.
    '''
    
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False 