import { Link } from 'react-router-dom';
import { Button, Wordmark } from '@wishly/ui';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="inline-flex">
          <Wordmark />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            to="/templates"
            className="text-secondary-foreground transition-colors hover:text-foreground"
          >
            Mẫu thiệp 
          </Link>
          <Link
            to="/#gia"
            className="hidden text-secondary-foreground transition-colors hover:text-foreground sm:inline"
          >
            Bảng giá
          </Link>
          <Button asChild size="sm">
            <Link to="/create">Tạo thiệp</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
