import type { Step } from '../types';

const step: Step = {
  id: '01-create-element',
  title: 'createElement — building the virtual DOM',

  explanation: `
React's first job is to turn JSX into plain JavaScript objects — a **virtual DOM**.

The Babel plugin transforms JSX like \`<h1>Hello</h1>\` into a function call:

\`\`\`js
UnReact.createElement("h1", null, "Hello")
\`\`\`

Your job is to implement \`createElement\` so it returns a node like:

\`\`\`js
{
  type: "h1",
  props: { children: [ { type: "TEXT_ELEMENT", props: { nodeValue: "Hello", children: [] } } ] }
}
\`\`\`

**Two functions to write:**

1. \`createElement(type, props, ...children)\` — return an object with \`type\` and \`props\` (props should include \`children\`, with any string/number children wrapped via \`createTextElement\`).
2. \`createTextElement(value)\` — return a node with \`type: "TEXT_ELEMENT"\` and \`props: { nodeValue: value, children: [] }\`.

The platform provides a tiny \`render\` function that walks the tree and mounts it into the DOM, so once your two functions are right the JSX challenge on the right will render correctly.
  `.trim(),

  prevCode: '',

  starterCode: `function createElement(type, props, ...children) {
  // Return an object that describes this DOM node — what it is, the
  // attributes it should carry, and the children that go inside it.
  //
  // Heads-up: children arrive as a mix of element objects (from nested
  // createElement calls) and primitives (strings, numbers). Mixing shapes
  // will break the renderer; every child needs the same wrapper.
}

function createTextElement(value) {
  // Wrap a primitive into a node of its own so the renderer can treat
  // every child uniformly. There's no real DOM element involved yet —
  // that comes later when render() walks the tree.
}
`,

  solution: `function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(value) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: value, children: [] },
  };
}
`,

  hostCode: `// Provided by the platform: a minimal recursive render so we can
// see your createElement output mounted into the page.
function render(element, container) {
  const dom = element.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(element.type);
  const props = element.props || {};
  Object.keys(props)
    .filter((k) => k !== "children")
    .forEach((k) => { dom[k] = props[k]; });
  (props.children || []).forEach((child) => render(child, dom));
  container.appendChild(dom);
}
const UnReact = { createElement, render };
`,

  jsxChallenge: `<div>
  <h1>Hello, un-React!</h1>
  <p>You just built a virtual DOM.</p>
</div>`,

  expectedHtml: `<div><h1>Hello, un-React!</h1><p>You just built a virtual DOM.</p></div>`,

  hints: [
    'Use the rest parameter `...children` so callers can pass any number of children.',
    'String and number children must be wrapped — `typeof child === "object"` distinguishes elements from primitives.',
    'Spread the incoming `props` so attributes like `id` or `className` survive.',
  ],

  settleMs: 0,
};

export default step;
