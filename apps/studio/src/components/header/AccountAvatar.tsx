import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { greetNameFrom } from '../../lib/greet-name';

/** Header slot for routes that show the signed-in user. Shares the page's query cache. */
export function AccountAvatar() {
  const me = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.me(),
    retry: false,
  });
  const initials = greetNameFrom(me.data?.user?.name).slice(0, 2).toUpperCase();

  return (
    <span
      className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-primary"
      aria-hidden
    >
      {initials}
    </span>
  );
}

export default AccountAvatar;
