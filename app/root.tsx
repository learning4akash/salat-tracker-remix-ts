import { cssBundleHref } from "@remix-run/css-bundle";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { AppProvider, InlineGrid, Divider, InlineStack, Avatar, Text, ButtonGroup, Button, Card, Bleed } from "@shopify/polaris";
import { URL } from 'url';
import { useState, useCallback } from 'react';
import setting from "./routes/setting"
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
  const getCookie = request.headers.get('Cookie');
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
          <Card>
          <InlineGrid columns={3} gap="400" alignItems="center">
            <div style={{ marginLeft: "100px"}}>
              <Text variant="headingXl" as="h4">Salat Tracker</Text>
            </div>
            <div>
              <InlineStack wrap={false} align="center" as="div" >
                <ButtonGroup>
                  <Button size="large" variant="plain">Dashboard</Button>
                  <Button size="large" url="/tracker" variant="plain" >Tracker</Button>
                  <Button url="/setting" variant="plain">Setting</Button>
                </ButtonGroup>
              </InlineStack>
            </div>
            <div style={{marginLeft: "200px"}}>
              <Avatar />
            </div>
          </InlineGrid>
          </Card>
          <Divider borderColor="border" />
        </AppProvider>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
