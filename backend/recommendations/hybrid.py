import pandas as pd
import numpy as np
import math
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from django.utils import timezone
from users.models import User
from items.models import Item, SearchHistory
from sentence_transformers import SentenceTransformer

def content_based_recommendations(user_id):
    try:
        # Fetch the user's interests
        user_profile = User.objects.get(id=user_id)
        user_interests = ' '.join(user_profile.interests or [])  # Handle missing interests with an empty list

        # Fetch search history (titles from items only)
        search_history_items = SearchHistory.objects.filter(user_id=user_id, item_id__isnull=False).select_related('item').values_list('item__title', flat=True)

        # Combine user interests and search history
        search_history_text = ' '.join(search_history_items)
        user_text = user_interests + ' ' + search_history_text

        # Fetch all items and prepare data
        items = Item.objects.all()
        items_data = []
        for item_instance in items: # Iterate over model instances
         items_data.append({
         'id': item_instance.id,
         'title': item_instance.title or "",
         'category': item_instance.category or "",
         'description': item_instance.description or "",
         'price': item_instance.price or 0,
         # Use .url to get the string URL for the image
         'image': item_instance.image.url if item_instance.image else ""
        })

        # Ensure no None values in the data
        for item in items_data:
            item['title'] = item['title'] or ""
            item['category'] = item['category'] or ""
            item['description'] = item['description'] or ""
            item['price'] = item['price'] or 0
            item['image'] = item['image'] or ""

        items_data_df = pd.DataFrame(items_data)
        if not items_data_df.empty:
            items_data_df['combined_text'] = (
                items_data_df['title'] + ' ' + items_data_df['category'] + ' ' + items_data_df['description']
            )

            # Use sentence embeddings
            model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
            
            # Generate embeddings
            items_embeddings = model.encode(items_data_df['combined_text'].tolist())
            user_embedding = model.encode([user_text])[0]
            
            # Reshape user embedding
            user_embedding_reshaped = user_embedding.reshape(1, -1)
            
            # Compute cosine similarity
            scores = cosine_similarity(user_embedding_reshaped, items_embeddings).flatten()
            items_data_df['similarity'] = scores

            # Calculate recency score for each item
            now = timezone.now()
            recency_scores = []

            for item in items_data:
                recent_search = SearchHistory.objects.filter(item_id=item['id'], user_id=user_id).order_by('-timestamp').first()
                recency_score = 0
                if recent_search:
                    recent_timestamp = recent_search.timestamp
                    
                    if recent_timestamp.tzinfo is None and now.tzinfo is not None:
                        recent_timestamp = timezone.make_aware(recent_timestamp, timezone.get_current_timezone())
                    elif recent_timestamp.tzinfo is not None and now.tzinfo is None:
                        recent_timestamp = timezone.make_naive(recent_timestamp, timezone.get_current_timezone())

                    time_diff = now - recent_timestamp
                    recency_score = max(0, (1 - time_diff.total_seconds() / (3600 * 24)))

                recency_scores.append(recency_score)

            items_data_df['recency'] = recency_scores
            items_data_df['final_score'] = items_data_df['similarity'] * 0.6 + items_data_df['recency'] * 0.4

            return items_data_df[['id', 'title', 'category', 'description', 'price', 'image', 'final_score']].sort_values(by='final_score', ascending=False).head(5)

        return pd.DataFrame()

    except Exception as e:
        print(f"Error in content-based recommendations: {e}")
        return pd.DataFrame()

def collaborative_filtering(user_id):
    try:
        # Fetch user-item interactions
        interactions = SearchHistory.objects.all().values('user_id', 'item_id')
        interaction_df = pd.DataFrame(interactions)

        if interaction_df.empty:
            return pd.DataFrame()

        # Create interaction matrix
        interaction_matrix = pd.pivot_table(
            interaction_df,
            index='user_id',
            columns='item_id',
            aggfunc=lambda x: 1,
            fill_value=0
        )

        if user_id not in interaction_matrix.index:
            return pd.DataFrame()

        # Train nearest neighbors model
        model = NearestNeighbors(metric='cosine')
        model.fit(interaction_matrix.values)

        user_idx = list(interaction_matrix.index).index(user_id)
        distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=min(3, len(interaction_matrix)))

        # Calculate similarity scores
        similarities = 1 - distances.flatten()
        
        # Get similar users with their similarity scores
        similar_users_with_scores = {
            interaction_matrix.index[i]: similarities[idx]
            for idx, i in enumerate(indices.flatten())
            if interaction_matrix.index[i] != user_id
        }
        
        similar_users = list(similar_users_with_scores.keys())
        
        # Create a time decay factor
        current_time = timezone.now()
        
        # Get all items that similar users have interacted with
        similar_user_interactions = SearchHistory.objects.filter(user_id__in=similar_users)
        
        # Get current user's interactions to exclude them from recommendations
        user_items = set(SearchHistory.objects.filter(user_id=user_id).values_list('item_id', flat=True))
        
        # Calculate item scores with multiple factors
        item_scores = {}
        item_interaction_count = {}
        
        for interaction in similar_user_interactions:
            if interaction.item_id not in user_items and interaction.item_id is not None:
                user_similarity = similar_users_with_scores[interaction.user_id]
                
                # Add time decay factor
                days_old = (current_time - interaction.timestamp).days if hasattr(interaction, 'timestamp') else 30
                time_decay = max(0.5, 1 - (days_old / 60))
                
                score_contribution = user_similarity * time_decay
                
                if interaction.item_id in item_scores:
                    item_scores[interaction.item_id] += score_contribution
                    item_interaction_count[interaction.item_id] += 1
                else:
                    item_scores[interaction.item_id] = score_contribution
                    item_interaction_count[interaction.item_id] = 1
        
        # Boost scores for items with multiple interactions
        for item_id in item_scores:
            count = item_interaction_count[item_id]
            popularity_boost = 1 + (0.1 * math.log(count + 1))
            item_scores[item_id] *= popularity_boost
        
        # Sort items by score
        sorted_items = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Get recommended items with their scores
        recommended_items_data = []
        for item_id, score in sorted_items:
            item = Item.objects.get(id=item_id)
            recommended_items_data.append({
        'id': item.id,
        'title': item.title or "",
        'category': item.category or "",
        'description': item.description or "",
        'price': item.price or 0,
        # Use .url to get the string URL for the image
        'image': item.image.url if item.image else "", # MODIFIED LINE
        'raw_score': score,
        'final_score': score # This might be overwritten by normalization later
})
        
        # Normalize scores to 0.4-0.9 range
        if recommended_items_data:
            scores = [item['raw_score'] for item in recommended_items_data]
            min_score, max_score = min(scores), max(scores)
            score_range = max_score - min_score
            
            if score_range > 0:
                for item in recommended_items_data:
                    normalized_score = (item['raw_score'] - min_score) / score_range
                    adjusted_score = 1 / (1 + math.exp(-5 * (normalized_score - 0.5)))
                    item['final_score'] = 0.4 + 0.5 * adjusted_score
            else:
                for i, item in enumerate(recommended_items_data):
                    position_factor = 1 - (i / len(recommended_items_data))
                    item['final_score'] = 0.4 + 0.5 * position_factor
        
        recommended_items_df = pd.DataFrame(recommended_items_data)
        return recommended_items_df

    except Exception as e:
        print(f"Error in collaborative filtering: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()

def hybrid_recommendation_system(user_id):
    try:
        # Get recommendations from both systems
        content_recs = content_based_recommendations(user_id)
        collab_recs = collaborative_filtering(user_id)

        # Handle cases where either recommendation system returns empty results
        if content_recs.empty and collab_recs.empty:
            return pd.DataFrame()
        elif content_recs.empty:
            return collab_recs.head(5)
        elif collab_recs.empty:
            return content_recs.head(5)

        # Create a merged dataframe with all unique items
        all_items = content_recs.copy()
        
        # Add collaborative items that aren't already in the content-based results
        collab_items_new = collab_recs[~collab_recs['id'].isin(content_recs['id'])]
        all_items = pd.concat([all_items, collab_items_new])
        
        # Create a mapping of collaborative filtering scores
        collab_scores = dict(zip(collab_recs['id'], collab_recs['final_score']))
        
        # Function to get collaborative score for an item if it exists
        def get_collab_score(item_id, default=0.4):
            return collab_scores.get(item_id, default)
        
        # Add collaborative scores to all items
        all_items['collab_score'] = all_items['id'].apply(get_collab_score)
        
        # For items that only have collaborative scores, add a default content score
        if 'final_score' not in all_items.columns:
            all_items['final_score'] = 0.4
        
        # Rename content-based score for clarity
        all_items.rename(columns={'final_score': 'content_score'}, inplace=True)
        
        # Calculate combined score
        all_items['hybrid_score'] = 0.5 * all_items['content_score'] + 0.5 * all_items['collab_score']
        
        # Sort by the combined score and return top 5
        result = all_items.sort_values(by='hybrid_score', ascending=False).head(5)
        
        # Clean up the result columns
        result.rename(columns={'hybrid_score': 'final_score'}, inplace=True)
        cols_to_return = ['id', 'title', 'category', 'price', 'final_score']
        if 'description' in result.columns:
            cols_to_return.append('description')
        if 'image' in result.columns:
            cols_to_return.append('image')
        return_result =pd.DataFrame(result)

        return return_result

    except Exception as e:
        print(f"Error in hybrid recommendation system: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()