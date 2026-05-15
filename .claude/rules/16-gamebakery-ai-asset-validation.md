# GameBakery.ai Asset Validation

> **Purpose**: Validate assets (especially 3D) step by step to prevent credit waste and ensure quality.

## Core Principle: Bottom-Up Validation

Asset creation **does not go straight to completion in one shot**. Show results to the Director at each step, get confirmation, then proceed to the next step. Steps with high cost (3D conversion, rigging, animation) must not proceed without approval from the previous step.

## 3D Asset Validation Order

```
Image generation → [Confirm] → 3D conversion → [Preview+Confirm] → Rigging → [Preview+Confirm] → Animation → [Preview+Confirm]
   ~5 credits          ~10 credits          ~10 credits           ~10 credits/action
```

| Step | Credits | Validation Content | On Failure |
|------|--------|-----------|---------|
| 1. Image generation | ~5 | Confirm concept, pose, background | Modify prompt and regenerate |
| 2. 3D conversion | ~10 | Confirm shape via browser preview | Regenerate from image or change options |
| 3. Rigging | ~10 | Confirm skeleton via preview | Change rig type and retry |
| 4. Animation | ~10/action | Confirm motion via preview | Regenerate with the same rig |

## Checkpoint Rules

1. After each step, confirm with the Director using **multiple-choice questions** (Appendix 3)
2. Provide browser previews of 3D model/rigging/animation results via the **asset-preview skill**
3. Inform about **additional credit costs** before proceeding to the next step
4. If the Director explicitly says "do it all at once," batch processing is allowed (but final confirmation is mandatory)

## Image Validation Criteria

After image generation, confirm the following with the Director:

- **Concept match**: Does it match the requested character/object?
- **Pose suitability**: Is the pose suitable for 3D conversion? (T-pose/A-pose recommended)
- **Background handling**: Is the background transparent/white? (whether `--remove-bg` was used)
- **Limb separation**: Are the character's limbs clearly separated?

## 3D Model Validation Criteria

After 3D conversion, open a preview with the `asset-preview` skill and check:

- **Shape fidelity**: Does the 3D model resemble the original image?
- **Polygon count**: Check in the viewer info panel (recommended 8,000 or less for web)
- **Orientation**: Is the front facing the correct direction?
- **Texture**: Are the colors and textures natural?

## Rigging/Animation Validation Criteria

- **Skeleton structure**: Are the joints in the correct positions?
- **Motion naturalness**: Does the animation avoid unnatural bending?
- **Looping**: Does it transition smoothly when played on repeat?
