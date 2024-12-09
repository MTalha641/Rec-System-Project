import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors

# Dummy Data for Users, Ads, and Interactions
users = pd.DataFrame({
    'user_id': [1, 2, 3, 4],
    'search_history': [
        'sofa dining table chairs',
        'laptops headphones speakers',
        'treadmills yoga mats weights',
        'baby strollers toys cribs'
    ],
    'liked_ads': [
        'coffee table, armchair, sofa',
        'VR headset, projector, camera',
        'dumbbells, treadmill, fitness tracker',
        'stroller, crib, educational games'
    ],
    'interests': [
        'furniture, home decor',
        'electronics, tech gadgets',
        'fitness equipment, sports gear',
        'baby gear, educational toys'
    ]
})

ads = pd.DataFrame({
    'ad_id': [1, 2, 3, 4, 5, 6, 7, 8],
    'product_title': [
        'Sofa Set', 'Dining Table', 'Treadmill', 'Yoga Mat',
        'VR Headset', 'Stroller', 'Projector', 'Educational Toys'
    ],
    'category': [
        'Furniture', 'Furniture', 'Fitness Equipment', 'Fitness Equipment',
        'Electronics', 'Baby Gear', 'Electronics', 'Baby Gear'
    ],
    'description': [
        'Comfortable modern sofa set for living room',
        'Spacious dining table with six chairs',
        'High-quality treadmill with multiple speeds',
        'Non-slip yoga mat for exercise',
        'Immersive VR headset for gaming and more',
        'Baby stroller with safety features',
        'Portable projector for movies and presentations',
        'Fun educational toys for kids of all ages'
    ]
})

interactions = pd.DataFrame({
    'user_id': [1, 1, 2, 3, 4, 4],
    'ad_id': [1, 2, 5, 3, 6, 8],
    'interaction_type': ['viewed', 'liked', 'liked', 'liked', 'viewed', 'liked']
})

# Content-Based Filtering: Text Similarity using TF-IDF
def content_based_recommendations(user_id, users, ads):
    user_profile = users.loc[users['user_id'] == user_id, ['search_history', 'liked_ads', 'interests']].values.flatten()
    user_text = ' '.join(user_profile)
    ads['combined_text'] = ads['product_title'] + ' ' + ads['category'] + ' ' + ads['description']

    # Vectorize the text
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf_vectorizer.fit_transform(ads['combined_text'])
    user_vector = tfidf_vectorizer.transform([user_text])

    # Compute similarity scores
    similarity_scores = cosine_similarity(user_vector, tfidf_matrix).flatten()
    ads['similarity'] = similarity_scores
    recommendations = ads.sort_values(by='similarity', ascending=False)[['ad_id', 'product_title', 'similarity']]
    return recommendations.head(5)

# Collaborative Filtering: User Similarity and Recommendations
def collaborative_filtering(user_id, interactions, ads):
    interaction_matrix = pd.pivot_table(interactions, index='user_id', columns='ad_id', aggfunc=lambda x: 1, fill_value=0)

    # Fit nearest neighbors model
    model = NearestNeighbors(metric='cosine', algorithm='brute')
    model.fit(interaction_matrix.values)
    user_index = list(interaction_matrix.index).index(user_id)
    distances, indices = model.kneighbors([interaction_matrix.iloc[user_index].values], n_neighbors=2)
    similar_users = [interaction_matrix.index[i] for i in indices.flatten() if interaction_matrix.index[i] != user_id]

    # Recommend ads based on similar users' interactions
    similar_user_interactions = interactions[interactions['user_id'].isin(similar_users)]
    recommended_ad_ids = similar_user_interactions['ad_id'].value_counts().index[:5]
    recommendations = ads[ads['ad_id'].isin(recommended_ad_ids)]
    return recommendations[['ad_id', 'product_title']]

# Hybrid Recommender System
def hybrid_recommendation_system(user_id, users, ads, interactions):
    content_recs = content_based_recommendations(user_id, users, ads)
    collaborative_recs = collaborative_filtering(user_id, interactions, ads)

    # Combine and prioritize recommendations
    hybrid_recs = pd.concat([content_recs, collaborative_recs]).drop_duplicates(subset='ad_id', keep='first')
    hybrid_recs = hybrid_recs.sort_values(by='similarity', ascending=False, na_position='last')
    return hybrid_recs.head(5)

# Main Function to Execute the Recommendation System
def main():
    user_id = 1  # Example: Get recommendations for user_id = 1
    recommendations = hybrid_recommendation_system(user_id, users, ads, interactions)
    print("Recommended Rental Items:")
    print(recommendations)

if __name__ == "__main__":
    main()
