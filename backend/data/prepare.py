import random
from faker import Faker
from django.contrib.auth import get_user_model
from items.models import Item
from reviews.models import Review
from recommendations.models import Recommendation

fake = Faker()

User = get_user_model()

# Create mock users using Faker
def create_mock_users():
    for _ in range(10):  # Creating 10 users
        username = fake.user_name()
        User.objects.create_user(
            username=username,
            email=fake.email(),
            password="password123"
        )
    print("Mock users created.")

# Create mock items using Faker
def create_mock_items():
    users = User.objects.all()
    categories = [
        {"category": "Electronics", "sub_category": "Cameras"},
        {"category": "Tools", "sub_category": "Home Improvement"},
        {"category": "Furniture", "sub_category": "Dining Room"},
        {"category": "Fitness", "sub_category": "Exercise Equipment"},
        {"category": "Electronics", "sub_category": "Audio/Visual"},
    ]
    
    for _ in range(20):  # Creating 20 items
        category = random.choice(categories)
        Item.objects.create(
            rentee=random.choice(users),  # Assigning a random user as rentee
            title=fake.catch_phrase(),
            price=fake.random_int(min=10, max=1000),
            location=fake.city(),
            category=category["category"],
            sub_category=category["sub_category"],
            description=fake.text(max_nb_chars=200),
            image=None  # Skipping image upload for mock data
        )
    print("Mock items created.")

# Create mock reviews using Faker
def create_mock_reviews():
    users = User.objects.all()
    items = Item.objects.all()

    for _ in range(30):  # Creating 30 reviews
        Review.objects.create(
            user=random.choice(users),
            item=random.choice(items),
            rating=random.randint(1, 5),
            comment=fake.text(max_nb_chars=100),
        )
    print("Mock reviews created.")

# Create mock recommendations using Faker
from recommendations.models import Recommendation
from items.models import Item
from django.contrib.auth import get_user_model
import random

User = get_user_model()

# Create mock recommendations
def create_mock_recommendations():
    users = User.objects.all()
    items = Item.objects.all()

    for user in users:
        # Recommend up to 5 items per user
        recommended_items = random.sample(list(items), k=min(5, len(items)))
        
        # Update or create the Recommendation instance for each user
        Recommendation.objects.update_or_create(
            user=user,
            defaults={
                'recommended_items': [item.id for item in recommended_items],
                'algorithm_used': 'Mock Algorithm'  # You can replace this with an actual algorithm name
            }
        )
    print("Mock recommendations created.")

# Run the functions
def run_all():
    create_mock_users()
    create_mock_items()
    create_mock_reviews()
    create_mock_recommendations()

# Run this script using the Django shell or as a management command.
