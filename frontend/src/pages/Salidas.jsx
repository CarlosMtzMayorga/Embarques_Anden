import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salidasApi } from '../api/services';
import { formatDateMX, formatNumber } from '../lib/date';
import { Button, Card, PageHeader, Pill, Table } from '../components/ui';
import { imprimirFormatoSalida } from '../lib/imprimirSalida';

export default function Salidas() {
  const navigate = useNavigate();
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imprimiendoFolio, setImprimiendoFolio] = useState(null);

  useEffect(() => {
    salidasApi.list().then(setSalidas).finally(() => setLoading(false));
  }, []);

  const folios = useMemo(() => {
    const grupos = new Map();
    for (const s of salidas) {
      if (!grupos.has(s.folio)) {
        grupos.set(s.folio, { folio: s.folio, fecha: s.fecha, cliente_nombre: s.cliente_nombre, cajas: 0, kilos: 0 });
      }
      const g = grupos.get(s.folio);
      g.cajas += Number(s.cajas || 0);
      g.kilos += Number(s.kilos || 0);
    }
    return [...grupos.values()].sort((a, b) => b.folio - a.folio);
  }, [salidas]);

  async function handleImprimir(f) {
    try {
      setImprimiendoFolio(f.folio);
      const items = await salidasApi.list({ folio: f.folio });
      if (!items.length) {
        alert('Este folio no tiene cajas registradas para imprimir.');
        return;
      }
      imprimirFormatoSalida({
        folio: f.folio,
        fecha: f.fecha,
        cliente_nombre: f.cliente_nombre,
        entregado_por: items[0]?.entregado_por || '',
        observaciones: items[0]?.observaciones || '',
        items,
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar la información para imprimir.');
    } finally {
      setImprimiendoFolio(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Salidas"
        subtitle="Embarques registrados — cada folio agrupa varias cajas"
        actions={
          <Button variant="primary" onClick={() => navigate('/salidas/nuevo')}>
            + Nueva salida
          </Button>
        }
      />

      <Card className="p-4">
        <Table
          columns={['Folio', 'Fecha', 'Cliente', 'Cajas', 'Kilos', 'Acciones']}
          rows={folios}
          keyField="folio"
          empty={!loading && folios.length === 0 ? 'Sin salidas registradas — usa "Nueva salida" para empezar' : null}
          renderRow={(f) => (
            <tr key={f.folio}>
              <td className="px-3 py-2 font-bold text-brand-600">#{f.folio}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatDateMX(f.fecha)}</td>
              <td className="px-3 py-2 font-medium">{f.cliente_nombre}</td>
              <td className="px-3 py-2"><Pill tone="blue">{f.cajas}</Pill></td>
              <td className="px-3 py-2 font-mono">{formatNumber(f.kilos, 2)} kg</td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => navigate(`/salidas/${f.folio}`)}
                    className="text-brand-600 hover:underline font-medium text-xs sm:text-sm"
                  >
                    Ver / continuar
                  </button>
                  <button
                    onClick={() => handleImprimir(f)}
                    disabled={imprimiendoFolio === f.folio}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors shadow-sm"
                    title="Imprimir formato de embarque o guardar PDF"
                  >
                    {imprimiendoFolio === f.folio ? '⏳ Cargando…' : '🖨️ Imprimir formato'}
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderCard={(f) => (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-brand-600">Folio #{f.folio}</p>
                <Pill tone="blue">{f.cajas} cajas</Pill>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-900">{f.cliente_nombre}</p>
              <p className="text-sm text-ink-500">{formatDateMX(f.fecha)} · {formatNumber(f.kilos, 2)} kg</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate(`/salidas/${f.folio}`)}
                  className="flex-1 rounded-lg border border-cream-300 py-2 text-sm font-semibold text-brand-600 hover:bg-cream-100"
                >
                  Ver / continuar
                </button>
                <button
                  onClick={() => handleImprimir(f)}
                  disabled={imprimiendoFolio === f.folio}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 flex items-center justify-center gap-1 shadow-sm"
                >
                  🖨️ {imprimiendoFolio === f.folio ? 'Cargando…' : 'Imprimir'}
                </button>
              </div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
