Centered modal — flat 40%-opacity ink scrim (no blur), fade+slide-up entrance. Use for confirmations (End game?) and setup steps.

```jsx
<Dialog open={open} title="End game?" onClose={close} footer={<>
  <Button variant="ghost" onClick={close}>Cancel</Button>
  <Button variant="primary" onClick={confirm}>End game</Button>
</>}>
  This will save final scores and can't be undone.
</Dialog>
```
