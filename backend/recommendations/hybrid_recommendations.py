# import pandas as pd
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.neighbors import NearestNeighbors
# from users.models import User
# from items.models import Item, SearchHistory


# # Content-Based Recommendations
# def content_based_recommendations(user_id):
#     # Fetch the user's interests and search history
#     user_profile = User.objects.get(id=user_id)
#     user_interests = ' '.join(user_profile.interests)  # Convert list to a single string
#     search_history_items = SearchHistory.objects.filter(user_id=user_id).values_list('item', flat=True)
#     search_history_text = ' '.join(search_history_items)  # Convert search history to a single string

#     # Combine user input (interests + search history)
#     user_text = user_interests + ' ' + search_history_text

#     # Fetch all items and convert to a DataFrame
#     items = Item.objects.all()
#     items_data = list(items.values('id', 'title', 'category', 'description'))  # Convert QuerySet to a list of dicts
#     items_data_df = pd.DataFrame(items_data)  # Convert list to DataFrame
#     items_data_df['combined_text'] = items_data_df['title'] + ' ' + items_data_df['category'] + ' ' + items_data_df['description']

#     # Vectorizing the text data
#     vectorizer = TfidfVectorizer()
#     items_tfidf = vectorizer.fit_transform(items_data_df['combined_text'])
#     user_tfidf = vectorizer.transform([user_text])

#     # Compute cosine similarity
#     scores = cosine_similarity(user_tfidf, items_tfidf).flatten()
#     items_data_df['similarity'] = scores

#     # Sort by similarity and return top 5
#     return items_data_df.sort_values(by='similarity', ascending=False).head(5)


# # Collaborative Filtering Recommendations
# def collaborative_filtering(user_id):
#     # Fetch user-item interactions
#     interactions = SearchHistory.objects.all().values('user_id', 'item')
#     interaction_df = pd.DataFrame(interactions)  # Convert QuerySet to DataFrame

#     # Create interaction matrix
#     interaction_matrix = pd.pivot_table(
#         interaction_df, index='user_id', columns='item', aggfunc=lambda x: 1, fill_value=0
#     )

#     # Train nearest neighbors model
#     model = NearestNeighbors(metric='cosine')
#     model.fit(interaction_matrix.values)

#     user_idx = list(interaction_matrix.index).index(user_id)
#     distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=2)

#     similar_users = [interaction_matrix.index[i] for i in indices.flatten() if interaction_matrix.index[i] != user_id]
#     recommended_item_ids = SearchHistory.objects.filter(user_id__in=similar_users).values_list('item', flat=True)

#     # Fetch recommended items and convert to DataFrame
#     recommended_items = Item.objects.filter(id__in=recommended_item_ids).distinct()
#     recommended_items_data = list(recommended_items.values('id', 'title', 'category', 'description'))
#     recommended_items_df = pd.DataFrame(recommended_items_data)

#     return recommended_items_df


# # Hybrid Recommendations
# def hybrid_recommendation_system(user_id):
#     content_recs = content_based_recommendations(user_id)
#     collab_recs = collaborative_filtering(user_id)

#     # Combine content-based and collaborative filtering results
#     all_recs = pd.concat([content_recs, collab_recs]).drop_duplicates(subset='id', keep='first')

#     # Return top 5 recommendations
#     return all_recs.head(5)
