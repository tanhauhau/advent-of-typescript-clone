<script>
  let { data } = $props();
  let challenges = $derived(data.challenges);
</script>

<h1 class="text-center my-12 text-4xl">Advent of TypeScript 2023</h1>
<ul class="grid grid-cols-3 gap-4 w-[500px] place-items-center mx-auto">
  {#each challenges as { name, url }}
    <li>
      <a class="bg-slate-300 block w-[150px] h-[150px] grid place-content-center" href={url}>{name}</a>
    </li>
  {/each}
</ul>
