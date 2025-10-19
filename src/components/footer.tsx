import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const links = [
    { name: 'Courses', href: '/courses' },
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Privacy Policy', href: '#' },
  ];

  return (
    <footer className="bg-card/50 border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-muted-foreground text-sm">
              Learn to Code, Playfully. Your journey from video to code, the AI way.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin /></Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border/50 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} CodeVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
