// Error handling (ADR-0015)
//
// All errors conform to RFC 9457 Problem Details:
//   {
//     "type": "https://api.opentabletop.org/errors/not-found",
//     "title": "Resource Not Found",
//     "status": 404,
//     "detail": "No game found with slug 'nonexistent-game'",
//     "instance": "/games/nonexistent-game"
//   }
//
// Validation errors include an `errors` array:
//   {
//     "type": "https://api.opentabletop.org/errors/validation",
//     "title": "Validation Error",
//     "status": 400,
//     "detail": "Request parameters failed validation",
//     "errors": [
//       { "field": "weight_min", "message": "must be between 1.0 and 5.0" }
//     ]
//   }
