import { Compass } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/misc';

export default function NotFound() {
  return (
    <PageShell className="max-w-2xl">
      <EmptyState icon={Compass} title="This page took a wrong turn" description="The link may be broken or the page may have moved." action={<Button to="/">Back home</Button>} />
    </PageShell>
  );
}
