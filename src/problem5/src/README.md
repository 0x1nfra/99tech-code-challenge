# Movies CRUD API

A RESTful API for managing movies built with Express.js, TypeScript, Prisma, and SQLite. Features a clean layered architecture with proper separation of concerns.

## Features

- Full CRUD operations for movies
- Layered architecture (Routes → Controllers → Services → Database)
- Data validation with Zod at route level
- Custom error handling with ApiError
- Filtering and pagination
- Duplicate prevention with case-insensitive checks
- Security with Helmet and CORS
- TypeScript for type safety
- SQLite database with Prisma ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite
- **ORM**: Prisma
- **Validation**: Zod
- **Security**: Helmet, CORS

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

6. (Optional) Seed the database with sample data:

```bash
npm run db:seed
```

## Running the Application

### Development mode (with hot reload):

```bash
npm run dev
```

### Production mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Health Check

- `GET /health` - Check if the server is running

### Movies

#### Create a movie

- **Endpoint**: `POST /api/movies`
- **Body**:

```json
{
  "title": "Inception",
  "director": "Christopher Nolan",
  "genre": "Sci-Fi",
  "releaseYear": 2010,
  "rating": 8.8,
  "description": "A thief who steals corporate secrets..."
}
```

- **Response**: `201 Created`
- **Validations**:
  - Title: required, max 200 characters
  - Director: required, max 100 characters
  - Genre: required, max 50 characters
  - Release Year: 1888 to current year + 5
  - Rating: optional, 0-10
  - Description: optional, max 1000 characters
- **Notes**: Duplicate titles are prevented (case-insensitive)

#### List all movies (with filters)

- **Endpoint**: `GET /api/movies`
- **Query Parameters**:
  - `genre` (optional) - Filter by genre (case-insensitive)
  - `director` (optional) - Filter by director (case-insensitive)
  - `minYear` (optional) - Minimum release year
  - `maxYear` (optional) - Maximum release year
  - `minRating` (optional) - Minimum rating
  - `page` (optional, default: 1) - Page number
  - `limit` (optional, default: 10, max: 100) - Items per page

- **Example**: `GET /api/movies?genre=Action&minRating=8&page=1&limit=10`
- **Response**: `200 OK`

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### Get a specific movie

- **Endpoint**: `GET /api/movies/:id`
- **Response**: `200 OK`
- **Error**: `404 Not Found` if movie doesn't exist

#### Update a movie

- **Endpoint**: `PUT /api/movies/:id`
- **Body**: (all fields optional)

```json
{
  "title": "Updated Title",
  "rating": 9.0
}
```

- **Response**: `200 OK`
- **Validations**: Same as create (all optional)
- **Notes**:
  - Returns `404 Not Found` if movie doesn't exist
  - Prevents duplicate titles (case-insensitive, excludes current movie)

#### Delete a movie

- **Endpoint**: `DELETE /api/movies/:id`
- **Response**: `204 No Content`
- **Error**: `404 Not Found` if movie doesn't exist
- **Notes**: Cascading delete for related records

## Architecture

This API follows a clean layered architecture:

```
Request → Validation Middleware → Controller → Service → Database
                                      ↓
                                Error Handler
```

### Layers

1. **Routes Layer** (`routes/`)
   - Defines API endpoints
   - Applies validation middleware
   - Maps routes to controllers

2. **Validation Middleware** (`middlewares/`)
   - Validates request body, query params, and URL params
   - Uses Zod schemas
   - Returns structured error responses

3. **Controllers Layer** (`controllers/`)
   - Handles HTTP requests and responses
   - Orchestrates service calls
   - Delegates error handling

4. **Services Layer** (`services/`)
   - Contains business logic
   - Handles data operations
   - Throws ApiError for failures
   - Returns ServiceResponse objects

5. **Error Handling** (`utils/`, `lib/`)
   - Custom ApiError class
   - Centralized error handler
   - Consistent error responses

## Project Structure

```
src/
├── controllers/
│   └── movie.controllers.ts   # HTTP request handlers
├── services/
│   ├── movie.services.ts      # Business logic
│   └── types.ts               # Service response types
├── routes/
│   └── movie.routes.ts        # Route definitions with validation
├── middlewares/
│   └── validate.middleware.ts # Zod validation middleware
├── validation/
│   └── movie.validations.ts   # Zod schemas
├── lib/
│   └── errorTypes/
│       └── ApiError.ts        # Custom error class
├── entities/
│   └── Error.ts               # Error enums
├── utils/
│   └── errorHandler.ts        # Centralized error handler
├── types/
│   └── movies.ts              # TypeScript types
├── app.ts                     # Express app configuration
└── server.ts                  # Server entry point

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Database seeding script
```

## Database Schema

```prisma
model Movie {
  id          Int      @id @default(autoincrement())
  title       String
  director    String
  genre       String
  releaseYear Int
  rating      Float?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: All inputs validated with Zod schemas at route level
- **SQL Injection Protection**: Prisma provides parameterized queries
- **Error Sanitization**: Internal errors don't leak sensitive information

## Error Handling

The API uses custom error handling with the `ApiError` class and returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Response Format

Validation errors:

```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["title"],
      "message": "Title is required"
    }
  ]
}
```

Application errors:

```json
{
  "error": "Movie not found",
  "code": "MOVIE_NOT_FOUND"
}
```

## Development Tools

- **Prisma Studio**: Visual database browser

```bash
npm run prisma:studio
```

## Testing the API

You can test the API using tools like:

- Postman
- Thunder Client (VS Code extension)
- cURL
- REST Client (VS Code extension)

Example cURL request:

```bash
# Create a movie
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "director": "The Wachowskis",
    "genre": "Sci-Fi",
    "releaseYear": 1999,
    "rating": 8.7
  }'

# Get all movies with filters
curl "http://localhost:3000/api/movies?genre=Sci-Fi&minRating=8"

# Get a specific movie
curl http://localhost:3000/api/movies/1

# Update a movie
curl -X PUT http://localhost:3000/api/movies/1 \
  -H "Content-Type: application/json" \
  -d '{"rating": 9.0}'

# Delete a movie
curl -X DELETE http://localhost:3000/api/movies/1
```

## Best Practices Implemented

- **Separation of Concerns**: Clear separation between routes, controllers, services, and database
- **Single Responsibility**: Each layer has a specific purpose
- **Error Handling**: Consistent error handling across all endpoints
- **Validation**: Input validation at the route level before processing
- **Type Safety**: Full TypeScript implementation with proper types
- **Code Reusability**: Reusable validation middleware and error handlers
- **Case-Insensitive Searches**: Prevents duplicate entries and improves search
- **Database Efficiency**: Optimized queries with minimal data fetching
- **API Consistency**: Uniform response formats across all endpoints

## License

ISC
