import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from django.utils import timezone
from users.models import User
from items.models import Item, SearchHistory

# Content-Based Recommendations
def content_based_recommendations(user_id):
    try:
        # Fetch the user's interests
        user_profile = User.objects.get(id=user_id)
        user_interests = ' '.join(user_profile.interests or [])  # Handle missing interests with an empty list

        # Fetch search history (titles from items only)
        search_history_items = SearchHistory.objects.filter(user_id=user_id, item__isnull=False).values_list('item__title', flat=True)

        # Combine user interests and search history
        search_history_text = ' '.join(search_history_items)
        user_text = user_interests + ' ' + search_history_text

        # Fetch all items and prepare data
        items = Item.objects.all()
        items_data = list(items.values('id', 'title', 'category', 'description', 'price', 'image'))  # Include price and image

        # Ensure no None values in the data
        for item in items_data:
            item['title'] = item['title'] or ""
            item['category'] = item['category'] or ""
            item['description'] = item['description'] or ""
            item['price'] = item['price'] or 0  # Assuming price should be numeric
            item['image'] = item['image'] or ""  # Assuming image is a URL or path

        items_data_df = pd.DataFrame(items_data)
        if not items_data_df.empty:
            items_data_df['combined_text'] = (
                items_data_df['title'] + ' ' + items_data_df['category'] + ' ' + items_data_df['description']
            )

            # Vectorizing the text data
            vectorizer = TfidfVectorizer()
            items_tfidf = vectorizer.fit_transform(items_data_df['combined_text'])
            user_tfidf = vectorizer.transform([user_text])

            # Compute cosine similarity
            scores = cosine_similarity(user_tfidf, items_tfidf).flatten()
            items_data_df['similarity'] = scores

            # Calculate recency score for each item
            now = timezone.now()  # timezone-aware current time
            recency_scores = []

            for item in items_data:
                # Get the most recent search timestamp for each item
                recent_search = SearchHistory.objects.filter(item_id=item['id'], user_id=user_id).order_by('-timestamp').first()
                recency_score = 0
                if recent_search:
                    # Ensure both datetimes are of the same type (aware or naive)
                    recent_timestamp = recent_search.timestamp
                    
                    if recent_timestamp.tzinfo is None and now.tzinfo is not None:
                        # Convert naive to aware datetime if necessary
                        recent_timestamp = timezone.make_aware(recent_timestamp, timezone.get_current_timezone())
                    elif recent_timestamp.tzinfo is not None and now.tzinfo is None:
                        # Convert aware to naive datetime if necessary
                        recent_timestamp = timezone.make_naive(recent_timestamp, timezone.get_current_timezone())

                    # Calculate recency as a function of time difference
                    time_diff = now - recent_timestamp
                    recency_score = max(0, (1 - time_diff.total_seconds() / (3600 * 24)))  # Normalize to 0-1 based on days

                recency_scores.append(recency_score)

            # Add recency score to the dataframe
            items_data_df['recency'] = recency_scores

            # Combine similarity and recency scores: weight them (you can adjust the weights as needed)
            items_data_df['final_score'] = items_data_df['similarity'] * 0.6 + items_data_df['recency'] * 0.4

            # Sort by final score and return top 5 items
            return items_data_df[['id', 'title', 'category', 'description', 'price', 'image', 'final_score']].sort_values(by='final_score', ascending=False).head(5)

        return pd.DataFrame()

    except Exception as e:
        print(f"Error in content-based recommendations: {e}")
        return pd.DataFrame()


# Collaborative Filtering Recommendations
def collaborative_filtering(user_id):
    try:
        # Fetch user-item interactions
        interactions = SearchHistory.objects.all().values('user_id', 'item_id')  # Use `item_id` for ForeignKey
        interaction_df = pd.DataFrame(interactions)

        if interaction_df.empty:
            return pd.DataFrame()  # Return empty DataFrame if no interactions are recorded

        # Create interaction matrix
        interaction_matrix = pd.pivot_table(
            interaction_df,
            index='user_id',
            columns='item_id',
            aggfunc=lambda x: 1,
            fill_value=0
        )

        if user_id not in interaction_matrix.index:
            return pd.DataFrame()  # Return empty DataFrame if the user has no interactions

        # Train nearest neighbors model
        model = NearestNeighbors(metric='cosine')
        model.fit(interaction_matrix.values)

        user_idx = list(interaction_matrix.index).index(user_id)
        distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=2)

        similar_users = [
            interaction_matrix.index[i] for i in indices.flatten() if interaction_matrix.index[i] != user_id
        ]
        recommended_item_ids = SearchHistory.objects.filter(user_id__in=similar_users).values_list('item_id', flat=True)

        # Fetch recommended items and convert to DataFrame
        recommended_items = Item.objects.filter(id__in=recommended_item_ids).distinct()
        recommended_items_data = [
            {
                'id': item.id,
                'title': item.title or "",
                'category': item.category or "",
                'description': item.description or "",
                'price': item.price or 0,  # Add price
                'image': item.image or ""   # Add image
            }
            for item in recommended_items
        ]
        recommended_items_df = pd.DataFrame(recommended_items_data)

        return recommended_items_df

    except Exception as e:
        print(f"Error in collaborative filtering: {e}")
        return pd.DataFrame()  # Return empty DataFrame on error


# Hybrid Recommendations
def hybrid_recommendation_system(user_id):
    try:
        content_recs = content_based_recommendations(user_id)
        collab_recs = collaborative_filtering(user_id)

        # Handle cases where either recommendation system returns empty results
        if content_recs.empty and collab_recs.empty:
            return pd.DataFrame()  # Return empty DataFrame if no recommendations available

        # Combine content-based and collaborative filtering results
        all_recs = pd.concat([content_recs, collab_recs]).drop_duplicates(subset='id', keep='first')

        # Return top 5 recommendations
        return all_recs.head(5)

    except Exception as e:
        print(f"Error in hybrid recommendation system: {e}")
        return pd.DataFrame()  # Return empty DataFrame on error
