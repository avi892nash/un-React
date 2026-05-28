import type { Step } from '../types';

const step: Step = {
  id: '02-render',
  title: 'render — turning the tree into real DOM',

  explanation: `
You built **createElement** in the last step. It produces a tree of plain
JavaScript objects — a virtual DOM. But nothing is on the page yet. The tree
has to be walked and turned into real DOM nodes.

That's what \`render\` does. It takes one node from the tree plus a container
to put it in, and:

1. **Creates a DOM node** to match the VDOM node's \`type\`. There are two
   cases — text nodes need \`document.createTextNode\`, everything else gets
   \`document.createElement\`.
2. **Sets attributes** from the node's \`props\` onto the new DOM node. Every
   prop except \`children\` is an attribute or property — \`id\`, \`className\`,
   \`href\`, \`onClick\`, …
3. **Recurses into the children** — each child is itself a VDOM node, so
   call \`render\` again with the child and the freshly-created parent
   element as its container.
4. **Appends** the new node to the container.

The whole thing is one recursive function. About ten lines.

> This is the "naive" render — it always rebuilds the whole tree from
> scratch and gives you no way to update an existing tree. That's fine for
> now; the upcoming \`reconcileChildren\` step is where smart updates come
> in. The point of this step is to feel the moment where your VDOM
> abstraction *touches the page*.
  `.trim(),

  // The previous step's solution is the prelude — we now treat
  // createElement and createTextElement as part of the framework that
  // already exists. The learner picks up here.
  prevCode: `function createElement(type, props, ...children) {
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

  starterCode: `function render(element, container) {
  // Create a DOM node that matches element.type.
  // TEXT_ELEMENT nodes use a different API than regular elements.

  // Copy props onto the DOM node — everything except children.

  // Recurse: each child in element.props.children is itself a VDOM
  // node, so it goes through render too — with the newly-created node
  // as its container.

  // Finally, attach to the container so the result lands in the DOM.
}
`,

  solution: `function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const props = element.props || {};
  Object.keys(props)
    .filter((k) => k !== "children")
    .forEach((k) => {
      dom[k] = props[k];
    });

  (props.children || []).forEach((child) => render(child, dom));

  container.appendChild(dom);
}
`,

  // Provided by the platform: the UnReact object the JSX challenge will
  // dispatch through. The learner doesn't see this in the editor; we
  // wire it up here so their createElement + render get used together.
  hostCode: `const UnReact = { createElement, render };
`,

  jsxChallenge: `<div>
  <h1 id="hero">Now we render.</h1>
  <p>Walks the VDOM into real DOM.</p>
</div>`,

  expectedHtml:
    `<div><h1 id="hero">Now we render.</h1><p>Walks the VDOM into real DOM.</p></div>`,

  hints: [
    'TEXT_ELEMENT nodes use document.createTextNode("") — its actual text lives in nodeValue, which you\'ll set from props in the next step.',
    'props is a plain object of attribute names → values. Object.keys lets you iterate, .filter((k) => k !== "children") skips the one prop that\'s NOT an attribute.',
    'Children come back as another array of VDOM nodes. forEach over props.children and call render(child, dom) — the freshly-created node becomes the new container.',
  ],

  settleMs: 0,
};

export default step;
