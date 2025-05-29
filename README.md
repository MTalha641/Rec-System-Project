# Recommendation System Project

## 🎯 Overview

This project implements a sophisticated **Hybrid Recommendation System** that combines both **Content-Based Filtering** and **Collaborative Filtering** techniques to provide personalized product recommendations. The system is built using Django REST Framework for the backend and React Native for the frontend. 

## 🚀 Key Features

- **Hybrid Recommendation Algorithm**: Combines content-based and collaborative filtering for optimal recommendations
- **Real-time Personalization**: Uses user search history and interests for dynamic recommendations
- **Semantic Similarity**: Leverages SentenceTransformers for advanced text similarity matching
- **Time-decay Scoring**: Incorporates recency factors to prioritize recent user interactions
- **Caching System**: Intelligent caching based on user search history to optimize performance
- **RESTful API**: Clean API endpoints for frontend integration

## 📁 Project Structure

```
Rec-System-Project/
├── backend/
│   ├── recommendations/          # 🎯 Main recommendation system
│   │   ├── hybrid.py            # 🔥 Core recommendation algorithm
│   │   ├── sampleTest.py        # 🧪 Testing framework
│   │   ├── views.py             # API endpoints
│   │   ├── models.py            # Database models
│   │   └── urls.py              # URL routing
│   ├── items/                   # Product/item management
│   ├── users/                   # User management
│   ├── reviews/                 # Review system
│   └── requirements.txt         # Python dependencies
├── components/
│   └── Recommended.js           # Frontend recommendation component
└── README.md                    # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL
- Git

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Rec-System-Project
   ```

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the React Native development server:**
   ```bash
   npm start
   ```

## 🧠 Recommendation System Architecture

### Core Algorithm (`hybrid.py`)

The recommendation system consists of three main components:

#### 1. **Content-Based Filtering**
- **Purpose**: Recommends items similar to user's interests and search history
- **Technology**: Uses SentenceTransformers (`paraphrase-MiniLM-L6-v2`) for semantic similarity
- **Features**:
  - Analyzes user interests and search history
  - Creates embeddings for items and user profiles
  - Calculates cosine similarity scores
  - Applies time-decay for recent searches
  - Combines similarity (60%) and recency (40%) scores

#### 2. **Collaborative Filtering**
- **Purpose**: Recommends items based on similar users' preferences
- **Technology**: K-Nearest Neighbors with cosine similarity
- **Features**:
  - Builds user-item interaction matrix
  - Finds similar users using KNN algorithm
  - Applies time decay for interaction recency
  - Includes popularity boost for frequently interacted items
  - Normalizes scores using sigmoid function

#### 3. **Hybrid System**
- **Purpose**: Combines both approaches for optimal recommendations
- **Strategy**: 
  - Equal weighting (50% content-based + 50% collaborative)
  - Fallback mechanisms when one approach fails
  - Handles edge cases (new users, sparse data)
  - Returns top 5 recommendations

### Key Functions

```python
# Main recommendation functions
content_based_recommendations(user_id)    # Content-based filtering
collaborative_filtering(user_id)          # Collaborative filtering  
hybrid_recommendation_system(user_id)     # Combined approach
```

## 🧪 Testing Framework (`sampleTest.py`)

The `sampleTest.py` file provides a comprehensive testing environment:

- **Mock Django Environment**: Simulates Django models and database operations
- **Sample Data Generation**: Creates realistic users, items, and interactions
- **Algorithm Validation**: Tests all three recommendation approaches
- **Edge Case Testing**: Handles scenarios like new users and sparse data
- **Performance Verification**: Validates recommendation quality and relevance

### Running Tests

```bash
cd backend/recommendations
python sampleTest.py
```

## 🌐 API Integration

### Recommendation Endpoint

**GET** `/api/recommendations/getrecommendation/`

- **Authentication**: Bearer Token required
- **Response**: JSON with recommended items
- **Caching**: Intelligent caching based on search history changes
- **Features**:
  - Automatic cache invalidation
  - Error handling and fallbacks
  - Performance optimization

### Frontend Integration (`Recommended.js`)

The React Native component handles:
- Token-based authentication
- API communication with backend
- Loading states and error handling
- Dynamic image URL processing
- Horizontal scrollable recommendation list

## 📊 Database Models

### Key Models:
- **User**: Stores user profiles and interests
- **Item**: Product catalog with descriptions and metadata
- **SearchHistory**: Tracks user search patterns and interactions
- **Recommendation**: Caches generated recommendations

## 🔍 Viewing the Recommendation System

### 📂 **To explore the recommendation system:**

1. **Navigate to the recommendations folder:**
   ```bash
   cd backend/recommendations/
   ```

2. **Key files to examine:**
   - `hybrid.py` - Main recommendation algorithm
   - `sampleTest.py` - Testing and validation
   - `views.py` - API endpoints
   - `models.py` - Database schema

## 🚀 Performance Features

- **Semantic Search**: Advanced NLP for content understanding
- **Efficient Caching**: Reduces API response time
- **Scalable Architecture**: Handles growing user base
- **Time-aware Scoring**: Prioritizes recent interactions
- **Fallback Mechanisms**: Ensures recommendations even with sparse data

## 🛠 Technologies Used

### Backend:
- **Django REST Framework**: API development
- **SentenceTransformers**: Semantic similarity
- **Scikit-learn**: Machine learning algorithms
- **NumPy/Pandas**: Data processing
- **PostgreSQL**: Database

### Frontend:
- **React Native**: Mobile application
- **Axios**: HTTP client
- **React Native Animatable**: UI animations

## 📈 Algorithm Performance

The hybrid system provides:
- **Higher Accuracy**: Combines multiple recommendation strategies
- **Better Coverage**: Handles both new and existing users
- **Personalization**: Adapts to individual user preferences
- **Scalability**: Efficient for large datasets



## 👥 Group Members

- Muhammad Talha 21K-3288
- Syed Ismail 21K-4571
- Saeed Saleem 21K-4847

---

