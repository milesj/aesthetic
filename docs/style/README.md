# CSS-in-JS Style Engine

The `@aesthetic/style` package is a low-level, high-performance, atomic-based CSS-in-JS styling
engine. It can be used stand-alone but has been designed to power additional abstractions or APIs.

- [Getting started](./setup.md)
- [Rendering concepts](./concepts.md)
- [Features & options](./options.md)
- [Server-side rendering](./ssr.md)
- [Test utilities](./testing.md)
- [API](./api.md)

## What it provides

- Atomic based CSS. One declaration per class name.
- Specificity ranking so the intended property is always rendered.
- Font faces, keyframes, imports, and other globals are rendered before normal declarations.
- Media and support queries are grouped and rendered after normal declarations.
- Media queries are sorted mobile-first or desktop-first.
- Injection buffering for increased performance and reduced paints.
- Style declarations support pseudos, attributes, conditional at-rules, and nested declarations.
- Deterministic or atomic incremental CSS class names.
- Right-to-left (RTL) integration.
- Vendor prefixing for browsers with >= 1% market share.
- Unit suffixing for numerical values.
- First-class CSS variables support.
- Server-side rendering _and_ client-side hydration.
- Framework and library agnostic. Can be used stand-alone.

## What it _does not_ provide

- A plugin system, as such a system would degrade performance.
- Rendering of styles in the global scope: `div`, `a`, etc.
- Rendering of uncommon at-rules: `@namespace`, `@document`, `@page`, `@viewport`.

## Benefits

TODO

## Caveats

TODO