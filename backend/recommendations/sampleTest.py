import pandas as pd
import numpy as np
from collections import namedtuple
import datetime
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
import math
from sentence_transformers import SentenceTransformer

import sys
import types

class MockTimezone:
    @staticmethod
    def now():
        return datetime.datetime.now()
    
    @staticmethod
    def make_aware(naive_datetime, timezone):
        return naive_datetime
    
    @staticmethod
    def make_naive(aware_datetime, timezone):
        return aware_datetime
    
    @staticmethod
    def get_current_timezone():
        return None

mock_django_utils = types.ModuleType('django.utils')
mock_django_utils.timezone = MockTimezone()
sys.modules['django.utils'] = mock_django_utils
sys.modules['django.utils.timezone'] = mock_django_utils.timezone

# Create mock Django models
class MockQuerySet:
    def __init__(self, data_list):
        self.data = data_list
    
    def filter(self, **kwargs):
        filtered_data = []
        for item in self.data:
            match = True
            for key, value in kwargs.items():
                if key.endswith('__in'):
                    real_key = key[:-4]  # Remove '__in' suffix
                    if not hasattr(item, real_key) or getattr(item, real_key) not in value:
                        match = False
                        break
                elif key.endswith('__isnull'):
                    real_key = key[:-8]  # Remove '__isnull' suffix
                    attr_exists = hasattr(item, real_key) and getattr(item, real_key) is not None
                    if attr_exists == value:  # If value is True, we want attr to be None
                        match = False
                        break
                else:
                    if not hasattr(item, key) or getattr(item, key) != value:
                        match = False
                        break
            if match:
                filtered_data.append(item)
        return MockQuerySet(filtered_data)
    
    def values(self, *fields):
        result = []
        for item in self.data:
            data_dict = {}
            for field in fields:
                data_dict[field] = getattr(item, field)
            result.append(data_dict)
        return result
    
    def values_list(self, field_name, flat=False):
        if flat:
            return [getattr(item, field_name) for item in self.data]
        else:
            return [(getattr(item, field_name),) for item in self.data]
    
    def all(self):
        return self
    
    def get(self, **kwargs):
        for item in self.data:
            match = True
            for key, value in kwargs.items():
                if not hasattr(item, key) or getattr(item, key) != value:
                    match = False
                    break
            if match:
                return item
        raise Exception(f"Item not found with {kwargs}")
    
    def order_by(self, field):
        # Simple implementation that handles '-field' notation for descending order
        reverse = False
        if field.startswith('-'):
            field = field[1:]
            reverse = True
        
        sorted_data = sorted(self.data, key=lambda x: getattr(x, field), reverse=reverse)
        return MockQuerySet(sorted_data)
    
    def first(self):
        return self.data[0] if self.data else None
    
    def distinct(self):
        # This is a very simple implementation that might not work for all cases
        unique_ids = set()
        distinct_items = []
        
        for item in self.data:
            if item.id not in unique_ids:
                unique_ids.add(item.id)
                distinct_items.append(item)
        
        return MockQuerySet(distinct_items)
    
    def __iter__(self):
        return iter(self.data)

# Mock model classes
class User:
    objects = None  # Will be set after creating mock data
    
    def __init__(self, id, interests):
        self.id = id
        self.interests = interests

class Item:
    objects = None  # Will be set after creating mock data
    
    def __init__(self, id, title, category, description, price, image):
        self.id = id
        self.title = title
        self.category = category
        self.description = description
        self.price = price
        self.image = image

class SearchHistory:
    objects = None  # Will be set after creating mock data
    
    def __init__(self, user_id, item_id=None, item_title=None, timestamp=None):
        self.user_id = user_id
        self.item_id = item_id
        self.item_title = item_title
        self.item = None  # Just for reference
        self.timestamp = timestamp or datetime.datetime.now()

def create_sample_data():
    # Create users with more diverse interests
    users = [
        User(1, ["electronics", "gaming", "computers", "tech", "photography"]),
        User(2, ["fashion", "clothing", "accessories", "jewelry", "beauty"]),
        User(3, ["books", "reading", "literature", "art", "music"]),
        User(4, ["sports", "fitness", "outdoor", "camping", "hiking"]),
        User(5, ["home", "kitchen", "decor", "gardening", "furniture"]),
        User(6, ["electronics", "smart home", "photography", "audio", "gadgets"]),
        User(7, ["fashion", "luxury", "watches", "shoes", "designer"]),
        User(8, ["books", "education", "science", "history", "philosophy"]),
        User(9, ["sports", "nutrition", "yoga", "cycling", "swimming"]),
        User(10, ["kitchen", "cooking", "baking", "appliances", "dining"])
    ]
    User.objects = MockQuerySet(users)
    
    # Create more diverse items across categories
    items = [
        # Electronics category
        Item(1, "Gaming Laptop", "Electronics", "High-performance gaming laptop with RTX graphics", 1299.99, "laptop.jpg"),
        Item(2, "Smartphone", "Electronics", "Latest smartphone with high-resolution camera", 899.99, "phone.jpg"),
        Item(6, "Wireless Headphones", "Electronics", "Noise-cancelling wireless headphones", 199.99, "headphones.jpg"),
        Item(9, "Smart Watch", "Electronics", "Smartwatch with fitness tracking and notifications", 249.99, "watch.jpg"),
        Item(11, "4K Ultra HD TV", "Electronics", "65-inch 4K TV with smart features", 799.99, "tv.jpg"),
        Item(12, "Digital Camera", "Electronics", "Mirrorless camera with interchangeable lenses", 649.99, "camera.jpg"),
        Item(13, "Bluetooth Speaker", "Electronics", "Portable waterproof Bluetooth speaker", 79.99, "speaker.jpg"),
        Item(14, "Gaming Console", "Electronics", "Next-gen gaming console with 1TB storage", 499.99, "console.jpg"),
        Item(15, "Tablet", "Electronics", "10-inch tablet with high-resolution display", 349.99, "tablet.jpg"),
        Item(16, "Wireless Earbuds", "Electronics", "True wireless earbuds with charging case", 129.99, "earbuds.jpg"),
        Item(17, "Smart Home Hub", "Electronics", "Voice-controlled smart home assistant", 89.99, "smarthub.jpg"),
        
        # Fashion category
        Item(3, "Designer T-shirt", "Fashion", "Premium cotton t-shirt with designer logo", 49.99, "tshirt.jpg"),
        Item(18, "Designer Jeans", "Fashion", "Slim-fit premium denim jeans", 89.99, "jeans.jpg"),
        Item(19, "Leather Handbag", "Fashion", "Genuine leather designer handbag", 199.99, "handbag.jpg"),
        Item(20, "Cashmere Sweater", "Fashion", "Soft cashmere sweater for winter", 129.99, "sweater.jpg"),
        Item(21, "Luxury Watch", "Fashion", "Stainless steel luxury analog watch", 349.99, "luxwatch.jpg"),
        Item(22, "Summer Dress", "Fashion", "Floral pattern summer dress", 59.99, "dress.jpg"),
        Item(23, "Designer Sunglasses", "Fashion", "UV protection designer sunglasses", 149.99, "sunglasses.jpg"),
        Item(24, "Leather Wallet", "Fashion", "Genuine leather bifold wallet", 39.99, "wallet.jpg"),
        Item(25, "Fashion Sneakers", "Fashion", "Trendy casual sneakers", 79.99, "sneakers.jpg"),
        
        # Sports category
        Item(4, "Running Shoes", "Sports", "Comfortable running shoes with arch support", 129.99, "shoes.jpg"),
        Item(7, "Fitness Tracker", "Sports", "Water-resistant fitness tracker with heart rate monitor", 89.99, "tracker.jpg"),
        Item(26, "Yoga Mat", "Sports", "Non-slip eco-friendly yoga mat", 29.99, "yogamat.jpg"),
        Item(27, "Adjustable Dumbbells", "Sports", "Space-saving adjustable dumbbell set", 199.99, "dumbbells.jpg"),
        Item(28, "Mountain Bike", "Sports", "All-terrain mountain bike with 21 speeds", 399.99, "bike.jpg"),
        Item(29, "Tennis Racket", "Sports", "Professional tennis racket with case", 89.99, "racket.jpg"),
        Item(30, "Basketball", "Sports", "Official size indoor/outdoor basketball", 24.99, "basketball.jpg"),
        Item(31, "Hiking Backpack", "Sports", "Waterproof hiking backpack with hydration system", 79.99, "backpack.jpg"),
        Item(32, "Camping Tent", "Sports", "4-person weatherproof camping tent", 149.99, "tent.jpg"),
        
        # Books category
        Item(8, "Classic Novel Collection", "Books", "Set of 5 classic novels in hardcover", 59.99, "books.jpg"),
        Item(33, "Science Textbook", "Books", "Comprehensive science textbook for students", 49.99, "science.jpg"),
        Item(34, "Cookbook", "Books", "International cuisine cookbook with 500 recipes", 34.99, "cookbook.jpg"),
        Item(35, "Self-Help Book", "Books", "Bestselling self-improvement guide", 19.99, "selfhelp.jpg"),
        Item(36, "Historical Biography", "Books", "Award-winning historical biography", 24.99, "biography.jpg"),
        Item(37, "Fantasy Novel Series", "Books", "Complete fantasy novel series box set", 89.99, "fantasy.jpg"),
        Item(38, "Art History Book", "Books", "Illustrated art history book", 39.99, "artbook.jpg"),
        Item(39, "Philosophy Collection", "Books", "Essential philosophy works compilation", 44.99, "philosophy.jpg"),
        
        # Kitchen category
        Item(5, "Coffee Maker", "Kitchen", "Programmable coffee maker with thermal carafe", 79.99, "coffee.jpg"),
        Item(10, "Kitchen Knife Set", "Kitchen", "Professional-grade kitchen knife set", 149.99, "knives.jpg"),
        Item(40, "Stand Mixer", "Kitchen", "Professional stand mixer with multiple attachments", 249.99, "mixer.jpg"),
        Item(41, "Blender", "Kitchen", "High-powered blender for smoothies and soups", 99.99, "blender.jpg"),
        Item(42, "Air Fryer", "Kitchen", "Digital air fryer with multiple cooking functions", 119.99, "airfryer.jpg"),
        Item(43, "Cookware Set", "Kitchen", "Nonstick cookware set with 10 pieces", 199.99, "cookware.jpg"),
        Item(44, "Electric Kettle", "Kitchen", "Fast-boiling electric kettle with temperature control", 49.99, "kettle.jpg"),
        Item(45, "Toaster Oven", "Kitchen", "Convection toaster oven with digital controls", 89.99, "toaster.jpg"),
        
        # Home category
        Item(46, "Throw Pillows", "Home", "Decorative throw pillows set of 2", 39.99, "pillows.jpg"),
        Item(47, "Table Lamp", "Home", "Modern design table lamp with LED bulb", 59.99, "lamp.jpg"),
        Item(48, "Area Rug", "Home", "Soft area rug for living room", 129.99, "rug.jpg"),
        Item(49, "Wall Art", "Home", "Contemporary wall art canvas print", 79.99, "wallart.jpg"),
        Item(50, "Indoor Plant", "Home", "Low-maintenance indoor plant with decorative pot", 34.99, "plant.jpg"),
        Item(51, "Throw Blanket", "Home", "Soft knitted throw blanket", 44.99, "blanket.jpg"),
        Item(52, "Curtains", "Home", "Blackout curtains set of 2 panels", 49.99, "curtains.jpg")
    ]
    Item.objects = MockQuerySet(items)
    
    # Create past dates for search history timestamps
    today = datetime.datetime.now()
    yesterday = today - datetime.timedelta(days=1)
    last_week = today - datetime.timedelta(days=7)
    two_weeks_ago = today - datetime.timedelta(days=14)
    last_month = today - datetime.timedelta(days=30)
    
    # Create extensive search history 
    search_history = [
        # User 1 - Electronics/Gaming enthusiast
        SearchHistory(1, 1, "Gaming Laptop", today),
        SearchHistory(1, 2, "Smartphone", yesterday),
        SearchHistory(1, 6, "Wireless Headphones", last_week),
        SearchHistory(1, 9, "Smart Watch", last_month),
        SearchHistory(1, 14, "Gaming Console", two_weeks_ago),
        SearchHistory(1, 12, "Digital Camera", last_week),
        SearchHistory(1, 13, "Bluetooth Speaker", yesterday),
        SearchHistory(1, 16, "Wireless Earbuds", today),
        SearchHistory(1, None, "graphics cards", last_week),
        SearchHistory(1, None, "gaming accessories", two_weeks_ago),
        
        # User 2 - Fashion enthusiast
        SearchHistory(2, 3, "Designer T-shirt", today),
        SearchHistory(2, 2, "Smartphone", yesterday),
        SearchHistory(2, None, "luxury watches", last_week),
        SearchHistory(2, 9, "Smart Watch", last_month),
        SearchHistory(2, 1, "Gaming Laptop", today),
        SearchHistory(2, 19, "Leather Handbag", today),
        SearchHistory(2, 21, "Luxury Watch", yesterday),
        SearchHistory(2, 22, "Summer Dress", last_week),
        SearchHistory(2, 23, "Designer Sunglasses", two_weeks_ago),
        SearchHistory(2, None, "designer shoes", last_month),
        SearchHistory(2, None, "jewelry sets", last_week),
        SearchHistory(2, 18, "Designer Jeans", today),
        
        # User 3 - Books and kitchen enthusiast
        SearchHistory(3, 8, "Classic Novel Collection", today),
        SearchHistory(3, 5, "Coffee Maker", yesterday),
        SearchHistory(3, 34, "Cookbook", last_week),
        SearchHistory(3, 2, "Smartphone", yesterday),
        SearchHistory(3, 37, "Fantasy Novel Series", two_weeks_ago),
        SearchHistory(3, 36, "Historical Biography", last_month),
        SearchHistory(3, 38, "Art History Book", today),
        SearchHistory(3, None, "poetry collections", last_week),
        SearchHistory(3, None, "literature guides", two_weeks_ago),
        SearchHistory(3, 41, "Blender", yesterday),
        
        # User 4 - Sports and fitness enthusiast
        SearchHistory(4, 4, "Running Shoes", today),
        SearchHistory(4, 7, "Fitness Tracker", yesterday),
        SearchHistory(4, 26, "Yoga Mat", last_week),
        SearchHistory(4, 2, "Smartphone", yesterday),
        SearchHistory(4, 27, "Adjustable Dumbbells", two_weeks_ago),
        SearchHistory(4, 28, "Mountain Bike", last_month),
        SearchHistory(4, 29, "Tennis Racket", today),
        SearchHistory(4, None, "protein powder", last_week),
        SearchHistory(4, None, "workout clothes", two_weeks_ago),
        SearchHistory(4, 31, "Hiking Backpack", yesterday),
        SearchHistory(4, 32, "Camping Tent", today),
        
        # User 5 - Home and kitchen enthusiast
        SearchHistory(5, 5, "Coffee Maker", today),
        SearchHistory(5, 10, "Kitchen Knife Set", yesterday),
        SearchHistory(5, 40, "Stand Mixer", last_week),
        SearchHistory(5, 2, "Smartphone", yesterday),
        SearchHistory(5, 46, "Throw Pillows", two_weeks_ago),
        SearchHistory(5, 48, "Area Rug", last_month),
        SearchHistory(5, 50, "Indoor Plant", today),
        SearchHistory(5, None, "home decor", last_week),
        SearchHistory(5, None, "kitchen organization", two_weeks_ago),
        SearchHistory(5, 49, "Wall Art", yesterday),
        SearchHistory(5, 52, "Curtains", today),
        
        # User 6 - Electronics and photography enthusiast
        SearchHistory(6, 12, "Digital Camera", today),
        SearchHistory(6, 2, "Smartphone", yesterday),
        SearchHistory(6, 11, "4K Ultra HD TV", yesterday),
        SearchHistory(6, 17, "Smart Home Hub", last_week),
        SearchHistory(6, 15, "Tablet", two_weeks_ago),
        SearchHistory(6, None, "camera lenses", today),
        SearchHistory(6, None, "photography accessories", last_week),
        SearchHistory(6, None, "smart home devices", yesterday),
        SearchHistory(6, 6, "Wireless Headphones", today),
        
        # User 7 - Luxury fashion enthusiast
        SearchHistory(7, 21, "Luxury Watch", today),
        SearchHistory(7, 19, "Leather Handbag", yesterday),
        SearchHistory(7, 2, "Smartphone", yesterday),
        SearchHistory(7, 20, "Cashmere Sweater", last_week),
        SearchHistory(7, 23, "Designer Sunglasses", two_weeks_ago),
        SearchHistory(7, None, "designer accessories", today),
        SearchHistory(7, None, "luxury fashion brands", last_week),
        SearchHistory(7, 24, "Leather Wallet", yesterday),
        SearchHistory(7, None, "silk scarves", today),
        
        # User 8 - Academic and educational books enthusiast
        SearchHistory(8, 33, "Science Textbook", today),
        SearchHistory(8, 39, "Philosophy Collection", yesterday),
        SearchHistory(8, 36, "Historical Biography", last_week),
        SearchHistory(8, 38, "Art History Book", two_weeks_ago),
        SearchHistory(8, None, "academic journals", today),
        SearchHistory(8, None, "research publications", last_week),
        SearchHistory(8, None, "educational resources", yesterday),
        SearchHistory(8, 8, "Classic Novel Collection", today),
        SearchHistory(8, 2, "Smartphone", yesterday),
        
        # User 9 - Fitness and wellness enthusiast
        SearchHistory(9, 26, "Yoga Mat", today),
        SearchHistory(9, 7, "Fitness Tracker", yesterday),
        SearchHistory(9, 4, "Running Shoes", last_week),
        SearchHistory(9, None, "meditation guides", two_weeks_ago),
        SearchHistory(9, None, "nutritional supplements", today),
        SearchHistory(9, None, "yoga accessories", last_week),
        SearchHistory(9, 28, "Mountain Bike", yesterday),
        SearchHistory(9, None, "swimming equipment", today),
        SearchHistory(9, 2, "Smartphone", yesterday),
        
        # User 10 - Cooking enthusiast
        SearchHistory(10, 40, "Stand Mixer", today),
        SearchHistory(10, 42, "Air Fryer", yesterday),
        SearchHistory(10, 43, "Cookware Set", last_week),
        SearchHistory(10, 34, "Cookbook", two_weeks_ago),
        SearchHistory(10, None, "specialty kitchen gadgets", today),
        SearchHistory(10, None, "baking supplies", last_week),
        SearchHistory(10, 41, "Blender", yesterday),
        SearchHistory(10, 45, "Toaster Oven", today),
        SearchHistory(10, 2, "Smartphone", yesterday)
    ]
    SearchHistory.objects = MockQuerySet(search_history)
    
    return users, items, search_history

# Now let's define the functions from the original code but with our mock objects
def content_based_recommendations(user_id):
    try:
        # Fetch the user's interests
        user_profile = User.objects.get(id=user_id)
        user_interests = ' '.join(user_profile.interests or [])  # Handle missing interests with an empty list

        # Fetch search history (titles from items only)
        search_history_items = SearchHistory.objects.filter(user_id=user_id, item_id__isnull=False).values_list('item_title', flat=True)

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

            # Use sentence embeddings instead of TF-IDF
            model = SentenceTransformer('paraphrase-MiniLM-L6-v2')  # Smaller model for efficiency
            
            # Generate embeddings for item texts and user text
            items_embeddings = model.encode(items_data_df['combined_text'].tolist())
            # print('Item embeddings',items_embeddings)
            user_embedding = model.encode([user_text])[0]  # Get the first item since it returns a 2D array
            # print('user embeddings',user_embedding)
            # Reshape user embedding for cosine similarity
            user_embedding_reshaped = user_embedding.reshape(1, -1)
            # print('user embeddings reshaped',user_embedding_reshaped)
            
            # Compute cosine similarity between user embedding and all item embeddings
            scores = cosine_similarity(user_embedding_reshaped, items_embeddings).flatten()
            print(scores)
            items_data_df['similarity'] = scores

            # Calculate recency score for each item
            now = MockTimezone.now()  # timezone-aware current time
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
                        recent_timestamp = MockTimezone.make_aware(recent_timestamp, MockTimezone.get_current_timezone())
                    elif recent_timestamp.tzinfo is not None and now.tzinfo is None:
                        # Convert aware to naive datetime if necessary
                        recent_timestamp = MockTimezone.make_naive(recent_timestamp, MockTimezone.get_current_timezone())

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


def collaborative_filtering(user_id):
    try:
        # Fetch user-item interactions
        interactions = SearchHistory.objects.all().values('user_id', 'item_id')
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
        distances, indices = model.kneighbors([interaction_matrix.iloc[user_idx]], n_neighbors=min(3, len(interaction_matrix)))

        # Calculate similarity scores with more granularity
        similarities = 1 - distances.flatten()
        
        # Get similar users with their similarity scores
        similar_users_with_scores = {
            interaction_matrix.index[i]: similarities[idx]
            for idx, i in enumerate(indices.flatten())
            if interaction_matrix.index[i] != user_id
        }
        
        similar_users = list(similar_users_with_scores.keys())
        
        # Create a time decay factor - more recent interactions get higher weight
        current_time = datetime.datetime.now()
        
        # Get all items that similar users have interacted with
        similar_user_interactions = SearchHistory.objects.filter(user_id__in=similar_users)
        
        # Get current user's interactions to exclude them from recommendations
        user_items = set(SearchHistory.objects.filter(user_id=user_id).values_list('item_id', flat=True))
        
        # Calculate item scores with multiple factors
        item_scores = {}
        item_interaction_count = {}  # Track how many users interacted with each item
        
        for interaction in similar_user_interactions:
            if interaction.item_id not in user_items and interaction.item_id is not None:
                user_similarity = similar_users_with_scores[interaction.user_id]
                
                # Add time decay factor - more recent interactions get higher weight
                days_old = (current_time - interaction.timestamp).days if hasattr(interaction, 'timestamp') else 30
                time_decay = max(0.5, 1 - (days_old / 60))  # Decay over ~2 months
                
                score_contribution = user_similarity * time_decay
                
                # Track the item
                if interaction.item_id in item_scores:
                    item_scores[interaction.item_id] += score_contribution
                    item_interaction_count[interaction.item_id] += 1
                else:
                    item_scores[interaction.item_id] = score_contribution
                    item_interaction_count[interaction.item_id] = 1
        
        # Boost scores for items with multiple interactions
        for item_id in item_scores:
            count = item_interaction_count[item_id]
            # Apply a logarithmic boost for items with multiple interactions
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
                'image': item.image or "",
                'raw_score': score,  # Keep the raw score for debugging
                'final_score': score  # Will be normalized later
            })
        
        # Normalize scores to 0.4-0.9 range with better distribution
        if recommended_items_data:
            scores = [item['raw_score'] for item in recommended_items_data]
            min_score, max_score = min(scores), max(scores)
            score_range = max_score - min_score
            
            if score_range > 0:  # Avoid division by zero
                for item in recommended_items_data:
                    normalized_score = (item['raw_score'] - min_score) / score_range
                    # Apply slight sigmoid transformation for better distribution
                    adjusted_score = 1 / (1 + math.exp(-5 * (normalized_score - 0.5)))
                    # Map to 0.4-0.9 range
                    item['final_score'] = 0.4 + 0.5 * adjusted_score
            else:  # If all scores are the same
                # Assign scores based on position in the list instead
                for i, item in enumerate(recommended_items_data):
                    position_factor = 1 - (i / len(recommended_items_data))
                    item['final_score'] = 0.4 + 0.5 * position_factor
        
        # Print distribution of scores for debugging
        print("Collaborative filtering scores distribution:")
        if recommended_items_data:
            scores = [round(item['final_score'], 2) for item in recommended_items_data]
            print(f"Min: {min(scores)}, Max: {max(scores)}, Distinct values: {len(set(scores))}")
            print(f"Score sample: {scores[:5]}")
        
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
            return pd.DataFrame()  # Return empty DataFrame if no recommendations available
        elif content_recs.empty:
            return collab_recs.head(5)  # Return only collaborative filtering results
        elif collab_recs.empty:
            return content_recs.head(5)  # Return only content-based results

        # Create a merged dataframe with all unique items
        # Start with all content-based items
        all_items = content_recs.copy()
        
        # Add collaborative items that aren't already in the content-based results
        collab_items_new = collab_recs[~collab_recs['id'].isin(content_recs['id'])]
        all_items = pd.concat([all_items, collab_items_new])
        
        # Create a mapping of collaborative filtering scores
        collab_scores = dict(zip(collab_recs['id'], collab_recs['final_score']))
        
        # Function to get collaborative score for an item if it exists, otherwise use default value
        def get_collab_score(item_id, default=0.4):
            return collab_scores.get(item_id, default)
        
        # Add collaborative scores to all items (if not present, use a default value)
        all_items['collab_score'] = all_items['id'].apply(get_collab_score)
        
        # For items that only have collaborative scores, add a default content score
        if 'final_score' not in all_items.columns:
            all_items['final_score'] = 0.4  # Default content score
        
        # Rename content-based score for clarity
        all_items.rename(columns={'final_score': 'content_score'}, inplace=True)
        
        # Calculate combined score (weight can be adjusted based on performance)
        # Giving equal weight to both recommendation types
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
            
        return result[cols_to_return]

    except Exception as e:
        print(f"Error in hybrid recommendation system: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def verify_recommendations(user_id, content_recs, collab_recs, hybrid_recs, users, items, search_history):
    """
    Verify recommendation results for a user.
    """
    print(f"\n=== Verification for User {user_id} ===")
    
    # Get user data
    user = User.objects.get(id=user_id)
    user_interests = user.interests
    user_history = [sh for sh in search_history if sh.user_id == user_id]
    user_item_ids = [sh.item_id for sh in user_history if sh.item_id is not None]
    
    # Content-based verification
    if not content_recs.empty:
        print("\nCONTENT-BASED VERIFICATION:")
        
        # 1. Check interest alignment
        interest_matches = 0
        for _, row in content_recs.iterrows():
            item_text = f"{row['title']} {row['category']} {row['description']}".lower()
            for interest in user_interests:
                if interest.lower() in item_text:
                    interest_matches += 1
                    break
        
        interest_match_percentage = (interest_matches / len(content_recs)) * 100 if len(content_recs) > 0 else 0
        print(f"Interest alignment: {interest_match_percentage:.1f}% of recommendations match user interests")
        
        # 2. Check if previously viewed items are ranked higher (recency effect)
        previously_viewed = content_recs[content_recs['id'].isin(user_item_ids)]
        if not previously_viewed.empty and 'final_score' in previously_viewed.columns:
            avg_score_viewed = previously_viewed['final_score'].mean()
            avg_score_new = content_recs[~content_recs['id'].isin(user_item_ids)]['final_score'].mean() if not content_recs[~content_recs['id'].isin(user_item_ids)].empty else 0
            print(f"Recency effect: Avg score for viewed items: {avg_score_viewed:.4f}, New items: {avg_score_new:.4f}")
            if avg_score_viewed > avg_score_new:
                print("✓ Viewed items correctly scored higher on average")
            else:
                print("⚠ Viewed items not scoring higher - check recency weighting")
        
        # 3. Check score distribution
        if 'final_score' in content_recs.columns:
            print(f"Score range: {content_recs['final_score'].min():.4f} to {content_recs['final_score'].max():.4f}")
            if content_recs['final_score'].min() >= 0 and content_recs['final_score'].max() <= 1:
                print("✓ Scores properly normalized between 0-1")
            else:
                print("⚠ Scores outside expected 0-1 range")
    
    # Collaborative filtering verification
    if not collab_recs.empty:
        print("\nCOLLABORATIVE FILTERING VERIFICATION:")
        
        # 1. Check if recommendations include non-viewed items
        new_items = collab_recs[~collab_recs['id'].isin(user_item_ids)]
        new_items_percentage = (len(new_items) / len(collab_recs)) * 100 if len(collab_recs) > 0 else 0
        print(f"Discovery rate: {new_items_percentage:.1f}% are items user hasn't viewed")
        if new_items_percentage > 0:
            print("✓ Collaborative filtering is suggesting new items")
        else:
            print("⚠ No new item discoveries - check collaborative logic")
    
    # Hybrid verification
    if not hybrid_recs.empty:
        print("\nHYBRID RECOMMENDATIONS VERIFICATION:")
        
        # 1. Check for diversity (items from both recommendation methods)
        content_ids = set(content_recs['id'].tolist() if not content_recs.empty else [])
        collab_ids = set(collab_recs['id'].tolist() if not collab_recs.empty else [])
        hybrid_ids = set(hybrid_recs['id'].tolist())
        
        content_overlap = len(content_ids.intersection(hybrid_ids))
        collab_overlap = len(collab_ids.intersection(hybrid_ids))
        
        print(f"Source diversity: {content_overlap} from content-based, {collab_overlap} from collaborative")
        if content_overlap > 0 and collab_overlap > 0:
            print("✓ Hybrid recommendations include items from both methods")
        elif len(content_ids) > 0 and len(collab_ids) > 0:
            print("⚠ Hybrid recommendations favor only one method")
        
        # 2. Check for duplicates
        if len(hybrid_recs) == len(hybrid_ids):
            print("✓ No duplicates in hybrid recommendations")
        else:
            print("⚠ Duplicate items found in hybrid recommendations")
    
    print("\nSUMMARY:")
    if not content_recs.empty:
        print("Content-based: ✓ Working")
    else:
        print("Content-based: ⚠ No recommendations")
    
    if not collab_recs.empty:
        print("Collaborative: ✓ Working")
    else:
        print("Collaborative: ⚠ No recommendations")
    
    if not hybrid_recs.empty:
        print("Hybrid: ✓ Working")
    else:
        print("Hybrid: ⚠ No recommendations")


def test_recommendation_system():
    print("Creating sample data...")
    users, items, search_history = create_sample_data()
    
    # Test for each user
    for user in users:
        user_id = user.id
        print(f"\n\n=== Testing recommendations for User {user_id} ===")
        print(f"User interests: {user.interests}")
        
        # Print user's search history
        user_history = [sh for sh in search_history if sh.user_id == user_id]
        print(f"User search history:")
        for hist in user_history:
            print(f"  - Item ID: {hist.item_id}, Title: {hist.item_title}, Time: {hist.timestamp}")
        
        print("\n1. Content-Based Recommendations:")
        content_recs = content_based_recommendations(user_id)
        if not content_recs.empty:
            print(content_recs[['id', 'title', 'category', 'final_score']])
        else:
            print("No content-based recommendations found.")
        
        print("\n2. Collaborative Filtering Recommendations:")
        collab_recs = collaborative_filtering(user_id)
        if not collab_recs.empty:
            print(collab_recs[['id', 'title', 'category','final_score']])
        else:
            print("No collaborative filtering recommendations found.")
        
        print("\n3. Hybrid Recommendations:")
        hybrid_recs = hybrid_recommendation_system(user_id)
        if not hybrid_recs.empty:
            if 'final_score' in hybrid_recs.columns:
                print(hybrid_recs[['id', 'title', 'category', 'price', 'final_score']])
            else:
                print(hybrid_recs[['id', 'title', 'category', 'price']])
        else:
            print("No hybrid recommendations found.")
        
        # Verify the results
        verify_recommendations(user_id, content_recs, collab_recs, hybrid_recs, users, items, search_history)


def test_edge_cases():
    print("\n\n=== EDGE CASE TESTING ===")
    
    # 1. Test with non-existent user
    print("\nTesting with non-existent user ID:")
    try:
        non_existent_user_id = 999
        content_recs = content_based_recommendations(non_existent_user_id)
        print("Content-based with non-existent user - Error handling: ✓")
    except Exception as e:
        print(f"Content-based with non-existent user - Error handling: ⚠ ({str(e)})")
    
    # 2. Test with user who has no search history
    print("\nCreating user with no search history:")
    no_history_user = User(6, ["travel", "photography"])
    User.objects.data.append(no_history_user)
    
    print("Testing with user who has no search history:")
    content_recs = content_based_recommendations(6)
    if content_recs is not None and not content_recs.empty:
        print("Content-based with no search history - Working: ✓")
    else:
        print("Content-based with no search history - Working: ⚠ (No recommendations)")
    
    # 3. Test with user who has interests but no search history
    collab_recs = collaborative_filtering(6)
    if collab_recs is not None:
        print("Collaborative with no search history - Error handling: ✓")
    else:
        print("Collaborative with no search history - Error handling: ⚠ (Failed)")
    
    # 4. Test with empty item database
    print("\nTesting with empty item database:")
    old_items = Item.objects
    Item.objects = MockQuerySet([])
    
    try:
        empty_content_recs = content_based_recommendations(1)
        print("Content-based with empty items - Error handling: ✓")
    except Exception as e:
        print(f"Content-based with empty items - Error handling: ⚠ ({str(e)})")
    
    # Restore items
    Item.objects = old_items
    
    # 5. Test with all None values
    print("\nTesting with item with all None values:")
    none_item = Item(11, None, None, None, None, None)
    Item.objects.data.append(none_item)
    
    try:
        content_recs = content_based_recommendations(1)
        print("Content-based with None values - Error handling: ✓")
    except Exception as e:
        print(f"Content-based with None values - Error handling: ⚠ ({str(e)})")


def main():
    """
    Main function to run the recommendation system tests.
    This systematically tests each component of the system and verifies the results.
    """
    print("=====================================================")
    print("RECOMMENDATION SYSTEM TEST SUITE")
    print("=====================================================")
    
    # Part 1: Run standard tests
    print("\n>>> RUNNING STANDARD RECOMMENDATION TESTS")
    print("-----------------------------------------------------")
    test_recommendation_system()
    
    # Part 2: Run edge case tests
    print("\n>>> RUNNING EDGE CASE TESTS")
    print("-----------------------------------------------------")
    test_edge_cases()
    
    # Part 3: Performance evaluation (basic)
    print("\n>>> PERFORMANCE EVALUATION")
    print("-----------------------------------------------------")
    import time
    
    start_time = time.time()
    content_recs = content_based_recommendations(1)
    content_time = time.time() - start_time
    
    start_time = time.time()
    collab_recs = collaborative_filtering(1)
    collab_time = time.time() - start_time
    
    start_time = time.time()
    hybrid_recs = hybrid_recommendation_system(1)
    hybrid_time = time.time() - start_time
    
    print(f"Content-based recommendation time: {content_time:.4f} seconds")
    print(f"Collaborative filtering time: {collab_time:.4f} seconds")
    print(f"Hybrid recommendation time: {hybrid_time:.4f} seconds")
    
    # Part 4: Summary
    print("\n>>> TEST SUMMARY")
    print("-----------------------------------------------------")
    print("All tests completed.")
    print("Key points to check in the results:")
    print("1. Content-based recommendations align with user interests")
    print("2. Collaborative filtering discovers new items")
    print("3. Hybrid system combines the strengths of both approaches")
    print("4. Error handling works correctly for edge cases")
    print("5. Performance is within acceptable range")
    print("\nNext steps:")
    print("- Fine-tune recommendation parameters (similarity/recency weights)")
    print("- Increase test coverage with more diverse sample data")
    print("- Consider A/B testing different recommendation approaches")
    print("=====================================================")


if __name__ == "__main__":
    main()