#!/usr/bin/env python3
"""
FYND Backend Startup Script
This script starts the Flask backend server for the FYND application.
"""

import os
import sys
import subprocess

def check_requirements():
    """Check if required packages are installed"""
    required_packages = [
        'flask',
        'flask-cors',
        'pandas',
        'numpy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_data_file():
    """Check if the CSV data file exists"""
    data_file = "flipkart_com-ecommerce_sample.csv"
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        print("   Please ensure the CSV file is in the backend directory")
        return False
    
    print(f"✅ Data file found: {data_file}")
    return True

def start_server():
    """Start the Flask server"""
    print("🚀 Starting FYND Backend Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔗 API endpoints:")
    print("   - GET  /api/health")
    print("   - POST /api/search")
    print("   - GET  /api/trending")
    print("   - GET  /api/stats")
    print("\n" + "="*50)
    
    try:
        # Import and run the Flask app
        from app import app, initialize_search_engine
        
        # Initialize search engine
        if initialize_search_engine():
            print("✅ Search engine initialized successfully")
            print("🌐 Starting Flask server...")
            app.run(debug=True, host='0.0.0.0', port=5000)
        else:
            print("❌ Failed to initialize search engine")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    print("🔍 FYND Backend Server")
    print("=" * 30)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check data file
    if not check_data_file():
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()