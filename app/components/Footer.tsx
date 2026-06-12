import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '56px 24px 28px',
      marginTop: '80px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '44px'
        }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #db2777, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                SkinMatch
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>BY</span>
            </div>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
              Подбор белорусской косметики с учетом вашего типа кожи и потребностей
            </p>
          </div>
          
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '14px', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Навигация</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px' }}><Link href="/catalog" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', transition: 'color 0.15s' }}>Каталог</Link></li>
              <li style={{ marginBottom: '8px' }}><Link href="/forum" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px' }}>Форум</Link></li>
              <li style={{ marginBottom: '8px' }}><Link href="/questionnaire" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px' }}>Анкета</Link></li>
              <li style={{ marginBottom: '8px' }}><Link href="/routine" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '14px' }}>Подбор рутины</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '14px', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Бренды</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Белита</li>
              <li style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Витекс</li>
              <li style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Маркелл</li>
              <li style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Liv Delano</li>
              <li style={{ marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>BelKosmex</li>
            </ul>
          </div>
          
          
        </div>

        <li style={{ marginBottom: '8px' }}>
  <Link href="/help" style={{ 
    color: '#cbd5e1', 
    textDecoration: 'none', 
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    Справка
  </Link>
</li>
        
        <div style={{
          borderTop: '1px solid #1e293b',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          color: '#64748b',
          fontSize: '13px'
        }}>
          <p style={{ margin: 0 }}>Сделано с любовью в Беларуси</p>
        </div>
      </div>
    </footer>
  );
}