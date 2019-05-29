# React Integration

The core functionality of Aesthetic is isolated and provided by a [class instance](../setup.md).
This instance isn't easily accessible in hooks or HOCs, nor is the public API easy to work with. To
interop between React and Aesthetic cleanly, a handful of factory functions are required for using
hooks and HOCs.

## Factories

All of these factory functions require an `Aesthetic` class instance. I suggest executing each of
these factories in their own files, so that the underlying API can easily be imported and used.

### useStyles

The `useStylesFactory` function creates and returns a `useStyles` hook. This hook requires a style
sheet object and an _optional_ custom component name for use in debugging and generating class
names.

```ts
// useStyles.ts
import { useStylesFactory } from 'aesthetic-react';
import aesthetic from './aesthetic';

export default useStylesFactory(aesthetic);
```

### useTheme

The `useThemeFactory` function creates and returns a `useTheme` hook. This hook returns the current
theme object.

```ts
// useTheme.ts
import { useThemeFactory } from 'aesthetic-react';
import aesthetic from './aesthetic';

export default useThemeFactory(aesthetic);
```

### withStyles

The `withStylesFactory` function creates and returns a `withStyles` higher-order component. The HOC
supports all of the [options](#options) mentioned previously as props, except for `theme`.

```ts
// withStyles.ts
import { withStylesFactory, WithStylesWrappedProps } from 'aesthetic-react';
import { NativeBlock, ParsedBlock } from 'aesthetic-adapter-aphrodite'; // Or your adapter
import aesthetic, { Theme } from './aesthetic';

export type WithStylesProps = WithStylesWrappedProps<Theme, NativeBlock, ParsedBlock>;

export default withStylesFactory(aesthetic);
```

### withTheme

The `withThemeFactory` function creates and returns a `withTheme` higher-order component. The HOC
passes the current theme as a prop. It supports the `themePropName` and `pure` [options](#options)
mentioned previously as props.

```ts
// withTheme.ts
import { withThemeFactory, WithThemeWrappedProps } from 'aesthetic-react';
import aesthetic, { Theme } from './aesthetic';

export type WithThemeProps = WithThemeWrappedProps<Theme>;

export default withThemeFactory(aesthetic);
```

## Usage

We can style our components by wrapping the component declaration in a
[`withStyles` HOC](#withStyles) or utilizing the [`useStyles` hook](#useStyles) (provided by the
factories above). Both of these approaches require a function that returns a CSS object, known as a
style sheet, which is then used to dynamically generate CSS class names at runtime.

### HOC

When the styled and wrapped component is rendered, the style sheet is parsed and passed to the
`styles` prop. These styles can then be transformed to class names using the provided
[`cx` prop](../style.md#generating-class-names).

```tsx
import React from 'react';
import withStyles, { WithStylesProps } from './withStyles';

export type Props = {
  children: NonNullable<React.ReactNode>;
  icon?: React.ReactNode;
};

function Button({ children, cx, styles, icon }: Props & WithStylesProps) {
  return (
    <button type="button" className={cx(styles.button)}>
      {icon && <span className={cx(styles.icon)}>{icon}</span>}

      {children}
    </button>
  );
}

export default withStyles(theme => ({
  button: {
    display: 'inline-block',
    padding: theme.unit,
    // ...
  },
  icon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: theme.unit,
  },
}))(Button);
```

### Hook

When the component is rendered, the style sheet is parsed and returned from the hook alongside the
[`cx` helper](../style.md#generating-class-names), which is used for transforming the styles to
class names.

```tsx
import React from 'react';
import useStyles from './useStyles';

const styleSheet = theme => ({
  button: {
    display: 'inline-block',
    padding: theme.unit,
    // ...
  },
  icon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: theme.unit,
  },
});

export type Props = {
  children: NonNullable<React.ReactNode>;
  icon?: React.ReactNode;
};

export default function Button({ children, icon }: Props) {
  const [styles, cx] = useStyles(styleSheet);

  return (
    <button type="button" className={cx(styles.button)}>
      {icon && <span className={cx(styles.icon)}>{icon}</span>}

      {children}
    </button>
  );
}
```

## Accessing The Theme

There are 3 ways to access the currently enabled theme in a component. The first is with the aptly
named `withTheme` HOC, which passes the theme object as a prop. The HOC supports the `pure` and
`themePropName` options.

```tsx
import React from 'react';
import withTheme, { WithThemeProps } from './withTheme';

export interface Props {
  children: NonNullable<React.ReactNode>;
}

function Component({ children, theme }: Props & WithThemeProps) {
  return <div style={{ padding: theme.unit }}>{children}</div>;
}

export default withTheme()(Component);
```

The second form of access is the `withStyles` HOC. When the `passThemeProp` option is enabled, the
current theme object is passed as a prop. The HOC supports the same options as `withTheme`.

```tsx
import React from 'react';
import withStyles, { WithStylesProps } from './withStyles';

export interface Props {
  children: NonNullable<React.ReactNode>;
}

function Component({ children, cx, styles, theme }: Props & WithStylesProps) {
  return <div className={cx(styles.wrapper, { padding: theme!.unit })}>{children}</div>;
}

export default withStyles(
  () => ({
    wrapper: {
      display: 'block',
    },
  }),
  {
    passThemeProp: true,
  },
)(Component);
```

> When using TypeScript, the `theme` property for `WithStylesProps` is marked as optional, since the
> functionality is opt-in. Using `!` is required here.

And lastly, the easiest form for accessing the theme is with the `useTheme` hook. This simply
returns the theme object.

```tsx
import React from 'react';
import useTheme from './useTheme';

export interface Props {
  children: NonNullable<React.ReactNode>;
}

export default function Component({ children }: Props) {
  const theme = useTheme();

  return <div style={{ padding: theme.unit }}>{children}</div>;
}
```

## RTL Direction Provider

React supports global [Right-to-Left](../rtl.md) out of the box, but also supports the ability to
provide a new direction for a target component tree using the `DirectionProvider`. The required
direction can be defined using the `dir` prop.

```tsx
import { DirectionProvider } from 'aesthetic-react';

<DirectionProvider dir="rtl">
  <Component />
</DirectionProvider>;
```

Furthermore, the direction can be detected automatically based on a string of text. This is
extremely useful for inputs and textareas, where the content should flip based on what's passed to
the `value` prop.

```tsx
class Search extends React.Component {
  state = {
    input: '',
  };

  handleChange = event => {
    this.setState({
      input: event.currentTarget.value,
    });
  };

  render() {
    const value = this.state.input;

    return (
      <DirectionProvider value={value}>
        <input type="search" value={value} onChange={this.handleChange} />
        <Component />
      </DirectionProvider>
    );
  }
}
```

## Using Refs

When using HOCs, the underlying wrapped component is abstracted away. Sometimes access to this
wrapped component is required, and as such, a specialized ref can be used. When using the
`wrappedRef` prop, the wrapped component instance is returned.

```tsx
let buttonInstance = null; // Button component

<StyledButton
  wrappedRef={ref => {
    buttonInstance = ref;
  }}
/>;
```