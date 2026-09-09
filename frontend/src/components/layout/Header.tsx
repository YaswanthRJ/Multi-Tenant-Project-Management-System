import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-slate-200 bg-white px-6">
      <UserMenu />
    </header>
  );
}