# FYND - AI-Powered Product Search Platform

A full-stack application combining React frontend with Python backend for intelligent product search using Flipkart data.

## 🚀 Features

- **AI-Powered Search**: Natural language product search with intelligent filtering
- **React Frontend**: Modern, responsive UI with real-time search
- **Python Backend**: Flask API with advanced search algorithms
- **Flipkart Integration**: Search through real Flipkart product database
- **Voice Search**: Speech-to-text search functionality
- **Real-time Status**: Backend connection monitoring
- **Trending Products**: Discover popular items
- **Smart Filtering**: Price, brand, category, and rating filters

## 🏗️ Architecture

```
FYND-Combined/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── lib/            # Utilities and types
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── search_engine.py    # Search engine implementation
│   ├── data_preprocessor.py # Data processing
│   ├── query_extractor.py  # Query parsing
│   ├── requirements.txt    # Python dependencies
│   └── flipkart_com-ecommerce_sample.csv
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd FYND-Combined/backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Ensure CSV data file exists**:
   - Place `flipkart_com-ecommerce_sample.csv` in the backend directory
   - The file should contain Flipkart product data

4. **Start the backend server**:
   ```bash
   python start_backend.py
   ```
   
   Or directly:
   ```bash
   python app.py
   ```

   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd FYND-Combined/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Backend Configuration

The backend automatically configures:
- **CORS**: Enabled for frontend communication
- **Search Engine**: Initializes with CSV data
- **API Endpoints**: RESTful endpoints for search and data

### Frontend Configuration

The frontend includes:
- **Backend Integration**: Automatic fallback to Supabase if backend unavailable
- **Real-time Status**: Connection monitoring with visual indicators
- **Voice Search**: Browser-based speech recognition
- **Responsive Design**: Mobile-friendly interface

## 📡 API Endpoints

### Backend API (`http://localhost:5000/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check and status |
| POST | `/search` | Search products |
| GET | `/trending` | Get trending products |
| GET | `/stats` | Database statistics |

### Example API Usage

**Search Products**:
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "smartphone under 20000", "limit": 10}'
```

**Get Trending Products**:
```bash
curl http://localhost:5000/api/trending?limit=5
```

## 🔍 Search Features

### Natural Language Processing
- **Price Queries**: "smartphones under ₹20000"
- **Brand Filtering**: "Nike shoes" or "Samsung phones"
- **Category Search**: "electronics" or "fashion"
- **Rating Filters**: "products rated above 4 stars"

### Advanced Search
- **BM25 Algorithm**: Relevance-based ranking
- **Duplicate Removal**: Eliminates similar products
- **Content Filtering**: Blocks inappropriate content
- **Smart Suggestions**: AI-powered recommendations

## 🎯 Usage Examples

### Basic Search
```
User: "Find smartphones under ₹15000"
System: Returns relevant smartphones with price filtering
```

### Advanced Search
```
User: "Show me Nike running shoes with good ratings"
System: Filters by brand, category, and rating
```

### Voice Search
1. Click the microphone icon
2. Speak your search query
3. System converts speech to text and searches

## 🔄 Integration Flow

1. **Frontend Request**: User enters search query
2. **Backend Check**: System checks if Python backend is available
3. **Search Processing**: Backend processes query using search engine
4. **Results Return**: Formatted results sent to frontend
5. **Fallback**: If backend unavailable, uses Supabase Edge Functions

## 🚨 Troubleshooting

### Backend Issues

**CSV File Not Found**:
```bash
❌ Error: flipkart_com-ecommerce_sample.csv not found
```
- Ensure CSV file is in the backend directory
- Check file permissions

**Dependencies Missing**:
```bash
❌ Missing required packages: flask, pandas
```
- Run: `pip install -r requirements.txt`

### Frontend Issues

**Backend Connection Failed**:
- Check if backend server is running on port 5000
- Verify CORS configuration
- Check browser console for errors

**Search Not Working**:
- Verify backend status indicator (top-right corner)
- Check network connectivity
- Review browser developer tools

### Common Solutions

1. **Port Conflicts**: Change backend port in `app.py` and frontend `backendApiService.ts`
2. **CORS Issues**: Ensure Flask-CORS is properly configured
3. **Data Loading**: Verify CSV file format and content

## 🔧 Development

### Adding New Features

**Backend**:
1. Add new routes in `app.py`
2. Implement business logic
3. Update API documentation

**Frontend**:
1. Create new components in `src/components/`
2. Add API calls in `src/services/`
3. Update UI components

### Testing

**Backend Testing**:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test search endpoint
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 5}'
```

**Frontend Testing**:
- Open browser developer tools
- Monitor network requests
- Check console for errors

## 📈 Performance Optimization

### Backend
- **Indexing**: Search index built on startup
- **Caching**: Consider Redis for frequent queries
- **Database**: Migrate to PostgreSQL for production

### Frontend
- **Code Splitting**: Lazy load components
- **Caching**: Implement service worker
- **Optimization**: Bundle size optimization

## 🚀 Production Deployment

### Backend Deployment
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to static hosting (Netlify, Vercel, etc.)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify backend logs

---

**Happy Searching with FYND! 🔍✨**