# Dependency security review

Audit snapshot: 2026-10-01, using `npm audit` against the existing lockfiles. These findings describe the current dependencies; no packages were upgraded as part of this review.

| Project | Findings | Details |
| --- | --- | --- |
| `frontend/web` | 0 | No findings reported. |
| `frontend/mobile` | 12 | 2 high, 10 moderate; 0 critical or low. |

The mobile findings are in Expo SDK 53 and its transitive dependency tree. The two high severity packages are `image-size` (infinite loops while parsing crafted JXL, HEIF, or ICNS images) and `postcss` (source map file disclosure and CSS output issues). Moderate findings affect `uuid` and Expo tooling packages: `xcode`, `@expo/config-plugins`, `@expo/config`, `@expo/cli`, `@expo/metro-config`, `@expo/prebuild-config`, `expo-asset`, `expo-constants`, and `expo` itself. npm reports these as package or dependency findings; the count does not mean 12 separate app code vulnerabilities.

Relevant advisories: [image-size JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [image-size ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [PostCSS source maps](https://github.com/advisories/GHSA-6g55-p6wh-862q), [PostCSS incomplete fix](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), [PostCSS path traversal](https://github.com/advisories/GHSA-r28c-9q8g-f849), [PostCSS CSS output](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), and [uuid bounds check](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

`npm audit` suggests Expo 57.0.26 for most mobile findings, which is a major SDK change from the project's SDK 53. Do not run `npm audit fix --force` or upgrade Expo automatically. Reassess the advisories and compatible fixes when planning an SDK upgrade; check Android SDK, Expo Go, and native build compatibility first. Re-run `npm audit` in each frontend directory before release because advisory data changes over time.
