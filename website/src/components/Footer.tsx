import { config } from "../config"

const LINKS = [
  { label: "GitHub", href: config.githubUrl },
  { label: "Issues", href: `${config.githubUrl}/issues` },
  { label: "Privacy", href: "./privacy/" },
  { label: "License", href: `${config.githubUrl}/blob/master/LICENSE` },
  { label: "Donate", href: "https://www.paypal.com/paypalme/yeomanye" },
]

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-logo">
            <span className="footer-logo-name">ExtHelper</span>
            <span className="footer-logo-copy">
              &copy; {new Date().getFullYear()} Ext Helper. MIT License.
            </span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="footer-system" aria-hidden="true">
            SYS: <span>ONLINE</span> &nbsp;|&nbsp; BUILD: <span>STABLE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
