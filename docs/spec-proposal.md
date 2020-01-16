# History & Present

Aesthetic was built around the time that CSS-in-JS solutions were rising in popularity. It was
designed to bridge the gap between current CSS-in-JS libraries and React components, and was not
meant to be yet another CSS-in-JS library. As such, Aesthetic offers the adapter pattern where
CSS-in-JS libraries are plug-and-play, while not handling the CSS itself.

Besides the above mentioned, Aesthetic aimed to solve the following problems that plagued libraries
and applications.

1. CSS-in-JS libraries require different syntax for defining styles. This could be problematic when
   switching libraries (for performance or other reasons), as the syntax differs, and would require
   a potential massive migration (and ejection if a failure). To mitigate this, Aesthetic implements
   a ["unified syntax"](https://milesj.gitbook.io/aesthetic/unified), where the same syntax works
   for all adapters.
2. The other issue that a unified syntax solves is third-party library adoption. If library A styles
   their components with Aphrodite, and library B styles theirs with Fela, then we have 2 differing
   and conflicting libraries. This would increase bundle size, reduce interoperability, and more. If
   both A and B libraries were instead written in Aesthetic, then the underlying adapter (Aphrodite
   or Fela) can be swapped out without breaking compatibility or increasing bundle sizes.

## Outstanding issues

For the most part, Aesthetic works and serves its purpose pretty well. However, it's not perfect,
and could use a rewrite to solve the following issues.

### Themes are too dynamic

There is no set structure for theme objects, and as such, they cannot be typed safely, nor can they
be trusted when interoping with third-party libraries. For example:

```ts
// Registered in an application
aesthetic.registerTheme('app-light', {
  colors: {
    white: '#fff',
  },
  unit: 8,
});

// Registered in a library
aesthetic.registerTheme('3rd-party-dark', {
  color: {
    black: ['#000'],
  },
  spacing: 4,
});
```

In the above example, an application and a third-party library may register a theme, completely
independent of each other, with differing structures (`unit` vs `spacing`, etc). When used in
parallel, components will break when themes change, as the following styles would only work under
one theme, not both.

```ts
useStyles(theme => ({
  padding: theme.unit * 2,
}));
```

This actually breaks interoperability and the 2nd adoption problem above. This was a massive
oversight on my end when designing the theme layer.

### Global styles are complicated

Global styles are primarily applied to `html`, `body`, and `a`, for global inheritance of colors,
spacing, and font sizing. This works flawlessly until one of the following occurs:

- Rendering parallel themes using the React `ThemeProvider` component. When this happens, the global
  styles in the next theme to compile will overwrite the previous theme. _I'm not sure there's a way
  to solve this correctly._
- Dynamically change themes for the entire page, usually through a toggle switch or dropdown. When
  this happens, we can easily purge/delete all existing styles in the document. However, in
  practice, this is only true if the CSS-in-JS adapter that is currently configured supports it,
  _which most do not_ (will require upstream patches).

### Component styles are hard to customize

Take the following style sheet for a `Button`, where it has a primary background with a 1px border
(dark blue), and a base text color (white). Seems straight forward right?

```ts
useStyles(({ color }) => ({
  button: {
    border: `1px solid ${color.primary[4]}`,
    backgroundColor: color.primary[3],
    color: color.base,
  },
}));
```

Not really. It's actually very restrictive, isolating, and hard to customize. The above works well
for the theme it was initially designed for, in this instance, a "light" theme. But what happens
when we change it to a dark theme?

1. First, the indices are reversed, so `0` is darkest and `10` is lightest. Depending on the
   component, this will look great, or it will look terrible, and there's _no way to change it based
   on theme_, since the CSS/syntax is hard-coded in the component.
2. The `base` color may change from white to black in the dark theme, so now we run into
   accessibility concerns. Is black text viable on a colored button? Usually not. This is similar to
   the issue previously mentioned, where we can't change the `color` property on a theme-by-theme
   basis.
3. What if the dark theme wants 2px borders? Or no borders? Or rounded corners? Again, we have no
   way of handling that.
4. So on and so forth.

# Future

I would love to resolve all the issues mentioned previously, most of which are easily solved with a
type-safe and structure-safe theme layer. However, while brainstorming the possibilities, I thought
to myself, "Why not take a step back and expand the scope of the project?". What does this mean
exactly? Well, in the current state of the web development world, companies are pushing hard and
forward with design systems, such as: Airbnb Lunar/DLS, Google Material, GitHub Primer, SalesForce
Lightning, Mozilla Photon, Shopify Polaris, IBM Carbon, so on and so forth.

Every company is building their design system from scratch, with different technologies, duplicated
across many platforms. What if there was a technological solution to this problem? This is where
Aesthetic comes in. What if Aesthetic was re-purposed to be a "design system framework", where a
design system's fundamentals are configured (fonts, spacing, borders, shadows, breakpoints,
interactions, etc), are compiled to multiple target platforms or technologies (CSS, Sass, Less,
JS/TS, iOS, Android, React Native, etc), and is ultimately robust and easy enough to be used by any
company.

## Defining a design system

> This solves the "Themes are too dynamic" outstanding issue.

I've been researching existing design systems for commonalities
([Google doc](https://docs.google.com/spreadsheets/d/1HKLjRlvPkSRDRTvc5MB-A1_zl8YzxjzQeuABbg-jefU/edit#gid=0)),
as a means to build a foundation for this framework. After a bit of research, and minor technical
prototyping, I believe the initial step forward would be to use YAML for configuring a design
system.

- It's cross platform and will work on Windows, OSX, and Linux machines.
- It's not tied to any specific language (JS (Web), Java (Android), Swift (iOS)).
- Can be easily modified by designers and non-engineering folk.

Futhermore, the framework will adhere to the following fundamentals.

- [Modular scale](https://alistapart.com/article/more-meaningful-typography/) will be used for all
  scaling based algorithms. Can be configured per setting, with name or integer based values.
- Colors may be unique per design system but is inaccessible to consumers (avoids backwards
  incompatibility). Consumers will need to use palettes, which are pre-defined colors + states for
  common UI elements, and mixins, which are collections of theme specific CSS properties.
- Multiple design systems can be used in parallel (e.g., version 2019 vs version 2020). This is
  possible since the "theme template" for the consumer will be identical regardless of design system
  and theme parameters.

An example of that YAML file is as follows, with descriptive comments.

```yaml
# Whether the design system focuses on mobile or desktop first.
# This setting will control various features, like breakpoints.
# Accepts "mobile-first" or "desktop-first".
strategy: mobile-first

# List of 5 breakpoints for responsive and adaptive support. If not provided,
# will default to the following 5 values.
breakpoints:
  - 640
  - 960
  - 1280
  - 1600
  - 1920

# Spacing related settings.
spacing:
  # The algorithm used for spacing and page density calculations. Accepts the following:
  #   vertical-rhythm - Calculates font size + line height for em/rem spacing.
  #   unit - Uses an explicit pixel unit value for spacing.
  type: vertical-rhythm

  # Explicit spacing unit (in pixels).
  unit: 8

# Text and font related settings.
typography:
  # Font family for the entire system. If not provided, defaults to the OS font.
  font: 'Roboto'

  # Body text settings.
  text:
    # Root text size (in pixels). Is the basis for all spacing calculations.
    size: 16

    # Factor to increase (large) and decrease (small) body text each level.
    sizeScale: 1.25

    # Unitless line height. Can be calculated by dividing the
    # desired line height (30px) by the font size (20px): 30 / 20 = 1.5.
    # Unitless is preferred for accessibility, scaling, and maintaining the correct ratio.
    lineHeight: 1.25

    # Factor to increase (large) and decrease (small) text line height each level.
    lineHeightScale: 0

  # Title heading settings.
  heading:
    # Same settings as text above.

  # Factor to increase (mobile-first) or decrease (desktop-first) root text size each breakpoint.
  responsiveScale: 1.1

# Border related settings.
borders:
  # Rounded corner radius (in pixels).
  radius: 3

  # Factor to increase radius each size.
  radiusScale: 1

  # Width of the border.
  width: 1

  # Factor to increase width each size.
  widthScale: 1

# Shadow and depth related settings.
# Accepts an object (below) or an array of objects, where each object in
# the array will apply multiple borders.
shadows:
  # Vertical Y offset (in pixels).
  y: 2

  # Factor to increase Y each size.
  yScale: 1

  # Horizontal X offset (in pixels).
  x: 0

  # Factor to modify X each size.
  xScale: 0

  # Blur radius (in pixels).
  blur: 2

  # Factor to increase blur each size.
  blurScale: 1.25

  # Spread radius (in pixels).
  spread: 0

  # Factor to increase spread each size.
  spreadScale: 0

# List of all color names that each theme must implement.
colors:
  - red
  - blue
  - green
  - ...

# Mapping of themes and their colors.
themes:
  # A light theme with a custom name.
  day:
    # Base color scheme for this theme. Accepts "light" or "dark".
    # Used in `prefers-color-scheme` browser detection.
    # https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
    scheme: light

    # Whether this is a special contrast target. Accepts "normal", "high", or "low".
    # Used in `prefers-contrast` browser detection.
    # https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
    contrast: normal

    # Mapping of all colors in the theme, with a range of 10 hexcodes per color,
    # with 400 being the base default color, and the bounds going from light to dark,
    # or dark to light if scheme is "dark".
    colors:
      red:
        00: '#FE8484' # Lightest
        10: '#FE8484'
        20: '#FE8484'
        30: '#FE8484'
        40: '#FE8484' # Base
        50: '#FE8484'
        60: '#FE8484'
        70: '#FE8484'
        80: '#FE8484'
        90: '#FE8484' # Darkest
      # Colors can also be a single hexcode
      black: '#000'

    # Mapping of pre-defined palettes to colors and their shades (from above).
    # Supports background and foreground targets, with multiple state variants.
    # Consumers will reference these values, instead of colors directly.
    palettes:
      # Priority (properties in order of specificity)
      primary:
        bg:
          base: purple.40
          focused: purple.50
          selected: purple.50
          hovered: purple.60
          disabled: gray.40
        fg:
          # ...
      secondary: # ...
      tertiary: # ...
      neutral: # ...
      # States
      muted: # ...
      danger: # ...
      warning: # ...
      success: # ...
      info: # ...

  # A dark theme with a custom name.
  night:
    # Extends another defined theme.
    extends: foo
    scheme: dark
    colors:
      red:
        00: '#FE8484' # Darkest
        10: '#FE8484'
        20: '#FE8484'
        30: '#FE8484'
        40: '#FE8484' # Base
        50: '#FE8484'
        60: '#FE8484'
        70: '#FE8484'
        80: '#FE8484'
        90: '#FE8484' # Lightest
```

### Build targets and output

When the YAML configuration above is processed and compiled, it will generate the following
foundation, with an explicit API changing based on platform target.

- 5 breakpoint media queries, either using `min-width` (mobile-first) or `max-width`
  (desktop-first).
- 5 spacing targets, `xs` (0.25x), `sm` (0.5x), `base` (1x), `md` (2x), `lg` (3x), and `xl` (4x).
  - When `spacing.type` is "vertical-rhythm", these values would use `rem`, while "unit" would use
    `px`.
  - The spacing target can also be executed as a function, where it accepts an arbitrary number to
    produce a spacing unit: `theme.spacing(6) -> 48px`.
- 3 body text levels, `sm` (-1s), `base` (1x), and `lg` (+1s).
  - Root/base font size is based on `typography.fontSize`, where small is `-1` and large is `+1`
    according to `typography.text.sizeScale`.
  - All 3 levels either increase or decrease within each breakpoint, according to
    `typography.text.responsiveScale`.
- 6 heading text levels, `h1`-`h6`, where the font size increases each level according to
  `typography.heading.sizeScale`.
  - All 6 levels either increase or decrease within each breakpoint, according to
    `typography.heading.responsiveScale`.
- 3 border levels, `sm`, `base`, and `lg`.
  - The border width and radius increases each level according to `border.*` settings.
- 5 shadow levels.
  - The shadow depth, blur, and spread increases each level according to `shadow.*` settings.
  - If an array of settings are passed, they will be joined into a single `box-shadow` declaration.
- An object of all the palettes and their colors.
- All the hard-coded mixins below. A mixin is a collection of CSS properties that can be spread into
  style sheets, configured to the current theme. etc.
  - `border` - The normal border level.
  - `borderLarge` - The large border level.
  - `borderSmall` - The small border level.
  - `box` - Common block element that powers most layout. Includes background, borders, shadows,
  - `boxLarge` - Large version of box.
  - `boxSmall` - Small version of box.
  - `heading1` - The `h1` text heading level.
  - `heading2` - The `h2` text heading level.
  - `heading3` - The `h3` text heading level.
  - `heading4` - The `h4` text heading level.
  - `heading5` - The `h5` text heading level.
  - `heading6` - The `h6` text heading level.
  - `hidden` - Hide an element.
  - `hiddenOffscreen` - Hide an element outside the viewport (useful for a11y).
  - `input` - A form input field.
  - `inputDisabled` - A disabled form input field.
  - `inputFocused` - A focused form input field.
  - `inputInvalid` - An invalid form input field.
  - `resetButton` - Reset a `button` element to simple defaults.
  - `resetList` - Reset an `ul` or `ol` element to simple defaults.
  - `resetText` - Reset font and text settings to simple defaults.
  - `root` - Root and global styles defined on `*`.
  - `rootBody` - Layout and spacing settings defined on the `body`.
  - `rootHtml` - Text and font settings defined at the root `html`.
  - `shadowSmallest` - The smallest shadow size.
  - `shadowSmall` - The small shadow size.
  - `shadowMedium` - The medium shadow size.
  - `shadowLarge` - The large shadow size.
  - `shadowLargest` - The largest shadow size.
  - `stateDisabled` - General state when an element is `disabled`.
  - `stateFocused` - General state when an element is `focused`.
  - `stateSelected` - General state when an element is `selected` (or `active`).
  - `text` - The normal text level.
  - `textLarge` - The large text level.
  - `textSmall` - The small text level.

Furthermore, the design system will embrace the following:

- `em`s and `rem`s for all font sizing.
- Accessible colors and font sizes (AAA, AA Large, etc).
- Responsive and adaptive aware by default.
- `prefers-color-scheme` for automatic theme selection.
- `prefers-contrast` for low/high contrast theme targeting.

#### Web - CSS, CSS Modules

When the build target is standard CSS, it will generate CSS variables (tokens) and re-usable classes
(mixins). It would look something like the following.

```css
/* system.css */
:root {
  --spacing-compact: 0.25rem;
  --spacing-tight: 0.5rem;
  --spacing-normal: 1rem;
  --spacing-loose: 2rem;
  --spacing-spacious: 3rem;
  --text-size-small: 0.85rem;
  --text-size-normal: 1rem;
  --text-size-large: 1.15rem;
  /* ... */
}

/* theme/day.css */
.theme-light {
  --primary-bg-focused: #fe8484;
  --secondary-fg-base: #000;
  /* ... */
}

/* mixins.css */
.heading-1 {
  font-family: var(--font-family);
  font-size: var(--heading-size-1);
  line-height: 1.5;
}

.input {
  background: var(--neutral-bg-base);
  border: 1px solid var(--primary-bg-base);
}

.input:hover {
  border-color: var(--primary-bg-hovered);
}

/* ... */
```

#### Web - SCSS

When the build target is [SCSS](https://sass-lang.com), it will generate SCSS variables (tokens) and
mixins. It would look something like the following.

```scss
// system.scss
$spacing-compact: 0.25rem;
$spacing-tight: 0.5rem;
$spacing-normal: 1rem;
$spacing-loose: 2rem;
$spacing-spacious: 3rem;
$text-size-small: 0.85rem;
$text-size-normal: 1rem;
$text-size-large: 1.15rem;
// ...

// theme/day.scss
$primary-bg-focused: #fe8484;
$secondary-fg-base: #000;
// ...

// mixins.scss
@mixin heading-1 {
  font-family: $font-family;
  font-size: $heading-size-1;
  line-height: 1.5;
}

@mixin input {
  background: $neutral-bg-base;
  border: 1px solid $primary-bg-base;

  &:hover {
    border-color: $primary-bg-hovered;
  }
}
```

#### Web - Less

When the build target is [Less](http://lesscss.org/), it will generate Less variables (tokens) and
mixins. It would look something like the following.

```less
// system.less
@spacing-compact: 0.25rem;
@spacing-tight: 0.5rem;
@spacing-normal: 1rem;
@spacing-loose: 2rem;
@spacing-spacious: 3rem;
@text-size-small: 0.85rem;
@text-size-normal: 1rem;
@text-size-large: 1.15rem;
// ...

// theme/day.less
@primary-bg-focused: #fe8484;
@secondary-fg-base: #000;
// ...

// mixins.less
.mixin-heading-1 {
  font-family: @font-family;
  font-size: @heading-size-1;
  line-height: 1.5;
}

.mixin-input {
  background: @neutral-bg-base;
  border: 1px solid @primary-bg-base;

  &:hover {
    border-color: @primary-bg-hovered;
  }
}
```

#### Web - CSS-in-JS, JavaScript, TypeScript

When the build target is JS/TS, it will instantiate system and theme classes, generate token and
mixin theme templates (plain objects), all of which would be used in the official
[Aesthetic](https://github.com/milesj/aesthetic) CSS-in-JS library. It would look something like the
following (API in flux).

```ts
// design.ts
const design = new Design({
  // ... variables from the YAML config
});

// theme/day.ts
const theme = design.createTheme({
  scheme: 'light',
  // ... variables also
});

// App.ts
aesthetic.registerTheme(theme);

// Component.ts
useStyles((token, mixin) => ({
  input: {
    ...mixin.box,
    ...mixin.input,
    fontFamily: token.typography.fontFamily,
    fontSize: token.text.base,
  },
}));
```

#### iOS - Swift

Must research, to be determined. Can possibly be solved with
[custom styling structs](https://theswiftdev.com/2019/02/19/styling-by-subclassing/).

#### Android - Java

Must research, to be determined. Can possibly be solved with the
[built-in XML styling](https://developer.android.com/guide/topics/ui/look-and-feel/themes).

## Feature implementations

### Style sheets

> This solves the "Component styles are hard to customize" outstanding issue.

When using CSS-in-JS, style sheet properties are typically hard-coded and isolated,
[as described here](#component-styles-are-hard-to-customize). This makes it quite difficult to
override for other themes.

To overcome this obstacle, I will be introducing a new API, `Aesthetic#createStyleSheet()`, which
will instantiate a new `StyleSheet` instance that should be passed to `useStyles()`, `withStyles()`,
or another framework agnostic implementation. The ergonomics are very similar to the previous API.

```ts
// Before
useStyles(({ color }) => ({
  button: {
    border: `1px solid ${color.primary[4]}`,
    backgroundColor: color.primary[3],
    color: color.base,
  },
}));

// After
const styleSheet = createStyleSheet(({ palette }) => ({
  button: {
    border: `1px solid ${palette.primary.bg.base}`,
    backgroundColor: palette.primary.bg.base,
    color: palette.neutral.fg.base,
  },
}));

useStyles(styleSheet);
```

With style sheets being an instance of `StyleSheet`, we have far more control than before.

- Can accept configurable options.
- Consumers can modify properties if need be (when extendable).
- Color scheme and theme variants.
- Class methods for additional functionality.
- Better interoperability between consumers, developers, and systems.
- Better referencial equality.

### Global styles

> This solves the "Global styles are complicated" outstanding issue.

[Global styles are complicated](#global-styles-are-complicated), so moving forward we will avoid
them entirely. Instead, we will nest all tag based styles (`a`, `div`, `p`, etc) within a theme
class name, like `theme-foo`, which will be applied to the `body` tag (`<body class="theme-foo">`).

For example, this:

```css
:root {
  --token: 'foo';
}

body {
  font-size: 12px;
  /* ... */
}

a {
  /* ... */
}
```

Will become this:

```css
.theme-foo {
  --token: 'foo';

  font-size: 12px;
  /* ... */
}

.theme-foo a {
  /* ... */
}
```

Any CSS resets or styles that should be applied to the root `html` tag should be done outside of
Aesthetic, primarily in a shared CSS file that is theme agnostic, and not part of the design system.

Furthermore, this approach enables nested themes, through something like React's `ThemeProvider`, as
this would render a div with the unique class name (`<div class="theme-foo">`). And since "global
styles" are now nested within the theme class name, it reduces direct collisions. However, it
doesn't avoid collisions entirely, as the top level `body` theme may define styles that the nested
theme does not override, so themes should define the bare minimum global styles.

And lastly, dynamically changing themes is as easy as swapping out the `body` class name, as CSS
variables would be scoped to the theme, and CSS-in-JS solutions would inject styles on demand.

Guidelines:

- CSS resets, root `*` styles, and `html` styles should be handled outside of the design system.
- Global styles must be scoped within a theme class name that will be applied to the body
  `<body class="theme-foo>`.
- No styles should be defined for `body` directly.

### Directionality (RTL)

For the most part, directionality in CSS automatically happens based on the `dir` HTML attribute, or
the CSS `direction` property. When either of these are set to `rtl`, all children text and flow
content will be reversed. However, for properties that are hard-coded to the left or right
(`margin-left` vs `margin-right`), additional code will need to be implemented to handle this.

Guidelines:

- Direction attribute `dir` will be set on the root `html`, and any block that contains nested
  directional changes.

#### CSS

For standard CSS, additional declarations will need to be defined to handle layout reversing, using
a parent `[dir='rtl']` selector (should work for nested direction changes caused by a parent). If
using Less or Sass, the RTL variant can be handled through mixins, like `.mixin-rtl` or `@mixin rtl`
respectively.

```css
.box {
  border-left: 1px solid black;
  margin-left: 10px;
}

[dir='rtl'] .box {
  border-left: 0;
  border-right: 1px solid black;
  margin-left: 0;
  margin-right: 10px;
}
```

In the future (once IE and Edge catch up), the new
[logical properties and values](https://drafts.csswg.org/css-logical/#propdef-margin-inline-end) can
be used, which would streamline this entire process. The above code would now become:

```css
.box {
  border-inline-start: 1px solid black;
  margin-inline-start: 10px;
}
```

This is possible since the nomenclature of `left` and `right` does not exist anymore. Instead we
have `start` and `end`, which change depending on the direction and orientation.

#### CSS-in-JS

For the most part, all CSS-in-JS solutions should be using
[rtl-css-js](https://github.com/kentcdodds/rtl-css-js), which renames `left` to `right`, and vice
versa. Direction changes would trigger a re-compilation of all styles to support the new RTL
properties.

#### Native

TODO

### Color scheme variants

Color schemes allow end users to define whether they prefer light or dark themes, and the ability
for developers to query this and act accordingly. This functionality is based on the official
[media query specification](https://drafts.csswg.org/mediaqueries-5/#descdef-media-prefers-color-scheme).

In Aesthetic, color schemes are first class in the design system, as each theme configured in the
YAML must define a `scheme` setting, which accepts "light" or "dark". Depending on the compilation
target, different implementations are required.

#### CSS

For CSS and its compilation variants (Sass, Less, etc), each theme should be linked in the document
using a media query, like the following.

```html
<link href="themes/day.css" rel="stylesheet" media="screen and (prefers-color-scheme: light)" />
<link href="themes/night.css" rel="stylesheet" media="screen and (prefers-color-scheme: dark)" />
```

For inline or one-off overrides, the `@media` block can be used.

```css
.button {
  background-color: var(--primary-bg-base);
}

@media screen and (prefers-color-scheme: dark) {
  .button {
    background-color: var(--secondary-bg-base);
  }
}
```

#### CSS-in-JS

When using the Aesthetic CSS-in-JS solution, it will automatically detect and apply the appropriate
color scheme theme (inferred from `prefers-color-scheme`), compile and inject "global styles" into
the document, set the `body` theme class name, and more.

Furthermore, with the new `StyleSheet` API, we have far more control than before. With this new API,
we can define color scheme variants with `StyleSheet#addColorSchemeVariant()`. This allows us to
change properties based on either the "light" or "dark" color schemes being currently active. For
example...

```ts
const styleSheet = createStyleSheet(({ palette }) => ({
  button: {
    border: `1px solid ${palette.primary.bg.base}`,
    backgroundColor: palette.primary.bg.base,
    color: palette.neutral.fg.base,
  },
})).addColorSchemeVariant('dark', ({ palette }) => ({
  button: {
    borderColor: palette.secondary.bg.base,
    backgroundColor: palette.secondary.bg.base,
  },
}));
```

#### Native

TODO

### Theme variants

Like color scheme variants, theme variants permit a granular level of control on a theme by theme
basis.

#### CSS

Depending on the component or how the styles are defined, adding theme variants can either be easy
or tricky. Assuming a theme class has been set on the `body`, we can nest our theme specific styles
in that class name.

```css
.button {
  border-color: 1px solid var(--palette-primary-bg-base);
}

.theme-fire .button {
  border-color: var(--palette-danger-bg-base);
}
```

#### CSS-in-JS

When using the new `StyleSheet#addThemeVariant()` API, variant styles will only apply when a theme
is active by their unique name.

```ts
const styleSheet = createStyleSheet(({ palette }) => ({
  button: {
    border: `1px solid ${palette.primary.bg.base}`,
    backgroundColor: palette.primary.bg.base,
    color: palette.neutral.fg.base,
  },
})).addThemeVariant('fire', ({ palette }) => ({
  button: {
    borderColor: palette.danger.bg.base,
  },
}));
```

#### Native

TODO

### Low/high contrast

Like color schemes, theres a new
[media query specification](https://drafts.csswg.org/mediaqueries-5/#prefers-contrast) for contrast
levels, where a user can prefer low or high contrast colors. Also like color schemes, contrast is
first class in the design system, as they are coupled to themes through the `contrast` setting,
which accepts "high", "low", or "normal" (the default).

In the Aesthetic world, to properly support low or high contrast colors, they must be their own
theme with custom colors, preferrably by extending a base theme.

```yaml
themes:
  # Base night theme for normal contrast
  night:
    scheme: dark
    colors:
      # ...
  # High contrast variant of base night theme
  nightHighContrast:
    extends: night
    contrast: high
    colors:
      # Higher contrast colors defined here
```

#### CSS

Contrast based themes can be enabled just like color schemes, by using a media query when linking.

```html
<link href="themes/day.css" rel="stylesheet" media="screen and (prefers-color-scheme: light)" />
<link
  href="themes/day-low-contrast.css"
  rel="stylesheet"
  media="screen and (prefers-color-scheme: light) and (prefers-contrast: low)"
/>
```

For inline or one-off overrides, the `@media` block can be used. We suggest _against this approach_,
as colors would then be hard-coded in CSS, and not provided by the theme or CSS variables.

```css
.button {
  background-color: var(--primary-bg-base);
}

@media screen and (prefers-contrast: high) {
  .button {
    background-color: var(--secondary-bg-base);
  }
}
```

#### CSS-in-JS

When using the new `StyleSheet#addContrastVariant()` API, variant styles will only apply when the
browser or device request a different contrast level. For the most part, this API should not be
used, as contrast themes are preferred.

```ts
const styleSheet = createStyleSheet(({ palette }) => ({
  button: {
    border: `1px solid ${palette.primary.bg.base}`,
    backgroundColor: palette.primary.bg.base,
    color: palette.neutral.fg.base,
  },
})).addContrastVariant('high', ({ palette }) => ({
  button: {
    borderColor: lighten(palette.primary.bg.base),
  },
}));
```

### Motion

TODO

## Future roadmap

- Add transparency support for `prefers-reduced-transparency`?
- Add rudimentary motion support.
  - Transition scaling?
  - `prefers-reduced-motion`?

# References

- https://medium.com/eightshapes-llc/typography-in-design-systems-6ed771432f1e
- [modular-scale](https://zellwk.com/blog/responsive-modular-scale/)
- [type-scale](https://type-scale.com/)