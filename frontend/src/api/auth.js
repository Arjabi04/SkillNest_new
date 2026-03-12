const API_URL = "http://localhost:4000/api";

const parseErrorResponse = async (res, fallbackMessage) => {
  try {
    const data = await res.json();
    if (data?.msg) return data.msg;
    if (data?.error) return data.error;
  } catch {
    // Ignore parse errors and fall back to default message.
  }

  return fallbackMessage;
};

const requestJson = async (url, options, fallbackMessage) => {
  let res;

  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!res.ok) {
    const message = await parseErrorResponse(res, fallbackMessage);
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return res.json();
};

export const signup = async (username, email, password) => {
  return requestJson(
    `${API_URL}/signup`,
    {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
    },
    "Signup failed"
  );
}; 

export const login = async (email, password) => {
  return requestJson(
    `${API_URL}/login`,
    {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    },
    "Login failed"
  );
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
