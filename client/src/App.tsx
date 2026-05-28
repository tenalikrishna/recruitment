import { Router, Route, Switch, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { AdminAuthProvider } from "./lib/auth";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import ApplicantsPage from "./pages/applicants";
import InterviewPage from "./pages/interview";
import UsersPage from "./pages/users";

export default function App() {
  return (
    <AdminAuthProvider>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/applicants" component={ApplicantsPage} />
          <Route path="/interview/:id" component={InterviewPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </Router>
    </AdminAuthProvider>
  );
}
