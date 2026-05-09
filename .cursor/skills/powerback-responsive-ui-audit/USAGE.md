# POWERBACK Responsive UI Audit Skill

## What this is

This Skill tells Cursor how to audit POWERBACK for responsive layout problems.

It is for:

- mobile layout bugs
- horizontal overflow
- clipped content
- bad modal sizing
- sidenav/tour overlap
- carousel responsiveness
- large-screen weirdness

## How to use it

In Cursor Agent, say:

Use the POWERBACK responsive UI audit skill. Run AUDIT MODE only. Do not edit files.

## When I want fixes

Say:

Use the POWERBACK responsive UI audit skill. Run PATCH MODE. Fix only the top confirmed issue.

## Important

AUDIT MODE = find problems only  
PATCH MODE = edit files

Start with AUDIT MODE unless I am absolutely sure I want code changes.

## Overflow diagnostics

When checking a responsive layout, use this browser-console check:

```js
document.documentElement.scrollWidth > window.innerWidth;
```

If this returns true, the page has horizontal overflow.

Then inspect likely offending elements:

```js
[...document.querySelectorAll('*')]
  .filter((el) => el.scrollWidth > el.clientWidth)
  .slice(0, 20);
```
