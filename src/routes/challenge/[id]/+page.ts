export let ssr = false;
export async function load({ params, fetch }) {
  const challengeId = params.id;
  const response = await fetch(`/api/challenge/${challengeId}`);
  const challenge = await response.json();
  return { challenge };
}