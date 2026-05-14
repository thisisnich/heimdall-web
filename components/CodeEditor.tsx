"use client";
import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

function getLang(path: string) {
  if (path.endsWith(".css")) return css();
  if (path.endsWith(".json") || path.endsWith(".md")) return json();
  return javascript({ jsx: true, typescript: true });
}

interface Props {
  value: string;
  path: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ value, path, onChange, readOnly = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
      getLang(path),
      oneDark,
      EditorView.theme({
        "&": { height: "100%", fontSize: "12px", background: "#0a0a0a" },
        ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace" },
        ".cm-content": { padding: "8px 0", minHeight: "100%" },
        ".cm-gutters": { background: "#111113", borderRight: "1px solid #27272a", color: "#52525b" },
        ".cm-lineNumbers .cm-gutterElement": { padding: "0 8px 0 4px", minWidth: "3em" },
        ".cm-activeLine": { background: "#18181b" },
        ".cm-activeLineGutter": { background: "#18181b" },
        ".cm-cursor": { borderLeftColor: "#a78bfa" },
        ".cm-selectionBackground": { background: "#3730a3 !important" },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
    ];

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => { view.destroy(); viewRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />;
}
