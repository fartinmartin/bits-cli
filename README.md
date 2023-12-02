# `bits-cli`

I generally prefer CSS over Tailwind and don't want to look up a `bit`'s structure or its `data-` attributes in the [the docs](https://bits-ui.com/).

Maybe folks who opt for `bits-ui` over `shadcn-svelte` or `melt-ui` feel the same?

So, here's a rough CLI to dump structured `bits-ui` `.svelte` files into your app's `lib` folder.

I like the idea of eventually including some of the "structural" CSS from the `bits-ui` [demo CSS](https://github.com/huntabyte/bits-ui/tree/main/src/components/demos) (e.g. converting the necessary Tailwind classes to CSS). And/or establishing CSS variables in the root class to use within the rest of the component's CSS.
