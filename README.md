# Redis Restaurant API

A Node.js/TypeScript REST API built with Express and Redis that manages restaurants, cuisines, and reviews. Features Redis search indexing and bloom filters for efficient data operations.

## Features

- **Restaurant Management**: CRUD operations for restaurants with Redis caching
- **Performance Demo**: Artificial delays show the benefit of caching
- **Cuisine Filtering**: Dynamic cuisine categorization
- **Redis Search**: Full-text search capabilities with indexed data
- **Bloom Filters**: Efficient existence checking for restaurants
- **Docker Setup**: Containerized development environment
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Redis Stack (Redis + RedisSearch + RedisBloom)
- **Development**: Docker & Docker Compose
- **Process Manager**: tsx (TypeScript execution)

## Project Structure

```
redis-dev/
├── app/                     # Application source code
│   ├── index.ts            # Main server file
│   ├── package.json        # Node.js dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   ├── middlewares/        # Express middlewares
│   ├── routes/             # API route handlers
│   │   ├── restaurants.ts  # Restaurant endpoints
│   │   └── cuisines.ts     # Cuisine endpoints
│   ├── schemas/            # Data validation schemas
│   ├── seed/               # Database seeding scripts
│   │   ├── createIndex.ts  # Redis search index setup
│   │   └── bloomFilter.ts  # Bloom filter initialization
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
│       ├── client.ts       # Redis client configuration
│       ├── keys.ts         # Redis key management
│       └── responses.ts    # API response helpers
├── docker-compose.yaml     # Docker services configuration
└── .env                    # Environment variables
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (if running locally)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd redis-dev
   ```

2. **Set up environment variables**
   ```bash
   cp .example.env .env
   # Edit .env and set your REDIS_PASSWORD
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```
   
   The application will automatically:
   - Install dependencies
   - Run database seeding (indexes + bloom filters)
   - Start the development server

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_PASSWORD` | Password for Redis authentication | `yourpassword` |
| `PORT` | Application server port | `3000` |

## Caching Demonstration

The `GET /restaurants/:id` endpoint demonstrates Redis caching with artificial delays:

- **Cache Hit**: Instant response (< 50ms) with cached data
- **Cache Miss**: 2-second artificial delay simulating slow database/API calls
- **Cache Duration**: 5 minutes (300 seconds)

Try making the same request twice to see the dramatic performance difference!

```bash
# First request - slow (2s delay)
curl http://localhost:3000/restaurants/your-restaurant-id

# Second request - instant (from cache)
curl http://localhost:3000/restaurants/your-restaurant-id
```

## API Endpoints

### Restaurants
- `GET /restaurants` - Get all restaurants
- `POST /restaurants` - Create a new restaurant
- `GET /restaurants/:id` - Get a specific restaurant (cached with 2s artificial delay on cache miss)
- `PUT /restaurants/:id` - Update a restaurant
- `DELETE /restaurants/:id` - Delete a restaurant
- `GET /restaurants/search?q=name` - Search restaurants by name

### Restaurant Details & Reviews
- `POST /restaurants/:id/details` - Add restaurant details (JSON)
- `GET /restaurants/:id/details` - Get restaurant details
- `POST /restaurants/:id/reviews` - Add a review
- `GET /restaurants/:id/reviews` - Get restaurant reviews
- `DELETE /restaurants/:id/reviews/:reviewId` - Delete a review

### Cuisines
- `GET /cuisines` - Get all available cuisines

## Development

### Running the Application

The application runs in Docker containers:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Seeding the Database

The seed script runs automatically when starting the Docker containers and sets up Redis search indexes and bloom filters.

To manually re-run seeding:

```bash
# Run both index creation and bloom filter setup
docker exec -it redis-dev-app-1 npm run seed
```

### Available Scripts

Inside the app container:

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run seed` - Run database seeding (index + bloom filter)

### Redis Services

The Docker setup includes:

- **Redis Stack**: Main database with search and bloom filter modules
  - Port 6379: Redis server
  - Port 8001: RedisInsight dashboard
- **Node.js App**: Express API server
  - Port 3000: HTTP server

### RedisInsight Dashboard

Access the Redis visual interface at: http://localhost:8001

## Redis Data Structure

### Keys Pattern

- `app:restaurants:{id}` - Individual restaurant data (hash)
- `app:cuisine:{name}` - Cuisine-specific restaurant sets
- `app:restaurant_details:{id}` - Restaurant details (JSON)
- `app:reviews:{id}` - Restaurant review lists
- `app:review_details:{id}` - Individual review data
- `cache:restaurant:{id}` - Cached restaurant data (5min TTL)
- `app:idx:restaurants` - Search index for restaurants
- `app:bloom_restaurants` - Bloom filter for restaurant existence

### Search Index

The application creates a Redis search index with fields:
- `id` (TEXT) - Restaurant identifier
- `name` (TEXT) - Restaurant name
- `avgStars` (NUMERIC, SORTABLE) - Average rating

### Bloom Filter

Optimized for checking restaurant existence with:
- Error rate: 0.0001 (0.01%)
- Capacity: 1,000,000 items
- Non-scaling configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
