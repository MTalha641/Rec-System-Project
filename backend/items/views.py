from rest_framework import status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.exceptions import NotAuthenticated
from rest_framework.decorators import action
from .models import Item,SearchHistory, SavedItem
from .serializers import ItemSerializer,SearchHistorySerializer, SavedItemSerializer
from django.db.models import Q
from bookings.models import Booking
from django.db.models import Exists, OuterRef, Prefetch


class ItemViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for handling CRUD operations for the Item model.
    """
    serializer_class = ItemSerializer
    queryset = Item.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Handles GET requests to list all items.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='exclude-my-items')
    def exclude_my_items(self, request):
        """
        Handles GET requests to list all items excluding those created by the authenticated user.
        """
        if not request.user.is_authenticated:
            raise NotAuthenticated("User must be authenticated.")
        
        queryset = self.get_queryset().exclude(rentee_id=request.user.id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='myitems')
    def my_items(self, request):
        """
        Handles GET requests to list all items created by the authenticated user
        with booking information attached.
        """
        if not request.user.is_authenticated:
            raise NotAuthenticated("User must be authenticated.")
        
        queryset = self.get_queryset().filter(rentee=request.user)
        
        from django.db.models import Prefetch
        from bookings.models import Booking
        
        items_with_bookings = queryset.prefetch_related(
            Prefetch(
                'booking_set',
                queryset=Booking.objects.all().order_by('-created_at'),
                to_attr='latest_bookings'
            )
        )
        
        print(f"User ID: {request.user.id}")
        print(f"Found {items_with_bookings.count()} items for user {request.user.username}")
        
        serializer = self.get_serializer(items_with_bookings, many=True)
        
        data = serializer.data
        for i, item in enumerate(items_with_bookings):
            if hasattr(item, 'latest_bookings') and item.latest_bookings:
                latest_booking = item.latest_bookings[0]  
                data[i]['latest_booking'] = {
                    'id': latest_booking.id,
                    'status': latest_booking.status,
                    'delivery_status': latest_booking.delivery_status,
                    'return_status': latest_booking.return_status,
                    'start_date': latest_booking.start_date,
                    'end_date': latest_booking.end_date,
                    'created_at': latest_booking.created_at,
                }
        
        return Response(data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single item by ID.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new item.
        Automatically associates the logged-in user as the 'rentee'.
        """
        if not request.user.is_authenticated:
            raise NotAuthenticated("User must be authenticated.")
        
      
        print(f"Authenticated User ID: {request.user.id}")
        
        request.data['rentee'] = request.user.id
        
        serializer = ItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Handles PUT requests to update an existing item.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete an item.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Item deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        """
        Custom behavior for creating an item.
        Associates the 'rentee' field with the currently logged-in user.
        """
        serializer.save(rentee=self.request.user)

    @action(detail=False, methods=['get'], url_path='search')
    def search_items(self, request):
        """
        Search for items and log the search query along with the logged-in user's ID.
        """
        query = request.query_params.get('q', '').strip()  
        if not query:
            return Response({"detail": "Search query is required."}, status=status.HTTP_400_BAD_REQUEST)
    
        items = Item.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query)
        )
    
        serializer = ItemSerializer(items, many=True)
  
        relevant_item = items.first() if items.exists() else None
  
        search_entry = SearchHistory.objects.create(
            user=request.user,
            item=relevant_item,  
            search_query=query  
        )
        search_entry.save()
  
        return Response({
            "search_results": serializer.data,
            "message": f"Search for '{query}' logged successfully."
        }, status=status.HTTP_200_OK)

class SavedItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling CRUD operations for saved items.
    """
    queryset = SavedItem.objects.all()
    serializer_class = SavedItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only saved items belonging to the current user.
        """
        return SavedItem.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Save an item for the current user.
        """
        try:
            item_id = request.data.get('item')
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "Item not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        existing = SavedItem.objects.filter(user=request.user, item=item).first()
        if existing:
            return Response(
                {"message": "Item already saved"}, 
                status=status.HTTP_200_OK
            )
        
        saved_item = SavedItem.objects.create(user=request.user, item=item)
        serializer = self.get_serializer(saved_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def unsave(self, request, pk=None):
        """
        Remove an item from saved items.
        """
        print(f"Unsave request received for item ID: {pk}, User: {request.user.username}")
        try:
            try:
                item = Item.objects.get(id=pk)
                print(f"Item found: {item.title}")
            except Item.DoesNotExist:
                print(f"Item with ID {pk} does not exist")
                return Response(
                    {"error": f"Item with ID {pk} does not exist"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            try:
                saved_item = SavedItem.objects.get(user=request.user, item_id=pk)
                print(f"SavedItem found for {request.user.username} and item {pk}")
                saved_item.delete()
                print(f"SavedItem deleted successfully")
                return Response(
                    {"message": "Item removed from saved items"}, 
                    status=status.HTTP_204_NO_CONTENT
                )
            except SavedItem.DoesNotExist:
                print(f"No SavedItem found for user {request.user.username} and item {pk}")
                return Response(
                    {"error": "Item was not in your saved items"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            print(f"Error in unsave: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Toggle saved status for an item.
        """
        item_id = request.data.get('item')
        if not item_id:
            return Response(
                {"error": "Item ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response(
                {"error": "Item not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        saved = SavedItem.objects.filter(user=request.user, item=item).first()
        
        if saved:
            saved.delete()
            return Response(
                {"saved": False, "message": "Item removed from saved items"}, 
                status=status.HTTP_200_OK
            )
        else:
            SavedItem.objects.create(user=request.user, item=item)
            return Response(
                {"saved": True, "message": "Item saved successfully"}, 
                status=status.HTTP_201_CREATED
            )
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        Check if an item is saved by the user.
        """
        item_id = request.query_params.get('item')
        if not item_id:
            return Response(
                {"error": "Item ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_saved = SavedItem.objects.filter(
            user=request.user, 
            item_id=item_id
        ).exists()
        
        return Response({"is_saved": is_saved}, status=status.HTTP_200_OK)

    


    
