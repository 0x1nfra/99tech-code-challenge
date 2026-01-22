# Real-Time Leaderboard API Specification

## Overview
This module provides a secure, real-time leaderboard system where users complete actions (e.g., puzzles, challenges) to earn points and compete for rankings. The system prevents score manipulation through server-side validation and cryptographic tokens.

## Architecture Components

### Technology Stack
- **Application Server**: Node.js + Express
- **Database**: PostgreSQL (user data, action history, puzzle definitions)
- **Cache/Leaderboard**: Redis (sorted sets for real-time rankings)
- **Real-time Updates**: WebSocket (Socket.io)
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: AWS (ECS/EC2)

### Data Flow
1. User authenticates → receives JWT
2. User starts action → server issues signed action token
3. User completes action → submits proof with action token
4. Server validates → updates score in Redis → broadcasts via WebSocket
5. All connected clients receive real-time leaderboard updates

---

## API Endpoints

### Authentication

#### `POST /api/v1/auth/login`
Authenticate user and receive JWT access token.

**Request:**
```json
{
  "username": "player123",
  "password": "securepass"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "username": "player123",
    "currentScore": 150
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `429`: Too many login attempts

---

#### `POST /api/v1/auth/refresh`
Refresh expired access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

### Action Management

#### `POST /api/v1/actions/start`
Initialize an action and receive a signed action token. This token is required to complete the action and prevents unauthorized score increases.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "actionType": "puzzle",
  "actionId": "puzzle_123"
}
```

**Response (200):**
```json
{
  "actionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1706025600,
  "actionDetails": {
    "actionId": "puzzle_123",
    "pointValue": 10,
    "timeLimit": 300
  }
}
```

**Action Token Payload (signed by server):**
```json
{
  "userId": "user_123",
  "actionType": "puzzle",
  "actionId": "puzzle_123",
  "nonce": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": 1706022000,
  "exp": 1706025600
}
```

**Errors:**
- `401`: Unauthorized (invalid or missing JWT)
- `400`: Invalid action type or action ID
- `429`: Rate limit exceeded (max 10 action starts per minute)

---

#### `POST /api/v1/actions/complete`
Submit proof of action completion. Server validates the proof and updates the user's score if valid.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "actionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "proof": {
    "actionId": "puzzle_123",
    "answer": "ABC123",
    "completionTime": 45
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "pointsEarned": 10,
  "newTotalScore": 160,
  "newRank": 7,
  "timestamp": 1706022045
}
```

**Server-side Validation Steps:**
1. Verify JWT signature (authentication)
2. Verify action token signature (prevents tampering)
3. Check action token expiration (must complete within time limit)
4. Check nonce hasn't been used (prevents replay attacks)
5. Validate proof against stored correct answer
6. Check completion time is realistic (anti-cheat)

**Errors:**
- `401`: Unauthorized (invalid JWT)
- `403`: Action token invalid, expired, or already used
- `400`: Invalid proof (wrong answer)
- `422`: Completion time unrealistic (too fast/slow)
- `429`: Rate limit exceeded

---

### Leaderboard

#### `GET /api/v1/leaderboard`
Retrieve the current top 10 players. This endpoint is useful for initial page load; real-time updates should use WebSocket.

**Query Parameters:**
- `limit` (optional, default: 10): Number of top players to return

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user_456",
      "username": "ProPlayer",
      "score": 1250
    },
    {
      "rank": 2,
      "userId": "user_789",
      "username": "Challenger",
      "score": 980
    }
  ],
  "totalPlayers": 5420,
  "updatedAt": 1706022000
}
```

---

#### `GET /api/v1/leaderboard/user/:userId`
Get a specific user's rank and score.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "userId": "user_123",
  "username": "player123",
  "score": 160,
  "rank": 245,
  "percentile": 95.5
}
```

**Errors:**
- `404`: User not found

---

## WebSocket Connection

### Connection Endpoint
```
ws://api.example.com/leaderboard
```

### Authentication
Send JWT in connection query string or initial message:
```javascript
const socket = io('ws://api.example.com/leaderboard', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events from Server → Client

#### `leaderboard:initial`
Sent immediately upon connection with current top 10.

```json
{
  "type": "leaderboard:initial",
  "data": {
    "leaderboard": [
      { "rank": 1, "userId": "user_456", "username": "ProPlayer", "score": 1250 },
      { "rank": 2, "userId": "user_789", "username": "Challenger", "score": 980 }
    ],
    "timestamp": 1706022000
  }
}
```

#### `leaderboard:update`
Sent whenever the top 10 changes (any player in top 10 scores points or a new player enters top 10).

```json
{
  "type": "leaderboard:update",
  "data": {
    "leaderboard": [
      { "rank": 1, "userId": "user_456", "username": "ProPlayer", "score": 1260 }
    ],
    "changedRanks": [1, 3, 7],
    "timestamp": 1706022045
  }
}
```

#### `score:update`
Sent to a specific user when their score changes (even if not in top 10).

```json
{
  "type": "score:update",
  "data": {
    "userId": "user_123",
    "newScore": 170,
    "newRank": 240,
    "pointsEarned": 10
  }
}
```

### Events from Client → Server

#### `leaderboard:subscribe`
Request to receive real-time updates.

```json
{
  "type": "leaderboard:subscribe"
}
```

#### `leaderboard:unsubscribe`
Stop receiving updates.

```json
{
  "type": "leaderboard:unsubscribe"
}
```

---

## Data Models

### PostgreSQL Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
```

#### Actions Table
```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  action_id VARCHAR(100) NOT NULL,
  points_earned INTEGER NOT NULL,
  completion_time INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_actions_user_id ON actions(user_id);
CREATE INDEX idx_actions_timestamp ON actions(timestamp);
```

#### Puzzles Table (Example action type)
```sql
CREATE TABLE puzzles (
  id VARCHAR(100) PRIMARY KEY,
  difficulty VARCHAR(20) NOT NULL,
  correct_answer VARCHAR(255) NOT NULL,
  point_value INTEGER NOT NULL,
  min_completion_time INTEGER NOT NULL,
  max_completion_time INTEGER NOT NULL
);
```

### Redis Data Structures

#### Leaderboard (Sorted Set)
```
Key: leaderboard
Type: Sorted Set
Members: userId
Scores: user's total score

Commands:
- ZADD leaderboard 150 user_123
- ZREVRANGE leaderboard 0 9 WITHSCORES  (get top 10)
- ZREVRANK leaderboard user_123  (get user's rank)
- ZINCRBY leaderboard 10 user_123  (increment score)
```

#### Used Nonces (Set with expiration)
```
Key: nonce:<nonce_value>
Type: String
Value: "used"
TTL: 3600 seconds (1 hour)

Commands:
- SET nonce:550e8400-e29b-41d4-a716-446655440000 "used" EX 3600
- EXISTS nonce:550e8400-e29b-41d4-a716-446655440000
```

#### Rate Limiting (String with expiration)
```
Key: ratelimit:action:start:<user_id>
Type: String
Value: count
TTL: 60 seconds

Commands:
- INCR ratelimit:action:start:user_123
- EXPIRE ratelimit:action:start:user_123 60
- GET ratelimit:action:start:user_123
```

---

## Security Measures

### 1. Action Token System
- Server generates signed JWT when action starts
- Token contains: userId, actionId, nonce (unique ID), expiration
- Client must submit this token to complete action
- Server verifies signature to ensure token wasn't forged

### 2. Replay Attack Prevention
- Each action token contains a unique nonce
- Nonce is stored in Redis after first use
- Subsequent attempts with same nonce are rejected
- Nonces expire after 1 hour (TTL in Redis)

### 3. Rate Limiting
Per-user rate limits:
- Action starts: 10 per minute
- Action completions: 5 per minute
- Login attempts: 5 per 15 minutes

Implemented using Redis INCR with TTL.

### 4. Server-Side Validation
- Never trust client-submitted scores
- All score calculations happen server-side
- Validate completion time is within realistic bounds
- Check action prerequisites (user started the action)

### 5. Authentication
- JWT with short expiration (15 minutes)
- Refresh tokens for long-lived sessions
- HTTPS required for all API calls
- WebSocket authenticated via JWT

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "INVALID_ACTION_TOKEN",
    "message": "The action token has expired or is invalid",
    "details": {
      "expiresAt": 1706022000,
      "currentTime": 1706025600
    }
  }
}
```

### Error Codes
- `INVALID_CREDENTIALS`: Login failed
- `TOKEN_EXPIRED`: JWT expired, use refresh token
- `INVALID_ACTION_TOKEN`: Action token invalid/expired/used
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_PROOF`: Submitted answer is incorrect
- `ACTION_NOT_FOUND`: Action ID doesn't exist
- `UNREALISTIC_COMPLETION`: Completion time suspicious

---

## Improvements & Future Considerations

### Performance Optimizations
1. **Caching Layer**: Cache frequently accessed data (user profiles, puzzle definitions) in Redis
2. **Database Read Replicas**: Use PostgreSQL read replicas for leaderboard queries to reduce load on primary DB
3. **WebSocket Scaling**: Use Redis Pub/Sub to coordinate WebSocket messages across multiple server instances
4. **CDN**: Serve static leaderboard data via CDN for users far from origin server

### Security Enhancements
1. **CAPTCHA**: Add CAPTCHA on login to prevent brute force attacks
2. **Anomaly Detection**: Monitor for suspicious patterns (too many perfect scores, impossible completion times)
3. **IP-based Rate Limiting**: Add secondary rate limits per IP address
4. **Audit Logging**: Log all score changes for forensic analysis

### Feature Additions
1. **Leaderboard History**: Track daily/weekly/monthly leaderboards
2. **Achievement System**: Award badges for milestones
3. **Social Features**: Friend leaderboards, challenges between users
4. **Admin Dashboard**: Real-time monitoring of scores, manual score adjustments

### Scalability Considerations
1. **Horizontal Scaling**: Use load balancer (NGINX/AWS ALB) to distribute traffic across multiple app servers
2. **Database Sharding**: Shard user data by user ID ranges if user base exceeds millions
3. **Regional Deployment**: Deploy to multiple AWS regions for global users
4. **Message Queue**: Use SQS/RabbitMQ to handle score update spikes asynchronously

### Monitoring & Observability
1. **Metrics**: Track API latency, error rates, WebSocket connection count
2. **Logging**: Centralized logging (CloudWatch/ELK stack)
3. **Alerting**: Alert on high error rates, database connection issues, Redis failures
4. **Tracing**: Distributed tracing (Jaeger/X-Ray) for request flow visibility

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for local development)

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/leaderboard
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=10
```

### Running Locally
```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Start development server
npm run dev

# Run tests
npm test
```

---

## Deployment

### AWS Architecture
1. **ECS/Fargate**: Run containerized application servers
2. **Application Load Balancer**: Distribute traffic, handle WebSocket upgrades
3. **RDS PostgreSQL**: Managed database with automated backups
4. **ElastiCache Redis**: Managed Redis cluster
5. **CloudWatch**: Monitoring and logging
6. **ACM**: SSL/TLS certificates

### Deployment Pipeline
1. Code pushed to GitHub
2. GitHub Actions runs tests
3. Build Docker image, push to ECR
4. Update ECS service with new image
5. Rolling deployment (zero downtime)

---

## Testing Strategy

### Unit Tests
- Action validation logic
- JWT generation/verification
- Score calculation
- Rate limiting logic

### Integration Tests
- API endpoint flows (start → complete action)
- Database operations
- Redis operations
- WebSocket message broadcasting

### Load Tests
- Simulate 10,000 concurrent WebSocket connections
- Measure API response times under load
- Test Redis performance with 1M+ users in leaderboard

### Security Tests
- Attempt to forge action tokens
- Test replay attack prevention
- Verify rate limiting effectiveness
- Test authentication bypass attempts

---

## Support & Maintenance

### Monitoring Checklist
- [ ] API error rate < 1%
- [ ] P95 response time < 200ms
- [ ] WebSocket connection success rate > 99%
- [ ] Redis hit rate > 95%
- [ ] Database connection pool utilization < 80%

### Incident Response
1. Check CloudWatch metrics/logs
2. Verify Redis and PostgreSQL health
3. Check recent deployments
4. Review error logs for patterns
5. Scale resources if needed
6. Communicate with users via status page