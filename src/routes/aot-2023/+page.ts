export async function load({ fetch }) {
  const response = await fetch('/api/challenges');
  const challenges = await response.json()
  return { challenges }
}