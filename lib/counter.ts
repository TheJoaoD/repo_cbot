// Simple counter module to track API requests
// Note: In a production environment, you would use a database
// as this in-memory counter will reset when the server restarts
// or when deployed to serverless environments with multiple instances

let requestCount = 0

export function incrementCounter() {
  requestCount += 1
  return requestCount
}

export function getCounter() {
  return requestCount
}
