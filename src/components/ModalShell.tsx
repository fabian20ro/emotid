import { useEffect, type ComponentProps, type ReactNode, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

type MotionDivProps = ComponentProps<typeof motion.div>

interface ModalShellProps {
  onClose: () => void
  focusTrapRef?: RefObject<HTMLDivElement | null>
  labelledBy?: string
  describedBy?: string
  backdropClassName?: string
  viewportClassName?: string
  panelClassName: string
  backdropProps?: Omit<MotionDivProps, 'className' | 'onClick'>
  panelProps?: Omit<
    MotionDivProps,
    'className' | 'onClick' | 'ref' | 'role' | 'aria-modal' | 'aria-labelledby' | 'aria-describedby'
  >
  children: ReactNode
}

export function ModalShell({
  onClose,
  focusTrapRef,
  labelledBy,
  describedBy,
  backdropClassName = 'dialog-backdrop',
  viewportClassName = 'dialog-viewport',
  panelClassName,
  backdropProps,
  panelProps,
  children,
}: ModalShellProps) {
  // Validate after the portal children commit; render-time checks report valid child targets as missing.
  useEffect(() => {
    if (labelledBy && !document.getElementById(labelledBy)) {
      console.warn('[ModalShell] labelledBy target not found:', labelledBy)
    }
    if (describedBy && !document.getElementById(describedBy)) {
      console.warn('[ModalShell] describedBy target not found:', describedBy)
    }
  }, [labelledBy, describedBy])
  const content = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        {...backdropProps}
        className={backdropClassName}
        onClick={onClose}
      />
      <div className={viewportClassName}>
        <motion.div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 25 }}
          {...panelProps}
          tabIndex={-1}
          className={panelClassName}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </>
  )

  if (typeof document === 'undefined') {
    return content
  }

  return createPortal(content, document.body)
}
