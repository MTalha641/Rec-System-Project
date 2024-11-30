from rest_framework import status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.exceptions import NotAuthenticated
from rest_framework.decorators import action
from .models import Item
from .serializers import ItemSerializer

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
        
        # Filter out items where rentee_id matches the logged-in user's ID
        queryset = self.get_queryset().exclude(rentee_id=request.user.id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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
        
        # Log the authenticated user ID for debugging
        print(f"Authenticated User ID: {request.user.id}")
        
        # Ensure the logged-in user is set as the rentee
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
        # Automatically save the item with the logged-in user as the rentee
        serializer.save(rentee=self.request.user)
