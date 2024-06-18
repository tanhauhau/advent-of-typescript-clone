<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import '$lib/monaco/index';
  import * as monaco from 'monaco-editor';
  import ts from 'typescript';

  const {
    challenge,
  }: { challenge: { prompt: string; user: string; tests: string } } = $props();
  const prompt = $derived(challenge.prompt);
  const user = $derived(challenge.user);
  const tests = $derived(challenge.tests);

  const widthResize = getResize('x');
  const heightResize = getResize('y');
  function getResize(direction: 'x' | 'y') {
    let value = $state(300);
    const eventPropName = ({ x: 'clientX', y: 'clientY' } as const)[direction];

    function resizeMouseDown(event: MouseEvent) {
      const initialCursorPosition = event[eventPropName];
      const initialValue = value;

      document.addEventListener('mousemove', resizeMouseMove);
      document.addEventListener('mouseup', resizeMouseUp);

      function resizeMouseMove(event: MouseEvent) {
        const delta = event[eventPropName] - initialCursorPosition;
        value = initialValue + delta;
      }
      function resizeMouseUp() {
        document.removeEventListener('mousemove', resizeMouseMove);
        document.removeEventListener('mouseup', resizeMouseUp);
      }
    }

    return {
      get value() {
        return value;
      },
      resizeMouseDown,
    };
  }

  //
  let userEditorContainer: HTMLElement | undefined = $state();
  let testsEditorContainer: HTMLElement | undefined = $state();
  const USER_FILE_PATH = 'file:///user.ts';
  const TESTS_FILE_PATH = 'file:///tests.ts';
  let hasErrors = $state(false);
  let initialised = $state(false);

  onMount(async () => {
    monaco.languages.typescript.typescriptDefaults.setExtraLibs([
      {
        content: `declare module 'type-testing' {
          export type Expect<T extends true> = Equal<T, true>;
          export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
        }`,
        filePath: 'file://node_modules/@types/type-testing/index.d.ts',
      },
    ]);

    const userUri = monaco.Uri.parse(USER_FILE_PATH);
    const userModel = monaco.editor.createModel(user, 'typescript', userUri);
    const userEditor = monaco.editor.create(userEditorContainer!, {
      automaticLayout: true,
    });
    userEditor.setModel(userModel);

    const testUri = monaco.Uri.parse(TESTS_FILE_PATH);
    const testModel = monaco.editor.createModel(tests, 'typescript', testUri);
    const testEditor = monaco.editor.create(testsEditorContainer!, {
      automaticLayout: true,
      readOnly: true,
      renderValidationDecorations: 'on',
    });
    testEditor.setModel(testModel);

    userModel.onDidChangeContent(typecheck);
    await typecheck();

    initialised = true;

    async function typecheck() {
      try {
        const getTsWorker =
          await monaco.languages.typescript.getTypeScriptWorker();
        const tsWorker = await getTsWorker(userUri);

        const errors = [];
        for (const file of [USER_FILE_PATH, TESTS_FILE_PATH]) {
          const diagnostics = (
            await Promise.all([
              tsWorker.getSemanticDiagnostics(file),
              tsWorker.getSyntacticDiagnostics(file),
            ])
          ).flat(Infinity) as monaco.languages.typescript.Diagnostic[];
          errors.push(...diagnostics);

          const model = monaco.editor.getModel(monaco.Uri.parse(file))!;

          const markers = diagnostics.map((diagnostic) => {
            const start = model.getPositionAt(diagnostic.start!);
            const end = model.getPositionAt(
              diagnostic.start! + diagnostic.length!
            );

            return {
              message: ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                '\n'
              ),
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: start.lineNumber,
              startColumn: start.column,
              endLineNumber: end.lineNumber,
              endColumn: end.column,
            };
          });
          monaco.editor.setModelMarkers(model, model.getLanguageId(), markers);
        }

        hasErrors = errors.length > 0;
      } catch {
        setTimeout(typecheck, 1000);
      }
    }
  });
  onDestroy(() => {
    monaco.editor.getModels().forEach((model) => model.dispose());
    monaco.editor.getEditors().forEach((editor) => editor.dispose());
  });
</script>

<div class="h-[calc(100vh-30px)] w-full flex flex-row p-4">
  <div
    class="bg-zinc-200 border border-zinc-500 rounded-xl flex flex-col overflow-hidden"
    style:width="{widthResize.value}px"
  >
    <div class="p-2 bg-zinc-300 border-b border-zinc-500">Description</div>
    <div class="p-2 overflow-y-auto">
      {@html prompt}
    </div>
  </div>
  <button
    class="w-3 grid place-content-center cursor-col-resize group"
    onmousedown={widthResize.resizeMouseDown}
  >
    <div
      class="w-1 h-[60px] bg-zinc-200 group-hover:bg-zinc-400 transition-colors duration-500 rounded"
    ></div>
  </button>
  <div
    class="flex-1 flex flex-col overflow-hidden border border-zinc-500 rounded-xl"
  >
    <div class="p-2 bg-zinc-300 border-b border-zinc-500">Code</div>
    <div style:height="{heightResize.value}px">
      <div class="w-full h-full" bind:this={userEditorContainer}></div>
    </div>
    <button
      class="h-3 grid bg-zinc-100 border-y border-zinc-500 place-content-center cursor-row-resize group"
      onmousedown={heightResize.resizeMouseDown}
    >
      <div
        class="h-1 w-[60px] bg-zinc-200 group-hover:bg-zinc-400 transition-colors duration-500 rounded"
      ></div>
    </button>
    <div class="flex-1 overflow-hidden">
      <div class="w-full h-full" bind:this={testsEditorContainer}></div>
    </div>
    <div class="p-2 bg-zinc-300 border-t border-zinc-500">
      {#if !initialised}
        Loading...
      {:else if hasErrors}
        Has Errors!
      {:else}
        All tests passed! 🎉
      {/if}
    </div>
  </div>
</div>
