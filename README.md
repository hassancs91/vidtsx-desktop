# VidTSX Desktop

A simple Electron desktop app for rendering TSX compositions to video.

## Setup

1. Install main dependencies:
```bash
cd vidtsx-desktop
npm install
```

2. Install Remotion dependencies:
```bash
cd remotion
npm install
cd ..
```

## Development

Run the app in development mode:
```bash
npm run electron:dev
```

## Usage

1. Click "Browse" to select a TSX file
2. Choose output format (MP4 or MOV)
3. Click "Render Video"
4. Select where to save the output
5. Wait for render to complete

## TSX File Requirements

Your TSX file must export a `compositionConfig` object and a default component:

```tsx
import { AbsoluteFill } from 'remotion'

export const compositionConfig = {
  id: 'MyComposition',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
}

const MyComposition = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFFDF0' }}>
      {/* Your content */}
    </AbsoluteFill>
  )
}

export default MyComposition
```

## Sample

A sample TSX file is included in `samples/HelloWorld.tsx` for testing.

## Build

Build the app for distribution:
```bash
npm run build
```

The packaged app will be in the `release` folder.

<!-- lwh-footer -->

---

## 📘 The free book

This repo is one thing I built with AI. The book is the system underneath it.

**[Vibe Engineering Blocks](https://learnwithhasan.com/blocks/)** is my free 74-page book.
47 building blocks for shipping real apps with AI. One block per page, each with the exact
prompt to hand your AI.

Built by **[Hasan Aboul Hasan](https://learnwithhasan.com)**. I build real products with AI and
write down exactly how.
[Guides](https://learnwithhasan.com/guides/) &nbsp;·&nbsp;
[YouTube](https://www.youtube.com/@HasanAboulHasan) &nbsp;·&nbsp;
[Community](https://learnwithhasan.com/community/)
