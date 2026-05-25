// Tokyo-Night-inspired syntax palette tuned for the grey UI. Mounted into
// every CodeMirror editor via the extensions array.

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@codemirror/state';

const palette = {
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  paleCyan: '#89ddff',
  green: '#9ece6a',
  peach: '#ff9e64',
  amber: '#e0af68',
  lavender: '#bb9af7',
  coral: '#f7768e',
  text: '#ececef',
  textDim: '#a8a8b0',
  muted: '#6b7280',
} as const;

const style = HighlightStyle.define([
  // Comments
  { tag: t.comment, color: palette.muted, fontStyle: 'italic' },
  { tag: t.lineComment, color: palette.muted, fontStyle: 'italic' },
  { tag: t.blockComment, color: palette.muted, fontStyle: 'italic' },
  { tag: t.docComment, color: palette.muted, fontStyle: 'italic' },

  // Keywords
  { tag: t.keyword, color: palette.blue },
  { tag: t.controlKeyword, color: palette.blue },
  { tag: t.modifier, color: palette.blue },
  { tag: t.definitionKeyword, color: palette.blue },
  { tag: t.moduleKeyword, color: palette.blue },
  { tag: t.operatorKeyword, color: palette.blue },
  { tag: t.self, color: palette.peach },
  { tag: t.null, color: palette.peach },
  { tag: t.bool, color: palette.peach },

  // Numbers
  { tag: t.number, color: palette.peach },
  { tag: t.integer, color: palette.peach },
  { tag: t.float, color: palette.peach },

  // Strings
  { tag: t.string, color: palette.green },
  { tag: t.special(t.string), color: palette.green },
  { tag: t.regexp, color: palette.amber },
  { tag: t.escape, color: palette.peach },

  // Functions
  { tag: t.function(t.variableName), color: palette.cyan },
  { tag: t.function(t.propertyName), color: palette.cyan },
  { tag: t.definition(t.function(t.variableName)), color: palette.cyan, fontWeight: '500' },
  { tag: t.definition(t.variableName), color: palette.text },
  { tag: t.propertyName, color: palette.cyan },

  // Variables / parameters
  { tag: t.variableName, color: palette.text },
  { tag: t.local(t.variableName), color: palette.text },
  { tag: t.special(t.variableName), color: palette.amber },
  { tag: t.definition(t.propertyName), color: palette.cyan },
  { tag: t.labelName, color: palette.lavender },

  // Types
  { tag: t.className, color: palette.lavender },
  { tag: t.typeName, color: palette.lavender },
  { tag: t.namespace, color: palette.lavender },

  // Operators / punctuation
  { tag: t.operator, color: palette.paleCyan },
  { tag: t.logicOperator, color: palette.paleCyan },
  { tag: t.bitwiseOperator, color: palette.paleCyan },
  { tag: t.compareOperator, color: palette.paleCyan },
  { tag: t.arithmeticOperator, color: palette.paleCyan },
  { tag: t.punctuation, color: palette.textDim },
  { tag: t.separator, color: palette.textDim },
  { tag: t.bracket, color: palette.textDim },
  { tag: t.brace, color: palette.textDim },
  { tag: t.paren, color: palette.textDim },
  { tag: t.squareBracket, color: palette.textDim },

  // JSX
  { tag: t.angleBracket, color: palette.coral },
  { tag: t.tagName, color: palette.coral },
  { tag: t.attributeName, color: palette.lavender },
  { tag: t.attributeValue, color: palette.green },

  // Misc
  { tag: t.heading, color: palette.blue, fontWeight: '600' },
  { tag: t.link, color: palette.cyan, textDecoration: 'underline' },
  { tag: t.invalid, color: palette.coral, textDecoration: 'underline wavy' },
  { tag: t.meta, color: palette.muted },
]);

export const customSyntaxHighlighting: Extension = syntaxHighlighting(style);
