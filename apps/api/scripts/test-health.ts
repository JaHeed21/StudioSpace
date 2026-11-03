const apiUrl = process.env.API_URL ?? "http://localhost:4000";

try {
  const response = await fetch(`${apiUrl}/api/health`);
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(`Health check returned HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  console.info("API health check passed", payload);
} catch (error) {
  console.error(`API health check failed for ${apiUrl}`, error);
  process.exitCode = 1;
}

