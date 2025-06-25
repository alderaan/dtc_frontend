import { Authenticated, Refine } from "@refinedev/core";
import { RefineSnackbarProvider, ThemedLayoutV2, useNotificationProvider, ErrorComponent, AuthPage } from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import routerBindings, { CatchAllNavigate, DocumentTitleHandler, NavigateToResource, UnsavedChangesNotifier } from "@refinedev/react-router";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { BrowserRouter, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, ReactNode } from "react";
import authProvider from "./authProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { DtcProfilesList } from "./pages/dtc-profiles/list";
import { supabaseClient } from "./utility";
import { Title } from "./components/Title";
import { ConfigProvider } from "antd";
import { UserOutlined } from "@ant-design/icons";

/**
 * A component that listens for Supabase auth events to handle flows
 * initiated outside the app (e.g., password reset emails).
 */
const SupabaseAuthListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for changes in authentication state
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      // When Supabase confirms password recovery from a link, it fires this event.
      // We then programmatically navigate the user to the update password page.
      if (event === "PASSWORD_RECOVERY") {
        navigate("/update-password");
      }
    });

    // Cleanup function to unsubscribe when the component unmounts.
    // This is crucial for preventing memory leaks and side-effects.
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return null; // This component does not render any UI
};

function App() {
  return (
    <BrowserRouter>
      {/* This listener must be inside BrowserRouter to use navigation hooks */}
      <SupabaseAuthListener />
      <ColorModeContextProvider>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <ConfigProvider
            theme={{
              components: {
                Dropdown: {
                  zIndexPopup: 1300,
                },
                Select: {
                  zIndexPopup: 1301,
                },
              },
            }}
          >
            <Refine
              dataProvider={dataProvider(supabaseClient)}
              liveProvider={liveProvider(supabaseClient)}
              authProvider={authProvider}
              routerProvider={routerBindings}
              notificationProvider={useNotificationProvider}
              resources={[
                {
                  name: "dtc_profiles_with_latest_details",
                  list: "/dtc-profiles",
                  meta: {
                    label: "DTC Profiles",
                    icon: <UserOutlined />,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated key="auth-pages" fallback={<Outlet />}>
                      <NavigateToResource />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<AuthPage type="login" />} />
                  <Route path="/register" element={<AuthPage type="register" />} />
                  <Route path="/forgot-password" element={<AuthPage type="forgotPassword" />} />
                </Route>

                <Route path="/update-password" element={<AuthPage type="updatePassword" />} />

                <Route
                  element={
                    <Authenticated key="protected-pages" fallback={<CatchAllNavigate to="/login" />}>
                      <ThemedLayoutV2 Header={Header} Title={({ collapsed }: { collapsed: boolean }): ReactNode => <Title collapsed={collapsed} />}>
                        <Outlet />
                      </ThemedLayoutV2>
                    </Authenticated>
                  }
                >
                  <Route index element={<NavigateToResource resource="dtc_profiles_with_latest_details" />} />
                  <Route path="/dtc-profiles">
                    <Route index element={<DtcProfilesList />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </ConfigProvider>
        </RefineSnackbarProvider>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
}

export default App;
