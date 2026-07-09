Flat cream surface, 24px radius, soft shadow — base container for game tiles, player rows, and summary panels.

```jsx
<Card interactive onClick={openGame}>
  <div>Wingspan</div>
</Card>
```

`interactive` adds hover lift (-2px translate + deeper shadow) for tappable cards.
