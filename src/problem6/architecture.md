graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile App]
    end

    subgraph "Load Balancing"
        LB[NGINX Load Balancer<br/>AWS ALB]
    end

    subgraph "Application Layer"
        API1[API Server 1<br/>Node.js + Express]
        API2[API Server 2<br/>Node.js + Express]
        API3[API Server N<br/>Node.js + Express]
        WS[WebSocket Server<br/>Socket.io]
    end

    subgraph "Caching & Real-time"
        Redis[(Redis<br/>Sorted Sets for Leaderboard<br/>Strings for Nonces & Rate Limits)]
        PubSub[Redis Pub/Sub<br/>WebSocket Coordination]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Users, Actions, Puzzles)]
        DBReplica[(PostgreSQL<br/>Read Replica)]
    end

    subgraph "Authentication"
        JWT[JWT Service<br/>Token Generation & Validation]
    end

    Browser -->|HTTPS| LB
    Mobile -->|HTTPS| LB
    Browser -.->|WebSocket| WS
    Mobile -.->|WebSocket| WS
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis
    
    API1 --> DB
    API2 --> DB
    API3 --> DB
    
    API1 -.->|Read queries| DBReplica
    API2 -.->|Read queries| DBReplica
    API3 -.->|Read queries| DBReplica
    
    API1 --> JWT
    API2 --> JWT
    API3 --> JWT
    
    WS --> Redis
    WS --> PubSub
    API1 --> PubSub
    API2 --> PubSub
    API3 --> PubSub
    
    DB -.->|Replication| DBReplica

    style Redis fill:#ff6b6b
    style DB fill:#4ecdc4
    style LB fill:#95e1d3
    style JWT fill:#f3a683
    style WS fill:#ffeaa7