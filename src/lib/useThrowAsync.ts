import { useState } from "react";

export function useThrowAsync(): (error: unknown) => void {
  const [, setError] = useState();
  return (error: unknown) =>
    setError(() => {
      throw error;
    });
}
