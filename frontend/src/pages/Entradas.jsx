import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { canalesApi, entradasApi } from '../api/services';
import { formatDateMX, formatNumber, formatTipoGanado } from '../lib/date';
import { Card, PageHeader, Pill, Table } from '../components/ui';

export default function Entradas() {
  const navigate = useNavigate();
  const [lotes, setLotes] = useState([]);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([canalesApi.getLotes(), entradasApi.resumenPorLote()])
      .then(([lotesData, resumenData]) => {
        setLotes(lotesData);
        const map = {};
        resumenData.forEach((r) => { map[r.lote_id] = r; });
        setResumen(map);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Producto Terminado"
        subtitle="Selecciona un lote para capturar sus cajas de producto terminado"
      />

      <Card className="p-4">
        <Table
          columns={['Folio', 'Fecha', 'Tipo de ganado', 'Cajas capturadas', 'Kilos capturados', '']}
          rows={lotes}
          empty={!loading && lotes.length === 0 ? 'Sin lotes registrados — captura uno en Canales / Romaneaje' : null}
          renderRow={(l) => {
            const r = resumen[l.id];
            return (
              <tr key={l.id}>
                <td className="px-3 py-2 font-bold text-brand-600">{l.numero}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDateMX(l.fecha)}</td>
                <td className="px-3 py-2">{formatTipoGanado(l.tipo_ganado)}</td>
                <td className="px-3 py-2"><Pill tone="blue">{r?.num_cajas || 0}</Pill></td>
                <td className="px-3 py-2">{formatNumber(r?.kilos_total || 0, 2)}</td>
                <td className="px-3 py-2">
                  <button onClick={() => navigate(`/entradas/${l.id}`)} className="text-brand-600 hover:underline">
                    Capturar / continuar
                  </button>
                </td>
              </tr>
            );
          }}
          renderCard={(l) => {
            const r = resumen[l.id];
            return (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-brand-600">Lote {l.numero}</p>
                  <Pill tone="blue">{r?.num_cajas || 0} cajas</Pill>
                </div>
                <p className="mt-1 text-sm text-ink-700">{formatTipoGanado(l.tipo_ganado)}</p>
                <p className="text-sm text-ink-500">{formatDateMX(l.fecha)} · {formatNumber(r?.kilos_total || 0, 2)} kg</p>
                <button
                  onClick={() => navigate(`/entradas/${l.id}`)}
                  className="mt-3 w-full rounded-lg border border-cream-300 py-2 text-sm font-semibold text-brand-600 hover:bg-cream-100"
                >
                  Capturar / continuar
                </button>
              </div>
            );
          }}
        />
      </Card>
    </div>
  );
}
