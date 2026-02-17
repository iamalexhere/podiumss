import type { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';

import { AuthProvider } from './features/auth/useAuth';
import Header from './components/layout/Header';
import Home from './features/events/EventList';
import Leaderboard from './features/leaderboard/Leaderboard';
import AdminDashboard from './features/events/AdminDashboard';
import EventManage from './features/events/EventManage';
import GroupManage from './features/participants/GroupManage';
import GameManage from './features/games/GameManage';
import UserManage from './features/users/UserManage';
import Login from './features/auth/Login';

const App: Component = () => {
  return (
    <AuthProvider>
      <Router root={(props) => (
        <div class="app">
          <Header />
          <main class="main-content">
            {props.children}
          </main>
        </div>
      )}>
        <Route path="/" component={Home} />
        <Route path="/live/:slug" component={Leaderboard} />
        <Route path="/login" component={Login} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={UserManage} />
        <Route path="/admin/events/:id" component={EventManage} />
        <Route path="/admin/events/:id/groups" component={GroupManage} />
        <Route path="/admin/events/:id/games" component={GameManage} />
      </Router>
    </AuthProvider>
  );
};

export default App;