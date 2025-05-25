"""
Custom middleware examples for RentSpot
"""
import time
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """
    Logs all API requests with timing information
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code executed before the view
        start_time = time.time()
        
        # Log request details
        logger.info(f"Request: {request.method} {request.path}")
        
        # Call the next middleware/view
        response = self.get_response(request)
        
        # Code executed after the view
        duration = time.time() - start_time
        logger.info(f"Response: {response.status_code} - Duration: {duration:.2f}s")
        
        return response

class APIVersionMiddleware:
    """
    Adds API version to all responses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add version header to all API responses
        if request.path.startswith('/api/'):
            response['X-API-Version'] = '1.0'
        
        return response

class RateLimitMiddleware:
    """
    Simple rate limiting middleware
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.requests = {}  # In production, use Redis/database

    def __call__(self, request):
        # Get client IP
        ip = self.get_client_ip(request)
        
        # Check rate limit (100 requests per minute)
        current_time = time.time()
        if ip in self.requests:
            # Clean old requests
            self.requests[ip] = [req_time for req_time in self.requests[ip] 
                               if current_time - req_time < 60]
            
            # Check if limit exceeded
            if len(self.requests[ip]) >= 100:
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'detail': 'Too many requests. Try again later.'
                }, status=429)
        else:
            self.requests[ip] = []
        
        # Add current request
        self.requests[ip].append(current_time)
        
        return self.get_response(request)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class ErrorHandlingMiddleware:
    """
    Global error handling for API responses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            logger.error(f"Unhandled error: {str(e)}")
            
            # Return consistent error format for API
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Internal server error',
                    'detail': 'Something went wrong. Please try again.'
                }, status=500)
            
            # Re-raise for non-API requests
            raise

# Legacy-style middleware (using MiddlewareMixin)
class LegacyMiddlewareExample(MiddlewareMixin):
    """
    Example of old-style middleware
    """
    def process_request(self, request):
        # Called before view
        request.custom_data = "Added by middleware"
        return None  # Continue processing
    
    def process_response(self, request, response):
        # Called after view
        response['X-Custom-Header'] = 'RentSpot-API'
        return response 