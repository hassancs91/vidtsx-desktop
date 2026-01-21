import { Composition, Folder } from 'remotion'

// Dynamic composition imports will be added here by the render service
// For now, we register a placeholder composition

const PlaceholderComposition = () => (
  <div style={{
    flex: 1,
    backgroundColor: '#FFFDF0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
    fontSize: 48,
    fontWeight: 800,
  }}>
    VidTSX Desktop
  </div>
)

export const Root = () => {
  return (
    <>
      <Folder name="System">
        <Composition
          id="Placeholder"
          component={PlaceholderComposition}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  )
}
