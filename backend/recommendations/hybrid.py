import pandas as pd
import numpy as np
import math
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sentence_transformers import SentenceTransformer
from django.conf import settings
from django.db.models import F # For F expressions
from django.utils import timezone

# Assuming your Django models are imported like this
from users.models import User
from items.models import Item, SearchHistory

# Initialize SentenceTransformer model globally to avoid reloading on each call
# This model will download if not already present in the cache.
# Consider using a more robust loading mechanism for production (e.g., check if already loaded)
try:
    GLOBAL_SENTENCE_MODEL = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    GLOBAL_SENTENCE_MODEL = None
    print(f"Failed to load SentenceTransformer model: {e}. Content-based recommendations will be disabled.")


def content_based_recommendations(user_id):
    if GLOBAL_SENTENCE_MODEL is None:
        print("SentenceTransformer model is not available. Skipping content-based recommendations.")
        return pd.DataFrame()

    try:
        # Fetch the user's profile
        user_profile = User.objects.get(id=user_id)
        # user_profile.interests is a list of strings (from ArrayField or similar)
        user_interests = ' '.join(user_profile.interests or [])

        # Fetch search history (titles from items only)
        # Using F-expressions to access related model fields efficiently
        search_history_items_titles = SearchHistory.objects.filter(
            user=user_profile,
            item__isnull=False # Ensure item is not null
        ).values_list('item__title', flat=True).distinct() # Use distinct for unique titles

        # Combine user interests and search history
        search_history_text = ' '.join(filter(None, search_history_items_titles)) # Filter out None or empty strings
        user_text = user_interests + ' ' + search_history_text
        user_text = user_text.strip() # Remove leading/trailing whitespace

        if not user_text:
            print(f"No user interests or search history for user {user_id} for content-based recommendations.")
            return pd.DataFrame()

        # Fetch all items and prepare data
        # Using .values() to get dictionary data directly, preventing extra queries
        items_data = list(Item.objects.all().values('id', 'title', 'category', 'description', 'price', 'image'))

        # Ensure no None values in the data and handle image URLs
        for item in items_data:
            item['title'] = item.get('title') or ""
            item['category'] = item.get('category') or ""
            item['description'] = item.get('description') or ""
            item['price'] = item.get('price') or 0
            # Construct full image URL for the frontend
            item['image'] = f"{settings.MEDIA_URL}{item['image']}" if item.get('image') else ""

        items_data_df = pd.DataFrame(items_data)

        if items_data_df.empty:
            print("No items found in the database for content-based recommendations.")
            return pd.DataFrame()

        items_data_df['combined_text'] = (
            items_data_df['title'] + ' ' + items_data_df['category'] + ' ' + items_data_df['description']
        ).fillna('') # Fill NaN with empty string before concatenation

        # Ensure combined_text is not entirely empty after concatenation
        if items_data_df['combined_text'].empty or all(s == '' for s in items_data_df['combined_text']):
             print("All items have empty combined_text for content-based recommendations.")
             return pd.DataFrame()

        # Generate embeddings for item texts and user text
        items_embeddings = GLOBAL_SENTENCE_MODEL.encode(items_data_df['combined_text'].tolist(), show_progress_bar=False)
        user_embedding = GLOBAL_SENTENCE_MODEL.encode([user_text], show_progress_bar=False)[0]

        # Reshape user embedding for cosine similarity
        user_embedding_reshaped = user_embedding.reshape(1, -1)

        # Compute cosine similarity between user embedding and all item embeddings
        scores = cosine_similarity(user_embedding_reshaped, items_embeddings).flatten()
        items_data_df['similarity'] = scores

        # Calculate recency score for each item
        now = timezone.now()  # Use Django's timezone.now() for consistency
        recency_scores = []

        # Optimize fetching recent_search:
        # Create a dictionary mapping item_id to the latest timestamp for the current user
        recent_searches_map = {}
        for s in SearchHistory.objects.filter(user=user_profile, item__isnull=False).order_by('item', '-timestamp'):
            recent_searches_map[s.item_id] = s.timestamp # Last one wins (most recent)

        for item_id_val in items_data_df['id'].tolist():
            recency_score = 0
            if item_id_val in recent_searches_map:
                recent_timestamp = recent_searches_map[item_id_val]

                # Ensure timestamps are timezone-aware if the Django setting USE_TZ=True
                if settings.USE_TZ and recent_timestamp.tzinfo is None:
                    recent_timestamp = timezone.make_aware(recent_timestamp)
                if settings.USE_TZ and now.tzinfo is None:
                    now = timezone.make_aware(now)

                time_diff = now - recent_timestamp
                # Decay over 30 days. Max score 1 for very recent, approaching 0 after 30 days.
                recency_score = max(0, 1 - (time_diff.total_seconds() / (3600 * 24 * 30)))

            recency_scores.append(recency_score)

        # Add recency score to the dataframe
        items_data_df['recency'] = recency_scores

        # Ensure scores are numeric and handle NaNs before final calculation
        items_data_df['similarity'] = pd.to_numeric(items_data_df['similarity'], errors='coerce').fillna(0)
        items_data_df['recency'] = pd.to_numeric(items_data_df['recency'], errors='coerce').fillna(0)

        # Combine similarity and recency scores: weight them (adjust as needed)
        items_data_df['final_score'] = items_data_df['similarity'] * 0.6 + items_data_df['recency'] * 0.4

        # Replace any remaining NaN with None (for JSON serialization)
        items_data_df = items_data_df.replace({np.nan: None})

        # Sort by final score and return top 5 items
        return items_data_df[['id', 'title', 'category', 'description', 'price', 'image', 'final_score']].sort_values(by='final_score', ascending=False).head(5)

    except User.DoesNotExist:
        print(f"User with ID {user_id} not found for content-based recommendations.")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error in content-based recommendations for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def collaborative_filtering(user_id):
    try:
        # Fetch user-item interactions
        # Efficiently get all interactions and include item_id for pivot
        interactions_qs = SearchHistory.objects.filter(item__isnull=False).values('user_id', 'item_id', 'timestamp')
        interaction_df = pd.DataFrame(list(interactions_qs))

        if interaction_df.empty:
            print("No interactions found for collaborative filtering.")
            return pd.DataFrame()

        # Create interaction matrix
        # Use a simple binary interaction (1 if interacted, 0 otherwise)
        interaction_matrix = pd.pivot_table(
            interaction_df,
            index='user_id',
            columns='item_id',
            values='user_id', # Just need a value to aggregate
            aggfunc='count', # Count ensures a 1 if present
            fill_value=0
        )
        # Convert to binary
        interaction_matrix = (interaction_matrix > 0).astype(int)

        if user_id not in interaction_matrix.index:
            print(f"User {user_id} not found in interaction matrix. Cannot perform collaborative filtering.")
            return pd.DataFrame()

        # Train nearest neighbors model
        model = NearestNeighbors(metric='cosine')
        if len(interaction_matrix) < 2:
            print("Not enough users for collaborative filtering (less than 2).")
            return pd.DataFrame()

        model.fit(interaction_matrix.values)

        user_idx = list(interaction_matrix.index).index(user_id)
        # Ensure n_neighbors is not more than total users - 1 (self)
        n_neighbors_val = min(3, len(interaction_matrix) - 1)
        if n_neighbors_val < 1: # If only one user in matrix (current user) or no other users
            print("Not enough similar users found for collaborative filtering.")
            return pd.DataFrame()

        distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=n_neighbors_val + 1) # +1 to include self
        
        similarities = 1 - distances.flatten()
        
        # Get similar users with their similarity scores, excluding self
        similar_users_with_scores = {
            interaction_matrix.index[i]: similarities[idx]
            for idx, i in enumerate(indices.flatten())
            if interaction_matrix.index[i] != user_id
        }
        
        similar_users_ids = list(similar_users_with_scores.keys())
        
        current_time = timezone.now() # Use Django's timezone.now()
        
        # Get all relevant interactions for similar users
        # Filter for items, and ensure item_id is not null
        similar_user_interactions_qs = SearchHistory.objects.filter(
            user_id__in=similar_users_ids,
            item__isnull=False
        ).select_related('item').values('user_id', 'item_id', 'timestamp', 'item__title', 'item__category', 'item__description', 'item__price', 'item__image')
        
        # Get current user's interacted items to exclude them
        user_items_searched_ids = set(SearchHistory.objects.filter(user_id=user_id, item__isnull=False).values_list('item_id', flat=True))
        
        item_scores = {}
        item_interaction_count = {}
        item_details_map = {} # Store item details to avoid re-fetching later

        for interaction in similar_user_interactions_qs:
            item_id = interaction['item_id']
            if item_id not in user_items_searched_ids:
                user_similarity = similar_users_with_scores.get(interaction['user_id'], 0)
                
                # Ensure timestamp is timezone-aware
                interaction_timestamp = interaction['timestamp']
                if settings.USE_TZ and interaction_timestamp.tzinfo is None:
                    interaction_timestamp = timezone.make_aware(interaction_timestamp)

                days_old = (current_time - interaction_timestamp).days
                time_decay = max(0.1, 1 - (days_old / 90)) # Decay over ~3 months, min score 0.1
                
                score_contribution = user_similarity * time_decay
                
                if item_id in item_scores:
                    item_scores[item_id] += score_contribution
                    item_interaction_count[item_id] += 1
                else:
                    item_scores[item_id] = score_contribution
                    item_interaction_count[item_id] = 1
                    # Store item details the first time we encounter it
                    item_details_map[item_id] = {
                        'id': item_id,
                        'title': interaction['item__title'] or "",
                        'category': interaction['item__category'] or "",
                        'description': interaction['item__description'] or "",
                        'price': interaction['item__price'] or 0,
                        'image': f"{settings.MEDIA_URL}{interaction['item__image']}" if interaction.get('item__image') else "",
                    }
        
        if not item_scores:
            print(f"No items to recommend from similar users for user {user_id}.")
            return pd.DataFrame()

        # Apply popularity boost
        for item_id in item_scores:
            count = item_interaction_count[item_id]
            popularity_boost = 1 + (0.1 * math.log(count + 1)) # Logarithmic boost based on interaction count
            item_scores[item_id] *= popularity_boost
        
        # Sort items by score
        sorted_items = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
        
        recommended_items_data = []
        for item_id, score in sorted_items:
            item_data = item_details_map.get(item_id)
            if item_data:
                recommended_items_data.append({
                    **item_data,
                    'raw_score': float(score),
                    'final_score': float(score) # Will be normalized
                })
        
        if recommended_items_data:
            scores_list = [item['raw_score'] for item in recommended_items_data]
            
            if len(scores_list) > 0:
                min_score, max_score = min(scores_list), max(scores_list)
                score_range = max_score - min_score
                
                for item in recommended_items_data:
                    if score_range > 0:
                        normalized_score = (item['raw_score'] - min_score) / score_range
                        # Sigmoid transformation to better distribute scores in the target range
                        adjusted_score = 1 / (1 + math.exp(-5 * (normalized_score - 0.5)))
                        item['final_score'] = 0.4 + 0.5 * adjusted_score # Map to 0.4-0.9 range
                    else:
                        item['final_score'] = 0.65 # Default if all scores are same
        
        recommended_items_df = pd.DataFrame(recommended_items_data)
        recommended_items_df = recommended_items_df.replace({np.nan: None})

        return recommended_items_df.head(5) # Limit to top 5 even before hybrid

    except User.DoesNotExist:
        print(f"User with ID {user_id} not found for collaborative filtering.")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error in collaborative filtering for user {user_id}: {e}")
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
            print(f"No recommendations from either system for user {user_id}.")
            return pd.DataFrame()
        elif content_recs.empty:
            print(f"Only collaborative recommendations available for user {user_id}.")
            # Ensure 'final_score' column exists if only one type of recs is returned
            if 'final_score' not in collab_recs.columns:
                collab_recs['final_score'] = 0.65 # Default score if missing
            return collab_recs.head(5).replace({np.nan: None})
        elif collab_recs.empty:
            print(f"Only content-based recommendations available for user {user_id}.")
            if 'final_score' not in content_recs.columns:
                content_recs['final_score'] = 0.65 # Default score if missing
            return content_recs.head(5).replace({np.nan: None})

        # Merge the two dataframes
        # Use a list of common columns for merging to avoid '_x' and '_y' suffixes on all columns
        common_cols = ['id', 'title', 'category', 'description', 'price', 'image']
        
        # Rename final_score columns for clarity before merge
        content_recs = content_recs.rename(columns={'final_score': 'content_score'})
        collab_recs = collab_recs.rename(columns={'final_score': 'collab_score'})

        # Perform an outer merge on 'id' to include all unique items from both
        # Using a left merge with content_recs as base, then combining missing from collab
        
        # Combine content_recs and collab_recs to a single DataFrame
        # Prioritize content_recs for item details if an item is in both
        all_items = pd.merge(
            content_recs,
            collab_recs[['id', 'collab_score']], # Only merge 'id' and 'collab_score' from collab_recs
            on='id',
            how='outer',
            suffixes=('_content', '_collab') # Suffixes for overlapping columns not in `on`
        )

        # Fill NaN scores. If an item was only in content_recs, its collab_score will be NaN.
        # If an item was only in collab_recs, its content_score and other details will be NaN.
        all_items['content_score'] = all_items['content_score'].fillna(0.4) # Default score for content-only items
        all_items['collab_score'] = all_items['collab_score'].fillna(0.4) # Default score for collab-only items

        # Fill in missing item details for items that were only in collab_recs
        # This is crucial because `all_items` might have NaNs for item details (title, category, etc.)
        # for items that *only* appeared in `collab_recs`.
        missing_item_details_ids = all_items[all_items['title'].isnull()]['id'].tolist()
        if missing_item_details_ids:
            # Fetch details for these missing items from original collab_recs
            missing_details_df = collab_recs[collab_recs['id'].isin(missing_item_details_ids)].drop(columns=['collab_score'])
            
            # Update `all_items` with details from `missing_details_df`
            # Iteratively fill in missing columns
            for col in ['title', 'category', 'description', 'price', 'image']:
                all_items[col] = all_items[col].fillna(
                    all_items['id'].map(missing_details_df.set_index('id')[col])
                )

        # Calculate combined hybrid score (weights can be adjusted)
        all_items['hybrid_score'] = 0.5 * all_items['content_score'] + 0.5 * all_items['collab_score']
        
        # Sort by the combined score and return top 5
        result = all_items.sort_values(by='hybrid_score', ascending=False).head(5)
        
        # Clean up the result columns, renaming hybrid_score to final_score
        result = result.rename(columns={'hybrid_score': 'final_score'})
        
        # Select and order the final columns
        final_cols = ['id', 'title', 'category', 'description', 'price', 'image', 'final_score']
        
        # Ensure all selected columns exist, if not, fill with None
        for col in final_cols:
            if col not in result.columns:
                result[col] = None

        # Replace any remaining NaN with None for JSON serialization
        final_result = result[final_cols].replace({np.nan: None})

        return final_result

    except Exception as e:
        print(f"Error in hybrid recommendation system for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()