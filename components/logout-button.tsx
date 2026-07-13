import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        ログアウト
      </Button>
    </form>
  );
}
