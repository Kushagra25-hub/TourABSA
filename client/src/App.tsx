import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NavPage } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { ReviewAnalysis } from './pages/ReviewAnalysis';
import { BulkAnalysis } from './pages/BulkAnalysis';
import { DatasetManagement } from './pages/DatasetManagement';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { HotelComparison } from './pages/HotelComparison';
import { ReviewExplorer } from './pages/ReviewExplorer';
import { ProjectMethodology } from './pages/ProjectMethodology';
import { AboutAndEvaluation } from './pages/AboutAndEvaluation';
import { api } from './services/api';

export function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('landing');
  const [systemStatus, setSystemStatus] = useState<{ connected: boolean; engine?: string }>({
    connected: false
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const checkStatus = async () => {
    try {
      const res = await api.checkHealth();
      setSystemStatus({
        connected: res.status === 'online',
        engine: res.nlp_service?.data?.engine || 'DeBERTa-v3 NLI'
      });
    } catch {
      setSystemStatus({ connected: false });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={(page) => setCurrentPage(page)} />;
      case 'analysis':
        return <ReviewAnalysis key={refreshKey} />;
      case 'bulk':
        return <BulkAnalysis key={refreshKey} />;
      case 'dataset':
        return <DatasetManagement key={refreshKey} />;
      case 'dashboard':
        return <AnalyticsDashboard key={refreshKey} />;
      case 'comparison':
        return <HotelComparison key={refreshKey} />;
      case 'explorer':
        return <ReviewExplorer key={refreshKey} />;
      case 'methodology':
        return <ProjectMethodology />;
      case 'evaluation':
        return <AboutAndEvaluation key={refreshKey} />;
      default:
        return <LandingPage onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onSelectPage={(page) => setCurrentPage(page)}
      onRefreshData={handleRefreshData}
    >
      {renderActivePage()}
    </Layout>
  );
}

export default App;
