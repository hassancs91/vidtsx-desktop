import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

export const compositionConfig = {
  id: 'HelloWorld',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
}

const HelloWorld = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Spring animation for scale
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 100,
    },
  })

  // Fade in opacity
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Rotating accent circle
  const rotation = interpolate(frame, [0, 150], [0, 360])

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFDF0',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Background accent circle */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          backgroundColor: '#FFE500',
          borderRadius: '50%',
          border: '4px solid #000',
          boxShadow: '8px 8px 0px #000',
          transform: `rotate(${rotation}deg)`,
        }}
      />

      {/* Main text */}
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: '#000',
            textAlign: 'center',
            margin: 0,
            textShadow: '6px 6px 0px #FF6B6B',
          }}
        >
          Hello World
        </h1>
        <p
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: '#000',
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          VidTSX Desktop
        </p>
      </div>

      {/* Decorative shapes */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          right: 150,
          width: 80,
          height: 80,
          backgroundColor: '#4ECDC4',
          border: '3px solid #000',
          boxShadow: '4px 4px 0px #000',
          transform: `rotate(${frame * 2}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 180,
          width: 60,
          height: 60,
          backgroundColor: '#FF6B6B',
          borderRadius: '50%',
          border: '3px solid #000',
          boxShadow: '4px 4px 0px #000',
        }}
      />
    </AbsoluteFill>
  )
}

export default HelloWorld
