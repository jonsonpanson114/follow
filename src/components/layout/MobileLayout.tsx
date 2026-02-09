import './MobileLayout.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="mobile-layout">
      <div className="mobile-container">
        {children}
      </div>
    </div>
  );
};
