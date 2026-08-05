/**
 * EnvironmentBackground
 *
 * The fixed physical backdrop that the entire Mycroft interface floats inside.
 * It uses the real environment photograph (dark) and a daylight-derived asset
 * (light), each atmospherically graded so the image reads as an *environment*
 * rather than a wallpaper. Theme swap is purely CSS-driven (via the `.dark`
 * ancestor class) so there is no hydration flash and no per-frame JS.
 *
 * Sits at z-index:-10 with a transparent body above it, so every glass surface
 * can sample and refract it through `backdrop-filter`.
 */
export function EnvironmentBackground() {
  return (
    <div aria-hidden className="env-root">
      <div className="env-image env-image--light" />
      <div className="env-image env-image--dark" />
      <div className="env-grade" />
      <div className="env-vignette" />
    </div>
  )
}
