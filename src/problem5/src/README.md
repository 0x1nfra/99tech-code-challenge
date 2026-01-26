# Movies CRUD API

A RESTful API for managing movies built with Express.js, TypeScript, Prisma, and SQLite.

## Features

- Full CRUD operations for movies
- Data validation with Zod
- Filtering and pagination
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

#### List all movies (with filters)

- **Endpoint**: `GET /api/movies`
- **Query Parameters**:
  - `genre` (optional) - Filter by genre
  - `director` (optional) - Filter by director
  - `minYear` (optional) - Minimum release year
  - `maxYear` (optional) - Maximum release year
  - `minRating` (optional) - Minimum rating
  - `page` (optional, default: 1) - Page number
  - `limit` (optional, default: 10) - Items per page

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

#### Delete a movie

- **Endpoint**: `DELETE /api/movies/:id`
- **Response**: `204 No Content`

## Project Structure

```
src/
├── controllers/
│   └── movieController.ts    # Request handlers
├── routes/
│   └── movieRoutes.ts         # Route definitions
├── validation/
│   └── movieSchemas.ts        # Zod validation schemas
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
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Protection**: Prisma provides parameterized queries

## Development Tools

- **Prisma Studio**: Visual database browser

```bash
npm run prisma:studio
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:

```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

## Testing the API

You can test the API using tools like:

- Postman
- Thunder Client (VS Code extension)
- cURL

Example cURL request:

```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Matrix",
    "director": "The Wachowskis",
    "genre": "Sci-Fi",
    "releaseYear": 1999,
    "rating": 8.7
  }'
```

## License

ISC
