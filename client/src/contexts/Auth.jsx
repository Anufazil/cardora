import { createContext, useContext, useEffect, useState } from "react";
import { api, prepareCsrf } from "../services/api";
const Context = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  async function refresh() {
    setError(null);
    try {
      await prepareCsrf();
      const { data } = await api.get("/auth/me");
      setUser(data.data);
    } catch (e) {
      if (e.response?.status !== 401)
        setError("Cardora could not connect to the server.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, setUser, loading, error, refresh, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
