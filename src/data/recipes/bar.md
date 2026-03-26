---
title: Instant Ramen
tags: [main, quick, savory]
scale:
  ingredient: bowls
  base: 1
nodes:
  - id: A
    type: input
    label: "Boil [[500ml]] of water"
    icon: 🫕
    position:
      x: 50
      y: 0
  - id: B
    type: input
    label: "Combine sauce packets with [[1]] bowl of noodles"
    icon: 🍜
    position:
      x: 350
      y: 0
  - id: C
    type: default
    label: Pour water and steep
    icon: ⏱️
    position:
      x: 200
      y: 175
  - id: D
    type: output
    label: Serve and enjoy
    icon: 😋
    position:
      x: 200
      y: 350
edges:
  - id: eA-C
    source: A
    target: C
    type: smoothstep
    markerEnd:
      type: arrowclosed
  - id: eB-C
    source: B
    target: C
    type: smoothstep
    markerEnd:
      type: arrowclosed
  - id: eC-D
    source: C
    target: D
    type: smoothstep
    markerEnd:
      type: arrowclosed
---

## A

🫕 **Boil the water**

Measure out **[[500ml]]** of cold water and bring to a rolling boil in a kettle or small saucepan. A kettle is faster; a saucepan is better if you plan to add toppings directly to the pot.

⏱ ~4 minutes on high heat. You want a proper rolling boil, not just steaming.

## B

🍜 **Prepare the noodles and seasoning**

While the water heats, open [[1]] noodle package and place the dry noodle brick into your bowl.

Tear open all seasoning packets — usually [[1]] powder pack and [[1]] liquid oil or sauce pack — and pour them directly over the dry noodles. This helps the seasoning distribute evenly as soon as the water goes in.

> 💡 Taste before adding the full powder packet. They're often quite salty, and using 2/3 of the packet is a good starting point.

## C

⏱️ **Steep**

Pour the boiling water over the noodles until fully submerged. Cover the bowl with a plate or lid to trap the heat.

Wait **4 minutes**. Stir once halfway through to loosen the noodles from the brick.

**Optional add-ins:**
- 🥚 [[1]] soft-boiled egg (ramen egg: marinate overnight in soy sauce and mirin)
- 🧅 [[2]] stalks green onion, sliced
- 🧈 A small pat of butter for richness
- 🌶️ A drizzle of chili oil

## D

😋 **Serve**

Give it a final stir and taste for seasoning. Add a dash of soy sauce or a few drops of sesame oil if it needs more depth.

Eat immediately — the noodles keep absorbing water and will get mushy if left to sit!
