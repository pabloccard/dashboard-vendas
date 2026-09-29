import { CountryStat } from '@/types';

type CountryTableProps = {
  data: CountryStat[];
  loading: boolean;
};

// Map ISO codes to country names
const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  US: 'Estados Unidos',
  PT: 'Portugal',
  MX: 'México',
  ES: 'Espanha',
  CO: 'Colômbia',
  PE: 'Peru',
  CL: 'Chile',
  AR: 'Argentina',
  EC: 'Equador',
  BO: 'Bolívia',
  UY: 'Uruguai',
  PY: 'Paraguai',
  VE: 'Venezuela',
  Desconhecido: 'Desconhecido',
};

// Map ISO codes to flags
const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷',
  US: '🇺🇸',
  PT: '🇵🇹',
  MX: '🇲🇽',
  ES: '🇪🇸',
  CO: '🇨🇴',
  PE: '🇵🇪',
  CL: '🇨🇱',
  AR: '🇦🇷',
  EC: '🇪🇨',
  BO: '🇧🇴',
  UY: '🇺🇾',
  PY: '🇵🇾',
  VE: '🇻🇪',
  Desconhecido: '🏳️',
};

export default function CountryTable({ data, loading }: CountryTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Vendas por País</span>
        </div>
        <div className="card-body" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Vendas por País</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌍</div>
            <p className="empty-state-text">Nenhuma venda registrada neste período</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>País</th>
                  <th style={{ width: '40%' }}>Produto</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Qtd</th>
                </tr>
              </thead>
              <tbody>
                {data.map((stat, i) => {
                  const countryCode = stat.country.toUpperCase();
                  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
                  const countryFlag = COUNTRY_FLAGS[countryCode] || '🏳️';
                  
                  return (
                    <tr key={`${stat.country}_${stat.product}_${i}`}>
                      <td>
                        <span style={{ marginRight: '8px' }}>{countryFlag}</span>
                        {countryName}
                      </td>
                      <td>{stat.product}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{stat.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
