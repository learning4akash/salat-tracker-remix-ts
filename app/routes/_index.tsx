import { LoaderFunctionArgs, redirect } from "@remix-run/node";
export async function loader({ request }: LoaderFunctionArgs) {
  const getCookie: string | null = request.headers.get('Cookie');
  if (getCookie) {
    return redirect("/tracker");
  }
  return redirect("/setting");
}