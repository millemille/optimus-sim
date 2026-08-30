# Optimus Sim

Fan-made browser sim. You walk a white-panel Optimus-style humanoid around a small workshop and move one crate onto a glowing yellow floor pad.

This is not a Tesla product. No official CAD, no Tesla wordmark on the robot. The body is built from three.js meshes so it reads like the Gen 2 showroom bot: matte white shells, black visor, dark joints, five-finger hands.

## Run it

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Click **Click to enter workshop** so the browser can lock the pointer.

Production build:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| W A S D | Walk |
| Shift | Walk faster |
| Mouse | Look (third person, behind the robot) |
| Arrow keys | Look without the mouse |
| E or left click | Pick up or place when the prompt shows |
| Esc | Release pointer lock / pause |

WASD is relative to the camera, not the robot's current facing.

## Mission

1. Spawn in the workshop as the robot.
2. Walk to the brown parts crate on the left workbench.
3. Press E (or click) when the prompt appears.
4. Carry it to the glowing yellow floor pad and place it.
5. After that you can keep walking.

No physics engine. Pickup is kinematic: the crate parents to a carry anchor on the torso, then snaps onto the bay.

## Stack

Vite, TypeScript, three.js r180. Static client only. No backend, no LLM on the play path.

Robot and room are procedural. Floor and wall maps are canvas noise, not photo textures.

Portrait stills (idle, studio lights, no HUD):

```
http://localhost:5173/?studio=front
http://localhost:5173/?studio=q
http://localhost:5173/?studio=side
```
