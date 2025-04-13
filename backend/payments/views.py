# import stripe
# from django.conf import settings
# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt

# stripe.api_key = settings.STRIPE_SECRET_KEY

# @csrf_exempt
# def create_checkout_session(request):
#     if request.method == "POST":
#         try:
#             session = stripe.checkout.Session.create(
#                 payment_method_types=["card"],
#                 line_items=[
#                     {
#                         "price_data": {
#                             "currency": "usd",
#                             "product_data": {"name": "Demo Payment"},
#                             "unit_amount": 5000,  # $50.00 in cents
#                         },
#                         "quantity": 1,
#                     },
#                 ],
#                 mode="payment",
#                 success_url="https://your-frontend.com/success",
#                 cancel_url="https://your-frontend.com/cancel",
#             )
#             return JsonResponse({"sessionId": session.id})
#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=500)
