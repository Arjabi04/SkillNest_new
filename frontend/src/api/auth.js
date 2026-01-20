const API_URL = "http://localhost:4000/api";

export const signup = async (username, email, password) => {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw new Error("Signup failed");
  return await res.json();
}; 

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return await res.json();
};

export const adminLogin = async (username, password) => {
  const res = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || "Admin login failed");
  }
  return await res.json();
};

export const verifyAdmin = async () => {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) return { isAdmin: false };
  
  const res = await fetch(`${API_URL}/admin/verify`, {
    method: "GET",
    headers: { 
      "x-admin-token": adminToken 
    },
  });
  
  if (!res.ok) return { isAdmin: false };
  return await res.json();
};
