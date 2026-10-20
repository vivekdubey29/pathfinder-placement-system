import { Route, Routes } from 'react-router-dom'
import { ToastViewport } from './components/common/ToastViewport.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import { PublicLayout } from './components/layout/PublicLayout.jsx'
import { AppStateProvider } from './context/AppStateContext.jsx'
import ApplicationTrackerPage from './pages/ApplicationTrackerPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import InternshipDetailsPage from './pages/InternshipDetailsPage.jsx'
import InternshipExplorerPage from './pages/InternshipExplorerPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RecommendationsPage from './pages/RecommendationsPage.jsx'

// BrowserRouter lives in main.jsx, so it is not repeated here.
function App() {
    return (
        <AppStateProvider>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route index element={<LandingPage />} />
                </Route>

                <Route element={<AppShell />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="internships" element={<InternshipExplorerPage />} />
                    <Route path="internships/:internshipId" element={<InternshipDetailsPage />} />
                    <Route path="recommendations" element={<RecommendationsPage />} />
                    <Route path="applications" element={<ApplicationTrackerPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ToastViewport />
        </AppStateProvider>
    )
}

export default App