from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from items.models import SearchHistory, Item
import os
import django

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')  # Replace 'your_project' with your project's name
# django.setup()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommend_items(request):
    user = request.user

    # Fetch user's search history
    user_search_history = SearchHistory.objects.filter(user=user).values_list('item', flat=True)
    if not user_search_history.exists():
        return Response({"message": "No search history available for recommendations."})

    search_history_text = ' '.join(user_search_history)

    # Fetch all items
    items = Item.objects.all().values('id', 'title', 'category', 'sub_category', 'description')
    items_df = pd.DataFrame(items)

    if items_df.empty:
        return Response({"message": "No items available for recommendations."})

    # Combine item information into a single text field
    items_df['combined_text'] = items_df['title'] + " " + items_df['category'] + " " + items_df['sub_category'] + " " + items_df['description']

    # Vectorize the search history and items' combined text
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf_vectorizer.fit_transform(items_df['combined_text'])
    user_vector = tfidf_vectorizer.transform([search_history_text])

    # Compute similarity scores
    similarity_scores = cosine_similarity(user_vector, tfidf_matrix).flatten()
    items_df['similarity'] = similarity_scores

    # Sort items by similarity and select top 5
    recommended_items = items_df.sort_values(by='similarity', ascending=False).head(5)

    # Prepare the response
    recommendations = recommended_items[['id', 'title', 'similarity']].to_dict(orient='records')
    return Response({"recommendations": recommendations})
