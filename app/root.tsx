import { cssBundleHref } from "@remix-run/css-bundle"; 
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { AppProvider, InlineStack, Avatar, Text, ButtonGroup, Button, Card,  Bleed} from "@shopify/polaris";
import { URL } from 'url';
import '@shopify/polaris/build/esm/styles.css';

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const getCookie  = request.headers.get('Cookie');
  if ((!getCookie) && url.pathname !== '/setting') {
      return redirect("/setting");
  }
  return {}
}

export const links = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <AppProvider i18n={{}}>
          <Bleed marginInline="500">
          <InlineStack wrap={ false } align="space-around">
              <div></div>
              <div>
                <Text variant="heading3xl" as="h2">Salat Tracker</Text>
              </div>
              <div style={{ marginTop: "10px"}}>
                <Avatar />
              </div>
          </InlineStack>
          </Bleed> 
          {/* <hr /> */}
          <Card roundedAbove='sm'>
          <InlineStack wrap={ false } align="center" >
          <ButtonGroup>
            <Button>Dashboard</Button>
            <Button url="/tracker" >Tracker</Button>
            <Button url="/setting">Setting</Button>
          </ButtonGroup>
          </InlineStack>
          </Card>
        </AppProvider>          
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
