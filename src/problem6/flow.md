sequenceDiagram
    participant Client
    participant API as API Server
    participant Auth as Auth Service
    participant Redis
    participant DB as PostgreSQL
    participant WS as WebSocket Server

    Note over Client,WS: 1. User Authentication
    Client->>API: POST /api/v1/auth/login<br/>{username, password}
    API->>DB: Verify credentials
    DB-->>API: User data
    API->>Auth: Generate JWT + Refresh Token
    Auth-->>API: Tokens
    API-->>Client: {accessToken, refreshToken, user}

    Note over Client,WS: 2. WebSocket Connection for Real-time Updates
    Client->>WS: Connect ws://api/leaderboard<br/>Auth: JWT token
    WS->>Auth: Verify JWT
    Auth-->>WS: Valid
    WS->>Redis: ZREVRANGE leaderboard 0 9
    Redis-->>WS: Top 10 users
    WS-->>Client: leaderboard:initial event

    Note over Client,WS: 3. Start Action (Get Signed Token)
    Client->>API: POST /api/v1/actions/start<br/>{actionId: "puzzle_123"}
    API->>Auth: Verify JWT
    Auth-->>API: Valid user
    API->>Redis: Check rate limit<br/>INCR ratelimit:start:user_123
    Redis-->>API: Count: 3 (within limit)
    API->>DB: Get puzzle details
    DB-->>API: {pointValue: 10, correctAnswer: "ABC"}
    API->>Auth: Generate action token<br/>{userId, actionId, nonce, exp}
    Auth-->>API: Signed action token
    API-->>Client: {actionToken, expiresAt, actionDetails}

    Note over Client,WS: 4. User Completes Action (Client-side)
    Client->>Client: User solves puzzle<br/>(no server interaction)

    Note over Client,WS: 5. Submit Action Completion
    Client->>API: POST /api/v1/actions/complete<br/>{actionToken, proof: {answer: "ABC"}}
    API->>Auth: Verify JWT
    Auth-->>API: Valid user
    API->>Auth: Verify action token signature
    Auth-->>API: Valid, extract {userId, nonce, actionId}
    
    API->>Redis: EXISTS nonce:550e8400-e29b...
    Redis-->>API: 0 (not used)
    
    API->>Redis: Check rate limit<br/>INCR ratelimit:complete:user_123
    Redis-->>API: Count: 2 (within limit)
    
    API->>DB: Get correct answer for puzzle_123
    DB-->>API: correctAnswer: "ABC"
    
    API->>API: Validate proof.answer == "ABC"<br/>Validate completion time realistic
    
    rect rgb(200, 255, 200)
        Note over API,Redis: All validations passed - Award points
        API->>Redis: SET nonce:550e8400-e29b... "used" EX 3600
        Redis-->>API: OK
        
        API->>Redis: ZINCRBY leaderboard 10 user_123
        Redis-->>API: newScore: 160
        
        API->>Redis: ZREVRANK leaderboard user_123
        Redis-->>API: rank: 6 (0-indexed)
        
        API->>DB: INSERT INTO actions<br/>(userId, actionId, pointsEarned, timestamp)
        DB-->>API: Action record created
        
        API->>DB: UPDATE users SET total_score = 160
        DB-->>API: User updated
    end
    
    API-->>Client: {success: true, pointsEarned: 10,<br/>newTotalScore: 160, newRank: 7}

    Note over Client,WS: 6. Broadcast Real-time Updates
    API->>WS: Trigger leaderboard update
    WS->>Redis: ZREVRANGE leaderboard 0 9 WITHSCORES
    Redis-->>WS: Updated top 10
    WS-->>Client: leaderboard:update event<br/>{leaderboard: [...], changedRanks: [7]}
    WS->>Client: score:update event<br/>{userId, newScore: 160, newRank: 7}
    
    Note over Client,WS: 7. Client Updates UI
    Client->>Client: Render updated leaderboard<br/>Show user's new score/rank