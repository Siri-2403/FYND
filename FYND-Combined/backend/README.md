# FYND Backend

Python Flask backend for the FYND AI search application.

## Features

- **Flask REST API** with CORS support
- **Flipkart Product Search** using custom search engine
- **BM25 Ranking Algorithm** for relevant results
- **Product Filtering** by price, brand, category
- **Trending Products** endpoint
- **Health Check** and statistics endpoints

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Prepare Data

Ensure the `flipkart_com-ecommerce_sample.csv` file is in the backend directory.

### 3. Start Server

```bash
python start_backend.py
```

Or directly:

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Search Products
```
POST /api/search
Content-Type: application/json

{
  "query": "smartphone under 20000",
  "limit": 20
}
```

### Get Trending Products
```
GET /api/trending?limit=10
```

### Get Statistics
```
GET /api/stats
```

## Architecture

```
FYND-Combined/
├── backend/
│   ├── app.py                 # Flask application
│   ├── search_engine.py       # Search engine implementation
│   ├── data_preprocessor.py   # Data preprocessing
│   ├── query_extractor.py     # Query parsing
│   ├── requirements.txt       # Python dependencies
│   ├── start_backend.py       # Startup script
│   └── flipkart_com-ecommerce_sample.csv
└── frontend/
    └── src/
        └── services/
            ├── apiService.ts           # Main API service
            └── backendApiService.ts    # Backend-specific API calls
```

## Search Features

- **Intelligent Query Processing**: Extracts filters from natural language
- **BM25 Scoring**: Advanced relevance ranking
- **Price Filtering**: Support for "under ₹20000" queries
- **Brand Recognition**: Automatic brand detection
- **Category Matching**: Smart category classification
- **Duplicate Removal**: Eliminates duplicate products
- **Content Filtering**: Blocks inappropriate content

## Development

### Adding New Endpoints

1. Add route in `app.py`
2. Implement business logic
3. Update frontend `backendApiService.ts`
4. Test with frontend integration

### Modifying Search Algorithm

1. Edit `search_engine.py`
2. Adjust BM25 parameters or ranking logic
3. Test with various queries
4. Update documentation

## Troubleshooting

### Common Issues

1. **CSV File Not Found**
   - Ensure `flipkart_com-ecommerce_sample.csv` is in backend directory
   - Check file permissions

2. **Import Errors**
   - Install missing packages: `pip install -r requirements.txt`
   - Check Python version compatibility

3. **CORS Issues**
   - Flask-CORS is configured for all origins
   - Check browser console for specific errors

4. **Search Returns No Results**
   - Verify CSV data is loaded correctly
   - Check search query format
   - Review search engine logs

### Performance Optimization

- **Indexing**: Search index is built on startup
- **Caching**: Consider adding Redis for frequent queries
- **Database**: For production, migrate to PostgreSQL/MongoDB
- **Pagination**: Implement for large result sets

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Variables

```bash
export FLASK_ENV=production
export FLASK_DEBUG=False
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "app.py"]
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details