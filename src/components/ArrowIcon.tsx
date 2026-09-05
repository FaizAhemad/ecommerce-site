type ArrowIconProps = { direction: 'left' | 'right' }

export function ArrowIcon({ direction }: ArrowIconProps) {
  return <svg aria-hidden="true" className="arrow-icon" viewBox="0 0 20 20" fill="none"><path d={direction === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
