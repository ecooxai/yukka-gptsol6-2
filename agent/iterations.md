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

The first two test attempts exposed conflicting Chromium launcher flags. The native binary and cleaned graphics environment resolved them. The final WebGL scene has 164 meshes and 403,620 triangles excluding the contour layer; 900x1200 render, mobile display 368x491 at 390px viewport, no horizontal overflow. Native WebGPU initialization and capture succeeded.
