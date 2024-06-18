<script lang="ts">
  import Challenge from '$lib/Challenge/Challenge.svelte';
  const { data } = $props();
</script>

<Challenge challenge={data.challenge} />
