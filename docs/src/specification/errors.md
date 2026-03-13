# Error Handling

All errors use **RFC 9457 Problem Details** format (ADR-0015).

## Error Response Format

```json
{
  "type": "https://api.opentabletop.org/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "No game found with slug 'nonexistent-game'",
  "instance": "/v1/games/nonexistent-game"
}
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string (URI) | Yes | Error type identifier |
| `title` | string | Yes | Human-readable summary |
| `status` | integer | Yes | HTTP status code |
| `detail` | string | No | Human-readable explanation specific to this occurrence |
| `instance` | string (URI) | No | URI of the request that caused the error |
| `errors` | array | No | Validation error details (see below) |

## Validation Errors

When request parameters fail validation, the response includes an `errors` array:

```json
{
  "type": "https://api.opentabletop.org/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more request parameters are invalid",
  "instance": "/v1/games?weight_min=6.0",
  "errors": [
    {
      "field": "weight_min",
      "message": "must be between 1.0 and 5.0",
      "value": "6.0"
    }
  ]
}
```

## Error Types

| Type URI | Status | Meaning |
|----------|--------|---------|
| `.../errors/not-found` | 404 | Resource does not exist |
| `.../errors/validation` | 400 | Request parameters invalid |
| `.../errors/rate-limited` | 429 | Rate limit exceeded |
| `.../errors/unauthorized` | 401 | API key required but not provided |
| `.../errors/forbidden` | 403 | API key lacks permission |
| `.../errors/internal` | 500 | Server error |

## Rate Limit Errors

Rate limit responses include standard headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710288000
Retry-After: 45

{
  "type": "https://api.opentabletop.org/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit of 60 requests per minute"
}
```
