import pyotp
import base64
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail

def generate_otp_secret():
    return pyotp.random_base32()

def generate_totp(secret):
    totp = pyotp.TOTP(secret)
    return totp.now()

def verify_totp(secret, token):
    print(f"=== OTP VERIFICATION UTILITY DEBUG ===")
    print(f"Secret: '{secret}'")
    print(f"Token: '{token}'")
    print(f"Token type: {type(token)}")
    
    if not secret:
        print("ERROR: No secret provided")
        return False
    
    if not token:
        print("ERROR: No token provided")
        return False
    
    try:
        totp = pyotp.TOTP(secret)
        
        current_otp = totp.now()
        print(f"Current valid OTP: '{current_otp}'")
        
        token_str = str(token).strip()
        print(f"Token as string: '{token_str}'")
        
        result = totp.verify(token_str)
        print(f"Current window verification result: {result}")
        
        if not result:
            print("Trying with clock drift tolerance...")
            result = totp.verify(token_str, valid_window=1)
            print(f"With tolerance verification result: {result}")
        
        if not result:
            import time
            current_time = int(time.time())
            prev_otp = totp.at(current_time - 30)
            next_otp = totp.at(current_time + 30)
            print(f"Previous window OTP (30s ago): '{prev_otp}'")
            print(f"Next window OTP (30s future): '{next_otp}'")
            print(f"Submitted token: '{token_str}'")
        
        return result
        
    except Exception as e:
        print(f"Exception in verify_totp: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

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

def test_otp_flow():
    """Test OTP generation and verification for debugging"""
    print("=== OTP FLOW TEST ===")
    
    secret = generate_otp_secret()
    print(f"Generated secret: {secret}")
    
    otp = generate_totp(secret)
    print(f"Generated OTP: {otp}")
    
    result1 = verify_totp(secret, otp)
    print(f"Immediate verification: {result1}")
    
    result2 = verify_totp(secret, str(otp))
    print(f"String verification: {result2}")
    
    result3 = verify_totp(secret, "123456")
    print(f"Wrong OTP verification: {result3}")
    
    return {
        'secret': secret,
        'otp': otp,
        'immediate_verify': result1,
        'string_verify': result2,
        'wrong_verify': result3
    } 