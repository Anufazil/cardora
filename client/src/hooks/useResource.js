import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "../services/api";
export function useResource(path) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData((await api.get(path)).data.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, loading, error, reload, setData };
}
