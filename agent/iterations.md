# Iterations — actual visual review

Scores are subjective and are not a measured or independently verified AAA score.

| Iteration | Score | Visual changes | Build / test |
|---|---:|---|---|
| 01 | 65/100 | Initial complete posed sculpture, original hair, halo, garments, slippers and pillow. First visual review reduced the preliminary estimate of 72. | Build 0.786 s; first graphics test failed after 63.887 s; Intel EGL six-view capture and GLB succeeded, then mobile navigation failed at 6.611 s. |
| 02 | 76/100 | Hair taper, smaller nose, eyelids, pillow grip, cleaner shorts, less intrusive shadow and framing. | Build 0.753 s; six-view/GLB/mobile test 7.225 s; mobile overflow detected. |
| 03 | 80/100 | Cel-shaded contours, subdivided fabric patches, new eye shading, fine strands, ruffle cuffs and mobile overflow fix. | Build 0.919 s; six views rendered. |
| 04 | 83/100 | Improved proportions and pose, pillow deformation, slippers, hair highlights, shading selector and reduced mesh tessellation. | Build 2.820 s; WebGL test 7.600 s, zero errors. |
| 05 | 84/100 | Softer skin gradient, padded headband, finer hand and costume proportions, mobile branding fix. | Build 2.018 s; WebGL test 6.867 s; native WebGPU test 3.860 s; zero browser errors. |
| 06 | 83/100 | Improved silhouette and larger pillow, but visual regression due to pillow/calf intersection. | WebGL initialization 4.462 s; all views and export verified; zero browser errors. |
| 07 | 85/100 | Repositioned pillow behind leg, better grip and folds; preserved longer cuff and more accurate lifted foot. | Build 4.879 s; WebGL initialization 1.563 s; WebGPU initialization 2.231 s; zero browser errors. |
| 08 | 86/100 | Reference proportions and asymmetry | WebGL init 1.794s; 403,620 triangles; 0 browser errors. |
| 09 | 87/100 | Closed volumetric fringe and bow | WebGL init 1.647s; 400,652 triangles; 0 browser errors. |
| 10 | 88/100 | Skin pigment and analytic irises | WebGL init 1.958s; 410,864 triangles; 0 browser errors. |
| 11 | 89/100 | Continuous sculpted arms and hands | WebGL init 2.500s; 733,680 triangles; 0 browser errors. |
| 12 | 90/100 | Indexed hands and sewn shorts | WebGL init 2.108s; 496,292 triangles; 0 browser errors. |
| 13 | 90/100 | Collar, pocket and cloth UVs | WebGL init 2.178s; 505,892 triangles; 0 browser errors. |
| 14 | 89/100 | Accessory shape regression | WebGL init 2.489s; 549,504 triangles; 0 browser errors. |
| 15 | 91/100 | Corrected slippers and halo | WebGL init 4.027s; 564,144 triangles; 0 browser errors. |
| 16 | 91/100 | Wraparound collar and cuffs | WebGL init 2.279s; 568,808 triangles; 0 browser errors. |
| 17 | 92/100 | Hair reflection and eyelash shape | WebGL init 2.217s; 569,640 triangles; 0 browser errors. |
| 18 | 92/100 | Reference pose and grip | WebGL init 2.313s; 568,716 triangles; 0 browser errors. |
| 19 | 93/100 | 55-joint skeletal character | WebGL init 2.731s; 568,716 triangles; 0 browser errors. |
| 20 | 94/100 | Cel shadow shapes and pillow drape | WebGL init 2.784s; 576,354 triangles; 0 browser errors. |
| 21 | 94/100 | Forehead opening and lapels | WebGL init 2.744s; 581,970 triangles; 0 browser errors. |
| 22 | 94/100 | Mesh batching comparison | WebGL init 3.222s; 581,970 triangles; 0 browser errors. |
| 23 | 94/100 | Optimized geometry and quality profiles | WebGL init 2.922s; 523,218 triangles; 0 browser errors. |
| 24 | 94/100 | Eyes and accessory experiment | WebGL init 2.509s; 530,714 triangles; 0 browser errors. |
| 25 | 94/100 | Corrected knot, bow and placket | WebGL init 2.551s; 537,914 triangles; 0 browser errors. |
| 26 | 95/100 | Blink morphs and GLB animation | WebGL init 2.909s; 537,914 triangles; 0 browser errors. |
| 27 | 95/100 | Seam-connected cuffs and plush details | WebGL init 2.921s; 585,206 triangles; 0 browser errors. |

Iteration 22: batching reduced draw calls but worsened initialization and frame rate on Ruby; it remains optional. Iteration 26 initial numeric morph-target export failed; named Blink binding fixed both WebGL and WebGPU export. Both backend rig tests verified 55 joints, 20 facial morph meshes, 30 animation channels, zero invalid weights and zero browser errors. Scores are subjective visual/engineering judgments, not independent AAA certification.
