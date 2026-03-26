---
title: Avocado Toast
tags: [vegetarian, breakfast, quick]
scale:
  ingredient: servings
  base: 1
nodes:
  - id: "1"
    type: input
    label: Toast the bread
    icon: 🍞
    position:
      x: 250
      y: 0
  - id: "2"
    type: default
    label: Mash and season the avocado
    icon: 🥑
    position:
      x: 250
      y: 150
  - id: "3"
    type: output
    label: Assemble and serve
    icon: 🍽️
    position:
      x: 250
      y: 300
edges:
  - id: e1-2
    source: "1"
    target: "2"
    type: smoothstep
    markerEnd:
      type: arrowclosed
  - id: e2-3
    source: "2"
    target: "3"
    type: smoothstep
    markerEnd:
      type: arrowclosed
---

## 1

🍞 **Toast the bread**

Use [[1]] thick slice of sourdough or multigrain — something sturdy enough to hold its shape under the toppings. Toast until deep golden and firm.

**Tips:**
- A toaster oven gives more even browning than a pop-up toaster
- For extra flavour, rub the warm toast with [[1]] halved garlic clove while it's still hot

## 2

🥑 **Mash and season the avocado**

Halve [[1]] ripe avocado, remove the pit, and scoop the flesh into a bowl. Mash with a fork to your preferred texture — chunky or smooth both work.

Season well:
- Juice of [[0.5]] lemon or lime (prevents browning and brightens the flavour)
- Flaky sea salt and cracked black pepper
- Optional: a pinch of red pepper flakes or everything bagel seasoning

> 💡 The avocado is ripe when the skin is dark and it gives slightly under gentle thumb pressure.

## 3

🍽️ **Assemble and serve**

Spread the mashed avocado generously onto [[1]] slice of toast. Add toppings to taste:

| Style | Toppings |
|---|---|
| **Classic** | Halved cherry tomatoes, microgreens, flaky salt |
| **Protein** | [[1]] poached or fried egg on top |
| **Fancy** | [[50g]] smoked salmon, capers, thin-sliced red onion |

Serve immediately — the toast softens quickly once topped.
