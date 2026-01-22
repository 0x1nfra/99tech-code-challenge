flowchart TD
    Start([Client submits<br/>action completion]) --> CheckJWT{Verify JWT<br/>in Auth header}
    
    CheckJWT -->|Invalid/Expired| Reject1[Return 401<br/>Unauthorized]
    CheckJWT -->|Valid| ExtractUser[Extract userId<br/>from JWT]
    
    ExtractUser --> CheckActionToken{Verify action token<br/>signature}
    
    CheckActionToken -->|Invalid signature| Reject2[Return 403<br/>Token tampered]
    CheckActionToken -->|Valid| CheckExpiry{Check token<br/>expiration}
    
    CheckExpiry -->|Expired| Reject3[Return 403<br/>Token expired]
    CheckExpiry -->|Not expired| ExtractNonce[Extract nonce<br/>from action token]
    
    ExtractNonce --> CheckNonce{Check if nonce<br/>already used<br/>Redis: EXISTS nonce:xxx}
    
    CheckNonce -->|Already used| Reject4[Return 403<br/>Replay attack detected]
    CheckNonce -->|Not used| CheckRateLimit{Check rate limit<br/>Redis: INCR ratelimit:xxx}
    
    CheckRateLimit -->|Exceeded| Reject5[Return 429<br/>Too many requests]
    CheckRateLimit -->|Within limit| ValidateProof{Validate proof<br/>DB: Get correct answer<br/>Compare with submission}
    
    ValidateProof -->|Wrong answer| Reject6[Return 400<br/>Invalid proof]
    ValidateProof -->|Correct| CheckTime{Validate<br/>completion time<br/>realistic?}
    
    CheckTime -->|Too fast/slow| Reject7[Return 422<br/>Suspicious timing]
    CheckTime -->|Realistic| MarkNonce[Mark nonce as used<br/>Redis: SET nonce:xxx 'used' EX 3600]
    
    MarkNonce --> UpdateScore[Update score<br/>Redis: ZINCRBY leaderboard points userId]
    
    UpdateScore --> GetRank[Get new rank<br/>Redis: ZREVRANK leaderboard userId]
    
    GetRank --> SaveAction[Save action to DB<br/>INSERT INTO actions]
    
    SaveAction --> Success[Return 200<br/>Success + new score/rank]
    
    Success --> Broadcast[Broadcast to WebSocket<br/>if leaderboard changed]
    
    Broadcast --> End([End])
    
    Reject1 --> End
    Reject2 --> End
    Reject3 --> End
    Reject4 --> End
    Reject5 --> End
    Reject6 --> End
    Reject7 --> End
    
    style Start fill:#a8e6cf
    style Success fill:#a8e6cf
    style Broadcast fill:#a8e6cf
    style End fill:#a8e6cf
    style Reject1 fill:#ff8b94
    style Reject2 fill:#ff8b94
    style Reject3 fill:#ff8b94
    style Reject4 fill:#ff8b94
    style Reject5 fill:#ff8b94
    style Reject6 fill:#ff8b94
    style Reject7 fill:#ff8b94
    style CheckNonce fill:#ffd3b6
    style MarkNonce fill:#ffd3b6
    style UpdateScore fill:#dcedc1
    style GetRank fill:#dcedc1