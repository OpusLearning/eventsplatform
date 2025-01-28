#!/bin/bash

##############################################################################
# Debug mode: prints each command as executed
##############################################################################
set -x

echo "[DEBUG] Running test_auth.sh from: $(pwd)"

##############################################################################
# Configuration
##############################################################################

# Base URL of your API
BASE_URL="http://localhost:5000/api/auth"

# Generate a timestamp-based email to avoid collisions
USER_EMAIL="testuser$(date +%s)@example.com"
USER_PASSWORD="test12345"

# (Optional) JWT_SECRET if needed, not directly used by this script
JWT_SECRET="MVOeaaZ9S9PTDJU9Xk7b2apticYT8ftmaTAUPFSFkb0NoH9VkMXEaSf4hBPTu9"

# Will store the JWT token after login
TOKEN=""

# Debug logs to confirm values
echo "[DEBUG] BASE_URL = $BASE_URL"
echo "[DEBUG] USER_EMAIL = $USER_EMAIL"
echo "[DEBUG] USER_PASSWORD = $USER_PASSWORD"

##############################################################################
# Helper function for "positive" tests (expect 200 or 201)
##############################################################################
print_result() {
  if [ "$1" -eq 200 ] || [ "$1" -eq 201 ]; then
    echo -e "\e[32mPASS\e[0m $2"
  else
    echo -e "\e[31mFAIL\e[0m $2 (HTTP $1)"
  fi
}

echo "Starting authentication tests..."

##############################################################################
# 1. Google OAuth Endpoint (likely fails without a real code)
##############################################################################
echo "Testing Google OAuth callback (should fail with mock-code error)"
curl -v -X GET "$BASE_URL/google/callback?code=mock-code" -w "\n"

##############################################################################
# 2. Signup Endpoint (Positive Test)
##############################################################################
SIGNUP_RESPONSE=$(
  curl -v -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/signup" \
    -H "Content-Type: application/json" \
    -d '{
          "name": "Test User",
          "email": "'"$USER_EMAIL"'",
          "password": "'"$USER_PASSWORD"'"
        }'
)
print_result "$SIGNUP_RESPONSE" "Signup endpoint"

# Sleep briefly to ensure the new user is fully committed before login
sleep 1

##############################################################################
# 3. Login Endpoint (Positive Test)
##############################################################################
LOGIN_RESPONSE=$(
  curl -v -o login_response.json -w "%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
          "email": "'"$USER_EMAIL"'",
          "password": "'"$USER_PASSWORD"'"
        }'
)
# Extract the token from the JSON response (if present)
TOKEN=$(jq -r .token login_response.json 2>/dev/null)

print_result "$LOGIN_RESPONSE" "Login endpoint"

##############################################################################
# 4. Protected Route (without token) -> Expect 401
##############################################################################
PROTECTED_NO_TOKEN=$(
  curl -v -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/protected-route"
)

if [ "$PROTECTED_NO_TOKEN" -eq 401 ]; then
  echo -e "\e[32mPASS\e[0m Protected route without token => 401 as expected"
else
  echo -e "\e[31mFAIL\e[0m Protected route without token => (HTTP $PROTECTED_NO_TOKEN)"
fi

##############################################################################
# 5. Protected Route (with valid token) -> Expect 200
##############################################################################
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  PROTECTED_WITH_TOKEN=$(
    curl -v -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/protected-route" \
      -H "Authorization: Bearer $TOKEN"
  )
  print_result "$PROTECTED_WITH_TOKEN" "Protected route with valid token"
else
  echo -e "\e[31mFAIL\e[0m Protected route with valid token (No token generated)"
fi

##############################################################################
# 6. Admin Route (without admin role) -> Expect 401
##############################################################################
ADMIN_WITHOUT_ADMIN=$(
  curl -v -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/admin" \
    -H "Authorization: Bearer $TOKEN"
)

if [ "$ADMIN_WITHOUT_ADMIN" -eq 401 ]; then
  echo -e "\e[32mPASS\e[0m Admin route without admin role => 401 as expected"
else
  echo -e "\e[31mFAIL\e[0m Admin route without admin role => (HTTP $ADMIN_WITHOUT_ADMIN)"
fi

echo "Authentication tests completed."

# Cleanup
rm -f login_response.json
