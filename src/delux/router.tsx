// @ts-nocheck -- ported as-is from the original project
// Small routing layer used by the Delux screens, built on TanStack Router.
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter, useRouterState } from '@tanstack/react-router';

type NavOpts = { replace?: boolean; state?: unknown };

export function useLocation() {
  const loc = useRouterState({ select: (s) => s.location });
  return { pathname: loc.pathname, search: loc.searchStr, hash: loc.hash, state: (loc.state as any)?.__delux };
}

export function useNavigate() {
  const router = useRouter();
  return React.useCallback(
    (to: string | number, opts?: NavOpts) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      router.navigate({ href: to, replace: opts?.replace, state: { __delux: opts?.state } as any });
    },
    [router],
  );
}

export function useSearchParams(): [URLSearchParams, (p: URLSearchParams | Record<string, string>) => void] {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const set = (p: URLSearchParams | Record<string, string>) => {
    const sp = p instanceof URLSearchParams ? p : new URLSearchParams(p);
    const q = sp.toString();
    navigate(pathname + (q ? `?${q}` : ''));
  };
  return [params, set];
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to]);
  return null;
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
  to: string;
  replace?: boolean;
  className?: string | ((s: { isActive: boolean }) => string);
  children?: React.ReactNode | ((s: { isActive: boolean }) => React.ReactNode);
};

function BaseLink({ to, replace, className, children, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const path = to.split('?')[0];
  const isActive = pathname === path || pathname.startsWith(path + '/');
  return (
    <a
      {...rest}
      href={to}
      className={typeof className === 'function' ? className({ isActive }) : className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
}

export const Link = BaseLink;
export const NavLink = BaseLink;

// ---- Routes / Route / Outlet ----
const OutletCtx = createContext<React.ReactNode>(null);
const ParamsCtx = createContext<Record<string, string>>({});

export function Outlet() {
  return <>{useContext(OutletCtx)}</>;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string>>(): T {
  return useContext(ParamsCtx) as T;
}

type RouteProps = { path?: string; index?: boolean; element?: React.ReactNode; children?: React.ReactNode };
export function Route(_props: RouteProps): null {
  return null;
}

const join = (a: string, b: string) => ('/' + [a, b].join('/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1');

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  if (pattern.endsWith('*')) return {};
  const pp = pattern.split('/').filter(Boolean);
  const sp = pathname.split('/').filter(Boolean);
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
    else if (pp[i] !== sp[i]) return null;
  }
  return params;
}

function resolve(children: React.ReactNode, pathname: string, base: string): { el: React.ReactNode; params: Record<string, string> } | null {
  const list = React.Children.toArray(children) as React.ReactElement<RouteProps>[];
  for (const child of list) {
    const { path = '', index, element, children: nested } = child.props;
    const full = index ? base : path.startsWith('/') ? path : join(base, path);
    if (nested) {
      const inner = resolve(nested, pathname, full);
      if (inner) {
        return { el: <OutletCtx.Provider value={inner.el}>{element}</OutletCtx.Provider>, params: inner.params };
      }
      continue;
    }
    const params = matchPath(full, pathname);
    if (params) return { el: element, params };
  }
  return null;
}

export function Routes({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const m = resolve(children, pathname, '/');
  if (!m) return null;
  return <ParamsCtx.Provider value={m.params}>{m.el}</ParamsCtx.Provider>;
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
