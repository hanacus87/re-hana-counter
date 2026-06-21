export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`api_error_${status}`);
    this.status = status;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new ApiError(res.status);
  }
  return res;
}
