# Conversation Memory Guide

## Overview
The conversation memory feature allows the LLM to maintain context across multiple chat exchanges, enabling more natural and coherent conversations with users.

## How It Works

### 1. History Retrieval
When a user sends a message, the backend:
1. Identifies the user via Firebase authentication
2. Queries Firestore `chatExchanges` collection for the user's recent messages
3. Retrieves the last 10 exchanges (20 messages total: 10 user + 10 assistant)
4. Orders them chronologically (oldest first)

### 2. Context Building
The conversation history is formatted as a context string:
```
Previous conversation:
User: [previous user message 1]
Assistant: [previous assistant response 1]
User: [previous user message 2]
Assistant: [previous assistant response 2]
...
```

### 3. LLM Prompt Enhancement
The context is prepended to the system prompt before sending to Gemini:
```
You are a car recommendation assistant.

Previous conversation:
[conversation history here]

User request:
"[current user message]"

[rest of prompt...]
```

### 4. Response Generation
The LLM uses the conversation context to:
- Avoid repeating previously recommended cars
- Remember user preferences mentioned earlier
- Provide continuity in multi-turn conversations
- Reference previous advice or recommendations

## Implementation Details

### Backend Changes

#### `llm.service.ts`
```typescript
interface ChatMessage {
  sender: "user" | "assistant";
  message: string;
  timestamp?: Date;
}

export async function generateLLMResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<LLMResponse>
```

**Key Points**:
- Added `conversationHistory` parameter (optional, defaults to empty array)
- Builds context string from history array
- Injects context into prompt before current user message

#### `chat.controller.ts`
```typescript
// Fetch recent conversation history (last 10 messages)
const snapshot = await db
  .collection("chatExchanges")
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc")
  .limit(10)
  .get();

// Build conversation history in chronological order
conversationHistory = snapshot.docs
  .reverse()
  .flatMap((doc) => {
    const data = doc.data();
    return [
      { sender: "user", message: data.userMessage },
      { sender: "assistant", message: data.assistantReply },
    ];
  });

// Pass history to LLM
const llmResult = await generateLLMResponse(message, conversationHistory);
```

**Key Points**:
- Fetches last 10 exchanges before generating response
- Handles fetch errors gracefully (continues without context if fetch fails)
- Orders messages chronologically (oldest first) for proper context flow
- Passes formatted history array to LLM service

## Configuration

### History Window Size
Currently configured to fetch **10 exchanges** (20 messages total).

To adjust:
```typescript
// In chat.controller.ts
.limit(10) // Change this number
```

**Considerations**:
- **Larger window**: More context, but longer prompts = higher API costs and latency
- **Smaller window**: Faster responses, lower costs, but less context
- **Recommended**: 5-15 exchanges depending on use case

### Database Index
For optimal performance, ensure Firestore has a composite index:
```
Collection: chatExchanges
Fields: userId (Ascending), createdAt (Descending)
```

Firebase will prompt to create this index automatically on first query.

## Testing

### 1. Multi-turn Conversation Test
```bash
# Terminal 1: Start backend
cd car-genie-backend
npm run dev

# Terminal 2: Test conversation
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "I need a family car"}'

# Second message referring to first
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "What colors are available?"}'
```

Expected: Second response should reference the family car context from first message.

### 2. Avoid Repetition Test
```bash
# Ask for recommendations
curl -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Show me SUVs under 30M"}'

# Ask again for similar recommendations
curl -X POST http://localhost:4000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Any other SUVs in that price range?"}'
```

Expected: Second response should NOT repeat cars from first response.

### 3. Context Continuity Test
```bash
# Establish preference
curl -X POST http://localhost:4000/api/chat \
  -d '{"message": "I prefer automatic transmission"}'

# Later message
curl -X POST http://localhost:4000/api/chat \
  -d '{"message": "Show me sedans"}'
```

Expected: Sedan recommendations should prioritize automatic transmission based on earlier preference.

## Performance Impact

### Query Cost
- **Firestore Reads**: 1 read per exchange (10 reads per chat request)
- **Total per chat**: ~11 reads (10 history + 1 write for new exchange)

### Latency
- **History fetch**: ~50-100ms (depends on Firestore location)
- **LLM processing**: Minimal increase (<100ms) for context injection
- **Total added latency**: ~50-200ms

### Token Usage
- **Context size**: ~100-500 tokens (depends on message length and history window)
- **Cost increase**: Minimal (Gemini 2.5 Flash is very cheap)

## Error Handling

### History Fetch Failure
If Firestore query fails:
```typescript
try {
  // Fetch history
} catch (historyErr) {
  console.warn("Failed to fetch conversation history, continuing without context");
}
```
- Request continues without context (no hard failure)
- Response still generated, just without historical awareness

### Missing Index
If composite index doesn't exist:
- Firestore throws error with link to create index
- First request fails, but subsequent requests work after index is created

## Future Enhancements

### Conversation Sessions
Track distinct conversations:
```typescript
interface ChatExchange {
  userId: string;
  sessionId: string; // New field
  userMessage: string;
  assistantReply: string;
  createdAt: Date;
}
```

### Smart Context Truncation
Instead of fixed 10-message window:
- Summarize older messages
- Prioritize recent + important context
- Use semantic search to find relevant past exchanges

### User-controllable Context
Allow users to:
- Clear conversation context (start fresh)
- Reference specific past exchanges
- Exclude certain messages from context

## Troubleshooting

### LLM Still Repeating Recommendations
1. Check if history is being passed correctly:
   ```typescript
   console.log("Conversation history:", conversationHistory);
   ```
2. Verify Firestore query returns results:
   ```typescript
   console.log("History docs count:", snapshot.size);
   ```
3. Increase context window (change `.limit(10)` to `.limit(20)`)
4. Add explicit instruction in prompt:
   ```
   IMPORTANT: Do not recommend any cars that were already suggested in the conversation above.
   ```

### Performance Issues
1. Reduce history window size: `.limit(5)`
2. Add pagination for very long conversations
3. Cache recent history in memory (with TTL)
4. Use Firestore offline persistence

### Context Not Persisting Across Sessions
- Conversation history is user-specific (based on Firebase UID)
- Anonymous users get new UID each session → no persistence
- Solution: Encourage users to sign in for persistent history

## Development Status
✅ History retrieval implemented  
✅ Context building implemented  
✅ LLM prompt enhancement  
✅ Error handling  
✅ Firestore integration  
⚠️ Performance optimization (basic implementation)  
❌ Conversation sessions not yet implemented  
❌ Smart context truncation not yet implemented  
❌ User controls not yet implemented  
