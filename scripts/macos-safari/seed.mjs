export const NATIVE_SAFARI_ACTIVATION_PROBE = Object.freeze({
  button: '[data-testid="native-safari-activation-probe"]',
  state: '[data-testid="native-safari-activation-state"]',
})

export const NATIVE_SAFARI_SEED_HTML = `<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>Native Safari audit seed</title>
  <button type="button" data-testid="native-safari-activation-probe">Activate probe</button>
  <output data-testid="native-safari-activation-state" data-state="idle">idle</output>
  <script>
    const probe = document.querySelector('[data-testid="native-safari-activation-probe"]')
    const state = document.querySelector('[data-testid="native-safari-activation-state"]')
    probe.addEventListener('click', () => {
      state.dataset.state = 'activated'
      state.value = 'activated'
    })
  </script>
</html>`
