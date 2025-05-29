import pandas as pd
import numpy as np
import math
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from sentence_transformers import SentenceTransformer
from django.conf import settings
from django.db.models import F 
from django.utils import timezone

from users.models import User
from items.models import Item, SearchHistory

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
        user_profile = User.objects.get(id=user_id)
        user_interests = ' '.join(user_profile.interests or [])

        search_history_items_titles = SearchHistory.objects.filter(
            user=user_profile,
            item__isnull=False 
        ).values_list('item__title', flat=True).distinct() 

        search_history_text = ' '.join(filter(None, search_history_items_titles)) 
        user_text = user_interests + ' ' + search_history_text
        user_text = user_text.strip()

        if not user_text:
            print(f"No user interests or search history for user {user_id} for content-based recommendations.")
            return pd.DataFrame()

        items_data = list(Item.objects.all().values('id', 'title', 'category', 'description', 'price', 'image'))

        for item in items_data:
            item['title'] = item.get('title') or ""
            item['category'] = item.get('category') or ""
            item['description'] = item.get('description') or ""
            item['price'] = item.get('price') or 0
            item['image'] = f"{settings.MEDIA_URL}{item['image']}" if item.get('image') else ""

        items_data_df = pd.DataFrame(items_data)

        if items_data_df.empty:
            print("No items found in the database for content-based recommendations.")
            return pd.DataFrame()

        items_data_df['combined_text'] = (
            items_data_df['title'] + ' ' + items_data_df['category'] + ' ' + items_data_df['description']
        ).fillna('') 

        if items_data_df['combined_text'].empty or all(s == '' for s in items_data_df['combined_text']):
             print("All items have empty combined_text for content-based recommendations.")
             return pd.DataFrame()

        items_embeddings = GLOBAL_SENTENCE_MODEL.encode(items_data_df['combined_text'].tolist(), show_progress_bar=False)
        user_embedding = GLOBAL_SENTENCE_MODEL.encode([user_text], show_progress_bar=False)[0]

        user_embedding_reshaped = user_embedding.reshape(1, -1)

        scores = cosine_similarity(user_embedding_reshaped, items_embeddings).flatten()
        items_data_df['similarity'] = scores

        now = timezone.now() 
        recency_scores = []

        recent_searches_map = {}
        for s in SearchHistory.objects.filter(user=user_profile, item__isnull=False).order_by('item', '-timestamp'):
            recent_searches_map[s.item_id] = s.timestamp 

        for item_id_val in items_data_df['id'].tolist():
            recency_score = 0
            if item_id_val in recent_searches_map:
                recent_timestamp = recent_searches_map[item_id_val]

                if settings.USE_TZ and recent_timestamp.tzinfo is None:
                    recent_timestamp = timezone.make_aware(recent_timestamp)
                if settings.USE_TZ and now.tzinfo is None:
                    now = timezone.make_aware(now)

                time_diff = now - recent_timestamp
                recency_score = max(0, 1 - (time_diff.total_seconds() / (3600 * 24 * 30)))

            recency_scores.append(recency_score)

        items_data_df['recency'] = recency_scores

        items_data_df['similarity'] = pd.to_numeric(items_data_df['similarity'], errors='coerce').fillna(0)
        items_data_df['recency'] = pd.to_numeric(items_data_df['recency'], errors='coerce').fillna(0)

        items_data_df['final_score'] = items_data_df['similarity'] * 0.6 + items_data_df['recency'] * 0.4

        items_data_df = items_data_df.replace({np.nan: None})

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
        interactions_qs = SearchHistory.objects.filter(item__isnull=False).values('user_id', 'item_id', 'timestamp')
        interaction_df = pd.DataFrame(list(interactions_qs))

        if interaction_df.empty:
            print("No interactions found for collaborative filtering.")
            return pd.DataFrame()

        interaction_matrix = pd.pivot_table(
            interaction_df,
            index='user_id',
            columns='item_id',
            values='user_id', 
            aggfunc='count', 
            fill_value=0
        )
        interaction_matrix = (interaction_matrix > 0).astype(int)

        if user_id not in interaction_matrix.index:
            print(f"User {user_id} not found in interaction matrix. Cannot perform collaborative filtering.")
            return pd.DataFrame()

        model = NearestNeighbors(metric='cosine')
        if len(interaction_matrix) < 2:
            print("Not enough users for collaborative filtering (less than 2).")
            return pd.DataFrame()

        model.fit(interaction_matrix.values)

        user_idx = list(interaction_matrix.index).index(user_id)
        n_neighbors_val = min(3, len(interaction_matrix) - 1)
        if n_neighbors_val < 1: 
            print("Not enough similar users found for collaborative filtering.")
            return pd.DataFrame()

        distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=n_neighbors_val + 1) 
        
        similarities = 1 - distances.flatten()
        
        similar_users_with_scores = {
            interaction_matrix.index[i]: similarities[idx]
            for idx, i in enumerate(indices.flatten())
            if interaction_matrix.index[i] != user_id
        }
        
        similar_users_ids = list(similar_users_with_scores.keys())
        
        current_time = timezone.now() 
        
        similar_user_interactions_qs = SearchHistory.objects.filter(
            user_id__in=similar_users_ids,
            item__isnull=False
        ).select_related('item').values('user_id', 'item_id', 'timestamp', 'item__title', 'item__category', 'item__description', 'item__price', 'item__image')
        
        user_items_searched_ids = set(SearchHistory.objects.filter(user_id=user_id, item__isnull=False).values_list('item_id', flat=True))
        
        item_scores = {}
        item_interaction_count = {}
        item_details_map = {} 

        for interaction in similar_user_interactions_qs:
            item_id = interaction['item_id']
            if item_id not in user_items_searched_ids:
                user_similarity = similar_users_with_scores.get(interaction['user_id'], 0)
                
                interaction_timestamp = interaction['timestamp']
                if settings.USE_TZ and interaction_timestamp.tzinfo is None:
                    interaction_timestamp = timezone.make_aware(interaction_timestamp)

                days_old = (current_time - interaction_timestamp).days
                time_decay = max(0.1, 1 - (days_old / 90)) 
                
                score_contribution = user_similarity * time_decay
                
                if item_id in item_scores:
                    item_scores[item_id] += score_contribution
                    item_interaction_count[item_id] += 1
                else:
                    item_scores[item_id] = score_contribution
                    item_interaction_count[item_id] = 1
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

        for item_id in item_scores:
            count = item_interaction_count[item_id]
            popularity_boost = 1 + (0.1 * math.log(count + 1)) 
            item_scores[item_id] *= popularity_boost
        
        sorted_items = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)
        
        recommended_items_data = []
        for item_id, score in sorted_items:
            item_data = item_details_map.get(item_id)
            if item_data:
                recommended_items_data.append({
                    **item_data,
                    'raw_score': float(score),
                    'final_score': float(score) 
                })
        
        if recommended_items_data:
            scores_list = [item['raw_score'] for item in recommended_items_data]
            
            if len(scores_list) > 0:
                min_score, max_score = min(scores_list), max(scores_list)
                score_range = max_score - min_score
                
                for item in recommended_items_data:
                    if score_range > 0:
                        normalized_score = (item['raw_score'] - min_score) / score_range
                        adjusted_score = 1 / (1 + math.exp(-5 * (normalized_score - 0.5)))
                        item['final_score'] = 0.4 + 0.5 * adjusted_score 
                    else:
                        item['final_score'] = 0.65 
        
        recommended_items_df = pd.DataFrame(recommended_items_data)
        recommended_items_df = recommended_items_df.replace({np.nan: None})

        return recommended_items_df.head(5) 

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
        content_recs = content_based_recommendations(user_id)
        collab_recs = collaborative_filtering(user_id)

        if content_recs.empty and collab_recs.empty:
            print(f"No recommendations from either system for user {user_id}.")
            return pd.DataFrame()
        elif content_recs.empty:
            print(f"Only collaborative recommendations available for user {user_id}.")
            if 'final_score' not in collab_recs.columns:
                collab_recs['final_score'] = 0.65 
            return collab_recs.head(5).replace({np.nan: None})
        elif collab_recs.empty:
            print(f"Only content-based recommendations available for user {user_id}.")
            if 'final_score' not in content_recs.columns:
                content_recs['final_score'] = 0.65 
            return content_recs.head(5).replace({np.nan: None})

        common_cols = ['id', 'title', 'category', 'description', 'price', 'image']
        
        content_recs = content_recs.rename(columns={'final_score': 'content_score'})
        collab_recs = collab_recs.rename(columns={'final_score': 'collab_score'})

        
        all_items = pd.merge(
            content_recs,
            collab_recs[['id', 'collab_score']], 
            on='id',
            how='outer',
            suffixes=('_content', '_collab') 
        )

        all_items['content_score'] = all_items['content_score'].fillna(0.4) 
        all_items['collab_score'] = all_items['collab_score'].fillna(0.4) 

        missing_item_details_ids = all_items[all_items['title'].isnull()]['id'].tolist()
        if missing_item_details_ids:
            missing_details_df = collab_recs[collab_recs['id'].isin(missing_item_details_ids)].drop(columns=['collab_score'])
            
            for col in ['title', 'category', 'description', 'price', 'image']:
                all_items[col] = all_items[col].fillna(
                    all_items['id'].map(missing_details_df.set_index('id')[col])
                )

        all_items['hybrid_score'] = 0.5 * all_items['content_score'] + 0.5 * all_items['collab_score']
        
        result = all_items.sort_values(by='hybrid_score', ascending=False).head(5)
        
        result = result.rename(columns={'hybrid_score': 'final_score'})
        
        final_cols = ['id', 'title', 'category', 'description', 'price', 'image', 'final_score']
        
        for col in final_cols:
            if col not in result.columns:
                result[col] = None

        final_result = result[final_cols].replace({np.nan: None})

        return final_result

    except Exception as e:
        print(f"Error in hybrid recommendation system for user {user_id}: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()