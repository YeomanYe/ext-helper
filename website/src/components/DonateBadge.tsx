const PayPalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.067 8.478c.492.315.844.825.983 1.39.426 1.738-.505 3.723-2.138 4.535-.546.274-1.168.424-1.792.424H15.9l-.483 2.897H13.03l1.587-9.483h3.614c.7 0 1.36.1 1.836.237zm-5.353 4.673h1.023c.452 0 .866-.097 1.198-.273.612-.319.982-1.003.802-1.724-.09-.36-.31-.621-.627-.785-.268-.136-.607-.204-.963-.204h-.905l-.528 2.986zM9.703 8.478c.492.315.844.825.983 1.39.426 1.738-.505 3.723-2.138 4.535-.546.274-1.168.424-1.792.424H5.536l-.483 2.897H2.666l1.587-9.483h3.614c.7 0 1.36.1 1.836.237zm-5.353 4.673h1.023c.452 0 .866-.097 1.198-.273.612-.319.982-1.003.802-1.724-.09-.36-.31-.621-.627-.785-.268-.136-.607-.204-.963-.204H4.878l-.528 2.986z" />
  </svg>
)

export function DonateBadge() {
  return (
    <a
      href="https://paypal.me/exthelper"
      target="_blank"
      rel="noopener noreferrer"
      className="donate-badge"
      aria-label="Support Ext Helper via PayPal"
    >
      <PayPalIcon />
      <span className="donate-label">Support</span>
    </a>
  )
}
