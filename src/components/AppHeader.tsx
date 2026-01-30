import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Target, Settings, Users } from 'lucide-react';
import fitchLogo from '@/assets/fitch-logo.png';

const navItems = [
  { path: '/', label: 'Score', icon: Target },
  { path: '/setup', label: 'Setup', icon: Settings },
  { path: '/prospects', label: 'Prospects', icon: Users },
];

export function AppHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-8 py-4 bg-gradient-to-b from-background via-background/80 to-transparent"
      >
        <Link to="/" className="flex items-center gap-2">
          <motion.img
            src={fitchLogo}
            alt="Fitch"
            className="h-8 w-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          />
        </Link>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path} aria-current={isActive ? "page" : undefined} aria-label={item.label}>
                <motion.div
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </motion.div>
    </header>
  );
}
