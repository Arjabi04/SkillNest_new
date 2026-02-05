// Decode JWT and check if it's expired
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has exp claim and if it's expired
    if (!payload.exp) return false;
    
    // exp is in seconds, convert to milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Return true if token hasn't expired yet (with 10 second buffer)
    return currentTime < expirationTime - 10000;
  } catch (err) {
    console.error("Token validation error:", err);
    return false;
  }
};

// Clear auth data from localStorage
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
};

// Get token if it's still valid, otherwise clear and return null
export const getValidToken = () => {
  const token = localStorage.getItem("token");
  
  if (!token) return null;
  
  if (!isTokenValid(token)) {
    clearAuth();
    return null;
  }
  
  return token;
};
