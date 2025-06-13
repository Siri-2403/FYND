import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, ShoppingCart, Utensils, ShirtIcon, Home, Sparkles, Send, User, Bot, Coffee, Pizza, Apple, Shirt, Watch, Sofa, Lightbulb, Carrot, Mic, MicOff, Star, Heart, TrendingUp, Zap, Eye, Target, Compass, MapPin, Clock, ShoppingBag, ExternalLink } from 'lucide-react';
import { ApiService } from './services/apiService';
import { QueryExtractor } from './services/queryExtractor';
import type { Product } from './lib/supabase';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  products?: Product[];
  searchInfo?: {
    total: number;
    sources: {
      local: number;
      flipkart?: number;
      external: number;
    };
  };
}

interface CategoryItem {
  icon: React.ReactNode;
  name: string;
  gradient: string;
}

interface QuickSuggestion {
  text: string;
  icon: React.ReactNode;
  gradient: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm FYND AI, your intelligent shopping assistant. I can help you find food, fashion, groceries, and everyday essentials from multiple sources including Flipkart. What are you looking for today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // Load trending products on component mount
  useEffect(() => {
    loadTrendingProducts();
  }, []);

  const loadTrendingProducts = async () => {
    try {
      const trending = await ApiService.getTrendingProducts('', 8);
      setTrendingProducts(trending);
    } catch (error) {
      console.error('Error loading trending products:', error);
    }
  };

  // Check for speech recognition support
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const quickSuggestions: QuickSuggestion[] = [
    {
      text: "Find the best smartphones under $500",
      icon: <Pizza className="w-4 h-4" />,
      gradient: "from-orange-500 to-red-500"
    },
    {
      text: "Show me trending fashion items",
      icon: <TrendingUp className="w-4 h-4" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      text: "Help me find organic groceries",
      icon: <Apple className="w-4 h-4" />,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      text: "What are the top-rated electronics?",
      icon: <Star className="w-4 h-4" />,
      gradient: "from-blue-500 to-cyan-500"
    }
  ];

  const categories = [
    {
      title: 'Food & Dining',
      items: [
        { icon: <Utensils className="w-6 h-6" />, name: 'Restaurants', gradient: 'from-orange-500 to-red-500' },
        { icon: <ShoppingCart className="w-6 h-6" />, name: 'Groceries', gradient: 'from-green-500 to-emerald-500' },
      ]
    },
    {
      title: 'Fashion',
      items: [
        { icon: <ShirtIcon className="w-6 h-6" />, name: 'Clothing', gradient: 'from-purple-500 to-pink-500' },
        { icon: <Sparkles className="w-6 h-6" />, name: 'Accessories', gradient: 'from-blue-500 to-cyan-500' },
      ]
    },
    {
      title: 'Home & Living',
      items: [
        { icon: <Home className="w-6 h-6" />, name: 'Furniture', gradient: 'from-amber-500 to-orange-500' },
        { icon: <ShoppingCart className="w-6 h-6" />, name: 'Utilities', gradient: 'from-teal-500 to-green-500' },
      ]
    }
  ];

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Extract search parameters and search for products
      const extractedParams = QueryExtractor.extractInfo(textToSend);
      const searchResponse = await ApiService.searchProducts(textToSend, extractedParams);

      // Create response message
      const responses = [
        "I found some great options for you! Here are the top recommendations:",
        "Perfect! I've curated these excellent choices from multiple sources:",
        "Great choice! Here are some highly-rated options I discovered:",
        "Excellent! I've found these popular items that match your request:"
      ];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: searchResponse.products.length > 0 
          ? responses[Math.floor(Math.random() * responses.length)]
          : "I couldn't find any products matching your search. Try adjusting your criteria or search for something else.",
        isUser: false,
        timestamp: new Date(),
        products: searchResponse.products,
        searchInfo: {
          total: searchResponse.total,
          sources: searchResponse.sources
        }
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error searching products:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble searching right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceRecognition = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  // Simple Magnifying Glass Logo Component
  const FYNDLogo = ({ size = 'normal', showText = true }: { size?: 'small' | 'normal' | 'large', showText?: boolean }) => {
    const logoSize = size === 'small' ? 'w-8 h-8' : size === 'large' ? 'w-12 h-12' : 'w-10 h-10';
    const textSize = size === 'small' ? 'text-lg' : size === 'large' ? 'text-3xl' : 'text-xl';
    
    return (
      <div className="flex items-center gap-3">
        <div className={`${logoSize} bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300`}>
          <Search className="w-5 h-5 text-white" />
        </div>
        {showText && (
          <span className={`${textSize} font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`}>
            FYND
          </span>
        )}
      </div>
    );
  };

  // Product Card Component
  const ProductCard = ({ product }: { product: Product }) => {
    const getSourceBadge = (source: string) => {
      const badges = {
        'local': { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Local' },
        'flipkart': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', text: 'Flipkart' },
        'dummyjson': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'DummyJSON' },
        'fakestore': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', text: 'FakeStore' }
      };
      
      const badge = badges[source as keyof typeof badges] || badges.local;
      
      return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
          <ExternalLink className="w-3 h-3" />
          {badge.text}
        </div>
      );
    };

    // Format price based on currency
    const formatPrice = (price: number, currency: string) => {
      if (currency === 'INR') {
        return `₹${price.toFixed(2)}`;
      }
      return `$${price.toFixed(2)}`;
    };

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 group">
        {/* Product Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={product.image_url || 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400'} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=400';
            }}
          />
          {product.discount && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {product.discount}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Heart className="w-4 h-4 text-white hover:text-red-400 transition-colors" />
          </div>
          
          {/* Source Badge */}
          <div className="absolute bottom-3 left-3">
            {getSourceBadge(product.source)}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors line-clamp-2">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full ml-2 flex-shrink-0">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-yellow-300 font-medium">{product.rating?.toFixed(1) || '4.0'}</span>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          {/* Brand & Category */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
            {product.brand && (
              <span className="bg-gray-700/50 px-2 py-1 rounded-full">{product.brand}</span>
            )}
            <span className="bg-gray-700/50 px-2 py-1 rounded-full capitalize">{product.category}</span>
          </div>
          
          {/* Location & Delivery Info */}
          {(product.location || product.delivery_time) && (
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              {product.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{product.location}</span>
                </div>
              )}
              {product.delivery_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{product.delivery_time}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-indigo-400">
              {formatPrice(typeof product.price === 'number' ? product.price : parseFloat(product.price), product.currency)}
            </div>
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105">
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20"></div>
      
      {/* Top Navigation with Logo */}
      <nav className="relative z-50 p-6">
        <FYNDLogo />
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 -mt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AI-Powered Search
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Find Everything with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                FYND AI
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4 leading-relaxed max-w-2xl">
              Your smart search assistant that understands what you mean - not just what you type.
            </p>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              From fashion to food, home decor to groceries, search across Flipkart and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                Start Searching
              </button>
              <button className="border border-gray-600 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:bg-gray-800">
                Learn More
              </button>
            </div>
          </div>

          {/* FYND Logo Animation */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Main Logo Animation Container */}
              <div className="relative w-96 h-96 mx-auto">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-spin-slow"></div>
                
                {/* Middle Ring */}
                <div className="absolute inset-8 rounded-full border border-purple-500/40 animate-pulse"></div>
                
                {/* Inner Glow */}
                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm animate-pulse"></div>
                
                {/* Central Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Main Logo Circle - Simple Magnifying Glass */}
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 transform hover:scale-110 transition-all duration-500">
                      <Search className="w-16 h-16 text-white" />
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Orbiting Icons */}
                <div className="absolute inset-0 animate-spin-slow">
                  <div className="relative w-full h-full">
                    {/* Food Icon */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Pizza className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Fashion Icon */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Shirt className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Grocery Icon */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Apple className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Home Icon */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Particle Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-8 right-8 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-12 right-16 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-16 left-12 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-8 left-8 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              
              {/* Brand Text */}
              <div className="text-center mt-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  FYND AI
                </h3>
                <p className="text-gray-400 text-sm">Intelligent Search Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      {trendingProducts.length > 0 && (
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Trending Products
                </span>
              </h2>
              <p className="text-gray-300 text-lg">Popular items from multiple sources including Flipkart</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick Suggestions Section */}
      <section className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quick Suggestions
              </span>
            </h2>
            <p className="text-gray-300">Try these popular searches to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion.text)}
                className={`bg-gradient-to-r ${suggestion.gradient}/20 backdrop-blur-sm border ${suggestion.gradient.includes('orange') ? 'border-orange-500/30' : suggestion.gradient.includes('purple') ? 'border-purple-500/30' : suggestion.gradient.includes('green') ? 'border-green-500/30' : 'border-blue-500/30'} rounded-xl p-4 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`text-${suggestion.gradient.includes('orange') ? 'orange' : suggestion.gradient.includes('purple') ? 'purple' : suggestion.gradient.includes('green') ? 'green' : 'blue'}-400 group-hover:scale-110 transition-transform`}>
                    {suggestion.icon}
                  </div>
                  <span className="text-white group-hover:text-purple-300 transition-colors">
                    {suggestion.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Interface Section */}
      <section id="chat-section" className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Start a Conversation
              </span>
            </h2>
            <p className="text-gray-300 text-lg">Ask me anything about products, recommendations, or comparisons</p>
          </div>

          {/* Chat Container */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.isUser
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white'
                        : 'bg-gray-700/50 text-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      {message.searchInfo && (
                        <div className="mt-2 text-xs text-gray-300">
                          Found {message.searchInfo.total} products 
                          ({message.searchInfo.sources.local} local
                          {message.searchInfo.sources.flipkart ? `, ${message.searchInfo.sources.flipkart} Flipkart` : ''}
                          , {message.searchInfo.sources.external} external)
                        </div>
                      )}
                    </div>

                    {message.isUser && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Templates */}
                  {message.products && message.products.length > 0 && (
                    <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {message.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-700/50 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-700/50 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about food, fashion, groceries, or essentials..."
                  className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                />
                
                {/* Voice-to-Text Button */}
                {speechSupported && (
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Voice Status Indicator */}
              {isListening && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Listening... Speak now</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Explore by <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="text-gray-300 text-lg">Discover curated collections across different domains</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="group">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 transition-all duration-300 hover:transform hover:scale-105 hover:border-purple-500/50">
                  <h3 className="text-2xl font-bold mb-6 text-center">{category.title}</h3>
                  <div className="space-y-4">
                    {category.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        onClick={() => handleSendMessage(`Show me ${item.name.toLowerCase()}`)}
                        className={`w-full bg-gradient-to-r ${item.gradient} p-4 rounded-xl bg-opacity-20 flex items-center gap-3 transition-all duration-300 hover:bg-opacity-30 cursor-pointer`}
                      >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <FYNDLogo size="normal" />
          </div>
          <p className="text-gray-400">
            Intelligent search for the modern world. Find what you need, when you need it.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by multiple shopping APIs, Flipkart data, and local database
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;