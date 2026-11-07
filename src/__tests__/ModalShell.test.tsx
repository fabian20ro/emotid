import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ModalShell } from '../components/ModalShell'
import { useFocusTrap } from '../hooks/useFocusTrap'

const panelClassName = 'test-panel'

function EmptyDialog() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const trap = useFocusTrap(open, () => setOpen(false), undefined, trigger)
  return <>
    <button ref={trigger} onClick={() => setOpen(true)}>Open</button>
    <button>Background action</button>
    {open && <ModalShell onClose={() => setOpen(false)} focusTrapRef={trap} labelledBy="empty-title" panelClassName={panelClassName}>
      <h2 id="empty-title">Working</h2>
      <button disabled>Wait</button>
    </ModalShell>}
  </>
}

it('keeps focus inside a dialog without enabled actions and restores its opener', async () => {
  const user = userEvent.setup()
  render(<EmptyDialog />)
  await user.click(screen.getByRole('button', { name: 'Open' }))
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveFocus()
  await user.tab()
  expect(dialog).toHaveFocus()
  await user.tab({ shift: true })
  expect(dialog).toHaveFocus()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus())
})

describe('ModalShell ARIA references', () => {
  it('does not warn when its portal children provide the label and description', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <ModalShell
        onClose={() => {}}
        labelledBy="modal-title"
        describedBy="modal-description"
        panelClassName={panelClassName}
      >
        <h2 id="modal-title">Title</h2>
        <p id="modal-description">Description</p>
      </ModalShell>,
    )

    await waitFor(() => expect(document.getElementById('modal-title')).toBeInTheDocument())
    expect(consoleWarn).not.toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  it('warns after commit when a referenced label is genuinely absent', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <ModalShell onClose={() => {}} labelledBy="missing-title" panelClassName={panelClassName}>
        <p>Content without a heading</p>
      </ModalShell>,
    )

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith('[ModalShell] labelledBy target not found:', 'missing-title')
    })
    consoleWarn.mockRestore()
  })

  it('sets dialog role and aria-labelledby on the panel', () => {
    render(
      <ModalShell
        onClose={() => {}}
        labelledBy="modal-title"
        describedBy="modal-description"
        panelClassName={panelClassName}
      >
        <h2 id="modal-title">Title</h2>
        <p id="modal-description">Description</p>
      </ModalShell>,
    )

    const panel = document.querySelector(`.${panelClassName}`) as HTMLElement
    expect(panel).toHaveAttribute('role', 'dialog')
    expect(panel).toHaveAttribute('aria-modal', 'true')
    expect(panel).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(panel).toHaveAttribute('aria-describedby', 'modal-description')
  })
})
